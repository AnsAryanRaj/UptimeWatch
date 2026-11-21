# 🌐 UptimeWatch – Website Uptime Monitoring System

**UptimeWatch** is a production-grade, containerized Website Uptime & Health Monitoring DevOps application. It enables teams to monitor website availability, track HTTP status codes and response latencies in real time, view historical check logs, and export Prometheus telemetry.

---

## 🚀 Key Features

- **Modern Real-Time Dashboard**: Clean, responsive dark-mode UI built with React, Vite, and Tailwind CSS.
- **Website Availability Checker**: Automated periodic HTTP health checks measuring response times in milliseconds and tracking HTTP status codes.
- **Manual "Check Now" Trigger**: Instant on-demand status check per website or across all monitored services at once.
- **Persistent Monitoring History**: SQLite storage tracking past health checks, latencies, and downtime causes.
- **Live Aggregated Metrics**: Real-time counter of total monitored, online, and offline endpoints plus average latency and uptime percentage.
- **Prometheus Telemetry Endpoint**: Native `/metrics` endpoint exposing Prometheus metrics for Grafana and alert monitoring.
- **Dockerized & Production Ready**: Fully containerized multi-stage Docker builds orchestrated via Docker Compose.
- **Automated CI/CD**: GitHub Actions pipeline for automated pytest execution, frontend compilation, and Docker image build verification.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, HTTPX, Pydantic v2 |
| **Database** | SQLite (persistent volume in `/data`) |
| **Monitoring** | Prometheus Client Metrics (`/metrics`) |
| **DevOps & Containers** | Docker, Docker Compose, Multi-stage builds, Nginx reverse proxy |
| **CI/CD** | GitHub Actions (`.github/workflows/ci.yml`) |
| **Testing** | Pytest, Pytest-Asyncio |

---

## 🏗️ System Architecture

```text
       Browser / User
             │
             ▼ Port 3000
    ┌────────────────────────────────────────┐
    │       uptimewatch-frontend             │
    │  - Nginx (Alpine)                      │
    │  - React Production SPA bundle         │
    │  - Reverse Proxy: /api/* & /metrics    │
    └──────────────────┬─────────────────────┘
                       │ Internal Docker Network (bridge)
                       ▼ Port 8000
    ┌────────────────────────────────────────┐
    │       uptimewatch-backend              │
    │  - FastAPI + Uvicorn                   │
    │  - Asynchronous HTTP Health Checker    │
    │  - Background Monitor Worker           │
    │  - Prometheus Metrics Exporter         │
    └──────────────────┬─────────────────────┘
                       │
                       ▼ Volume Mount (/data)
    ┌────────────────────────────────────────┐
    │         uptimewatch.db (SQLite)        │
    └────────────────────────────────────────┘
```

---

## 📂 Project Structure

```text
UptimeWatch/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD Pipeline
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── checker.py             # Async HTTP health checker & latency prober
│   │   ├── database.py            # SQLite database engine & session provider
│   │   ├── main.py                # FastAPI routes, lifespan background scheduler
│   │   ├── metrics.py             # Prometheus metrics definitions & counters
│   │   ├── models.py              # SQLAlchemy ORM models (Website, CheckHistory)
│   │   └── schemas.py             # Pydantic v2 data transfer schemas
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_main.py           # Backend pytest unit & integration tests
│   ├── Dockerfile                 # Python 3.10 slim container definition
│   ├── .dockerignore
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddWebsiteModal.jsx # Modal to add monitored URL
│   │   │   ├── HistoryModal.jsx    # Modal displaying latency logs & status history
│   │   │   ├── Navbar.jsx          # Top navigation & action buttons
│   │   │   ├── StatsOverview.jsx   # Summary cards (Total, Online, Offline, Latency)
│   │   │   └── WebsiteCard.jsx     # Individual website card with status badge & controls
│   │   ├── api.js                 # API client utilities
│   │   ├── App.jsx                # Main application dashboard
│   │   ├── index.css              # Tailwind CSS styles
│   │   └── main.jsx               # React entry point
│   ├── Dockerfile                 # Multi-stage Node builder + Nginx production image
│   ├── .dockerignore
│   ├── nginx.conf                 # Nginx routing and /api reverse proxy configuration
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml             # Docker Compose orchestration file
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start with Docker Compose

Ensure Docker and Docker Compose are installed on your system.

### 1. Build and Start the Application

From the root project directory (`D:\UptimeWatch`):

```bash
docker-compose up --build
```
*(or `docker compose up --build` if your Docker CLI supports compose v2 directly)*

To run in the background (detached mode):
```bash
docker-compose up -d --build
```

### 2. Access the Application

- **Dashboard UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Prometheus Metrics**: [http://localhost:8000/metrics](http://localhost:8000/metrics) (or [http://localhost:3000/metrics](http://localhost:3000/metrics))

### 3. Stop the Application

```bash
docker-compose down
```

To stop and remove persistent database volumes:
```bash
docker-compose down -v
```

---

## 💻 Local Development Setup (Without Docker)

### Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

To run the backend test suite:

```bash
cd backend
pytest -v
```

All 6 unit and integration tests validate:
- System `/health` endpoint
- Prometheus `/metrics` export
- Creation and duplication prevention for website URLs
- Real-time statistics aggregation
- Manual check triggering and history recording
- Cascade deletion of websites and check histories

---

## 📊 Prometheus Metrics Details

The `/metrics` endpoint exports Prometheus-compatible metrics including:

| Metric Name | Type | Description | Labels |
|---|---|---|---|
| `uptimewatch_sites_by_status` | Gauge | Count of websites by status | `status` (UP, DOWN, PENDING) |
| `uptimewatch_site_status` | Gauge | Reachability of website (1 = UP, 0 = DOWN) | `url`, `name` |
| `uptimewatch_response_time_ms` | Gauge | Latency in milliseconds of the latest check | `url`, `name` |
| `uptimewatch_checks_total` | Counter | Total number of health checks executed | `status` (UP, DOWN) |

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The `.github/workflows/ci.yml` pipeline runs on every push or pull request to `main` / `master`:
1. **Backend Job**: Sets up Python 3.10, installs dependencies, and runs `pytest`.
2. **Frontend Job**: Sets up Node 20, installs npm dependencies, and runs `npm run build`.
3. **Docker Build Job**: Validates `docker-compose.yml` and builds both backend and frontend Docker images using Buildx.
