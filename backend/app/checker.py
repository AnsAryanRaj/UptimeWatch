import time
from datetime import datetime
import httpx
from sqlalchemy.orm import Session
from .models import Website, CheckHistory
from .metrics import update_metrics_for_check, sync_sites_status_metrics


async def check_single_website(website: Website, db: Session) -> CheckHistory:
    """
    Performs an HTTP GET request to check website availability, measures response time,
    updates website status in DB, and records a check history entry.
    """
    start_time = time.perf_counter()
    status = "DOWN"
    status_code = None
    response_time_ms = None
    error_message = None

    headers = {
        "User-Agent": "UptimeWatch-Bot/1.0 (+https://github.com/uptimewatch)"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            response = await client.get(website.url, headers=headers)
            elapsed = (time.perf_counter() - start_time) * 1000.0
            response_time_ms = round(elapsed, 2)
            status_code = response.status_code

            # Consider 2xx and 3xx as UP
            if 200 <= response.status_code < 400:
                status = "UP"
            else:
                status = "DOWN"
                error_message = f"HTTP {response.status_code} {response.reason_phrase}"

    except httpx.ConnectTimeout:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        response_time_ms = round(elapsed, 2)
        status = "DOWN"
        error_message = "Connection timed out (10s)"
    except httpx.ReadTimeout:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        response_time_ms = round(elapsed, 2)
        status = "DOWN"
        error_message = "Read timed out"
    except httpx.ConnectError as e:
        status = "DOWN"
        error_message = f"Connection failed (DNS or host unreachable): {str(e)}"
    except httpx.UnsupportedProtocol:
        status = "DOWN"
        error_message = "Unsupported URL protocol"
    except Exception as e:
        status = "DOWN"
        error_message = f"Check failed: {str(e)}"

    # Update website record
    now = datetime.utcnow()
    website.status = status
    website.status_code = status_code
    website.response_time_ms = response_time_ms
    website.error_message = error_message
    website.last_checked_at = now

    # Create check history log
    history_entry = CheckHistory(
        website_id=website.id,
        checked_at=now,
        status=status,
        status_code=status_code,
        response_time_ms=response_time_ms,
        error_message=error_message,
    )
    db.add(history_entry)

    # Prune older history beyond latest 50 entries for this website
    older_ids = (
        db.query(CheckHistory.id)
        .filter(CheckHistory.website_id == website.id)
        .order_by(CheckHistory.checked_at.desc())
        .offset(50)
        .all()
    )
    if older_ids:
        ids_to_delete = [item[0] for item in older_ids]
        db.query(CheckHistory).filter(CheckHistory.id.in_(ids_to_delete)).delete(synchronize_session=False)

    db.commit()
    db.refresh(website)

    # Update Prometheus metrics
    update_metrics_for_check(
        url=website.url,
        name=website.name,
        status=status,
        response_time_ms=response_time_ms
    )

    all_sites = db.query(Website).all()
    sync_sites_status_metrics(all_sites)

    return history_entry
