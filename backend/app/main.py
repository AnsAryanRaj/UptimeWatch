import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, Base, get_db, SessionLocal
from .models import Website, CheckHistory
from .schemas import (
    WebsiteCreate,
    WebsiteResponse,
    CheckHistoryResponse,
    StatsResponse,
)
from .checker import check_single_website
from .metrics import sync_sites_status_metrics

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uptimewatch")

# Create tables
Base.metadata.create_all(bind=engine)

# Background worker flag
bg_task_running = True


async def background_monitoring_loop():
    """Periodically checks monitored websites that are due for a health check."""
    logger.info("Background uptime monitoring service started.")
    while bg_task_running:
        try:
            db = SessionLocal()
            try:
                active_sites = db.query(Website).filter(Website.is_active == True).all()
                now = datetime.utcnow()
                for site in active_sites:
                    should_check = False
                    if site.last_checked_at is None:
                        should_check = True
                    else:
                        seconds_since_check = (now - site.last_checked_at).total_seconds()
                        if seconds_since_check >= (site.check_interval or 60):
                            should_check = True

                    if should_check:
                        logger.info(f"Running periodic check for: {site.url}")
                        await check_single_website(site, db)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error in background monitoring loop: {e}")

        # Sleep interval between scheduler sweeps
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # If in test mode, do not start background monitor
    if os.getenv("TESTING") == "1":
        yield
        return

    # Startup: sync initial metrics and start background monitor
    db = SessionLocal()
    try:
        sites = db.query(Website).all()
        sync_sites_status_metrics(sites)
    finally:
        db.close()

    task = asyncio.create_task(background_monitoring_loop())
    yield
    # Shutdown
    global bg_task_running
    bg_task_running = False
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="UptimeWatch API",
    description="DevOps Website Uptime Monitoring System API",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": "UptimeWatch Backend",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/metrics", tags=["Monitoring"])
def prometheus_metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/stats", response_model=StatsResponse, tags=["Stats"])
def get_stats(db: Session = Depends(get_db)):
    """Computes overall statistics: total sites, up/down counts, avg latency, uptime percentage."""
    sites = db.query(Website).all()
    total = len(sites)
    online = sum(1 for s in sites if s.status == "UP")
    offline = sum(1 for s in sites if s.status == "DOWN")
    pending = sum(1 for s in sites if s.status == "PENDING")

    # Average response time of active UP sites with valid times
    valid_times = [s.response_time_ms for s in sites if s.response_time_ms is not None and s.status == "UP"]
    avg_response_time = round(sum(valid_times) / len(valid_times), 2) if valid_times else 0.0

    checked_total = online + offline
    uptime_pct = round((online / checked_total) * 100, 1) if checked_total > 0 else 100.0

    return StatsResponse(
        total_monitored=total,
        online_count=online,
        offline_count=offline,
        pending_count=pending,
        avg_response_time_ms=avg_response_time,
        uptime_percentage=uptime_pct,
    )


@app.get("/api/websites", response_model=List[WebsiteResponse], tags=["Websites"])
def list_websites(db: Session = Depends(get_db)):
    """Returns all monitored websites."""
    sites = db.query(Website).order_by(Website.created_at.desc()).all()
    sync_sites_status_metrics(sites)
    return sites


@app.post("/api/websites", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED, tags=["Websites"])
async def create_website(payload: WebsiteCreate, db: Session = Depends(get_db)):
    """Adds a new website for monitoring and runs an immediate initial check."""
    existing = db.query(Website).filter(Website.url == payload.url).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Website with URL '{payload.url}' is already being monitored."
        )

    website = Website(
        name=payload.name.strip(),
        url=payload.url,
        check_interval=payload.check_interval or 60,
        status="PENDING"
    )
    db.add(website)
    db.commit()
    db.refresh(website)

    # Perform immediate check
    await check_single_website(website, db)
    return website


@app.get("/api/websites/{website_id}", response_model=WebsiteResponse, tags=["Websites"])
def get_website(website_id: int, db: Session = Depends(get_db)):
    """Gets details for a single website."""
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")
    return website


@app.delete("/api/websites/{website_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Websites"])
def delete_website(website_id: int, db: Session = Depends(get_db)):
    """Deletes a website and all its check history."""
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")
    db.delete(website)
    db.commit()

    all_sites = db.query(Website).all()
    sync_sites_status_metrics(all_sites)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/websites/{website_id}/check", response_model=WebsiteResponse, tags=["Websites"])
async def check_website_now(website_id: int, db: Session = Depends(get_db)):
    """Manually triggers an immediate health check on a specific website."""
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    await check_single_website(website, db)
    return website


@app.post("/api/check-all", tags=["Websites"])
async def check_all_websites(db: Session = Depends(get_db)):
    """Manually triggers an immediate check for all active websites."""
    sites = db.query(Website).filter(Website.is_active == True).all()
    for site in sites:
        await check_single_website(site, db)
    return {"message": f"Triggered checks for {len(sites)} websites.", "count": len(sites)}


@app.get("/api/websites/{website_id}/history", response_model=List[CheckHistoryResponse], tags=["Websites"])
def get_website_history(
    website_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves recent check history logs for a website."""
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    history = (
        db.query(CheckHistory)
        .filter(CheckHistory.website_id == website_id)
        .order_by(CheckHistory.checked_at.desc())
        .limit(limit)
        .all()
    )
    return history
