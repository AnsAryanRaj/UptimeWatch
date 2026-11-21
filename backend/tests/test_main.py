import os

# Set testing environment before importing app
os.environ["TESTING"] = "1"

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Website, CheckHistory

# Use in-memory SQLite with StaticPool so all threads/sessions share the same in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "UptimeWatch Backend"


def test_prometheus_metrics():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "uptimewatch_sites_by_status" in response.text


@patch("app.main.check_single_website", new_callable=AsyncMock)
def test_create_and_list_websites(mock_check):
    async def fake_check(website, db):
        website.status = "UP"
        website.status_code = 200
        website.response_time_ms = 45.2
        db.commit()
        db.refresh(website)
        return website

    mock_check.side_effect = fake_check

    # Create website
    payload = {
        "name": "Google",
        "url": "https://www.google.com",
        "check_interval": 60
    }
    response = client.post("/api/websites", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Google"
    assert data["url"] == "https://www.google.com"
    assert data["status"] == "UP"
    assert data["status_code"] == 200

    # Duplicate check
    dup_resp = client.post("/api/websites", json=payload)
    assert dup_resp.status_code == 400

    # List websites
    list_resp = client.get("/api/websites")
    assert list_resp.status_code == 200
    sites = list_resp.json()
    assert len(sites) == 1
    assert sites[0]["name"] == "Google"


@patch("app.main.check_single_website", new_callable=AsyncMock)
def test_stats_endpoint(mock_check):
    async def fake_check(website, db):
        website.status = "UP"
        website.status_code = 200
        website.response_time_ms = 50.0
        db.commit()
        db.refresh(website)
        return website

    mock_check.side_effect = fake_check

    client.post("/api/websites", json={"name": "Site 1", "url": "https://example.com"})

    stats_resp = client.get("/api/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_monitored"] == 1
    assert stats["online_count"] == 1
    assert stats["offline_count"] == 0
    assert stats["uptime_percentage"] == 100.0


@patch("app.main.check_single_website", new_callable=AsyncMock)
def test_manual_check_and_history(mock_check):
    async def fake_check(website, db):
        website.status = "UP"
        website.status_code = 200
        website.response_time_ms = 25.0
        history = CheckHistory(
            website_id=website.id,
            status="UP",
            status_code=200,
            response_time_ms=25.0
        )
        db.add(history)
        db.commit()
        db.refresh(website)
        return history

    mock_check.side_effect = fake_check

    create_resp = client.post("/api/websites", json={"name": "Test Site", "url": "https://site.org"})
    site_id = create_resp.json()["id"]

    # Trigger manual check
    check_resp = client.post(f"/api/websites/{site_id}/check")
    assert check_resp.status_code == 200

    # Fetch history
    history_resp = client.get(f"/api/websites/{site_id}/history")
    assert history_resp.status_code == 200
    logs = history_resp.json()
    assert len(logs) >= 1
    assert logs[0]["status"] == "UP"


@patch("app.main.check_single_website", new_callable=AsyncMock)
def test_delete_website(mock_check):
    create_resp = client.post("/api/websites", json={"name": "Delete Me", "url": "https://del.com"})
    site_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/websites/{site_id}")
    assert del_resp.status_code == 204

    # Verify not found
    get_resp = client.get(f"/api/websites/{site_id}")
    assert get_resp.status_code == 404
