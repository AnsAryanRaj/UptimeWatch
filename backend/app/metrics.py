from prometheus_client import Gauge, Counter, generate_latest, CONTENT_TYPE_LATEST

# Metrics definitions
SITES_BY_STATUS = Gauge(
    "uptimewatch_sites_by_status",
    "Number of monitored websites grouped by status",
    ["status"]
)

SITE_STATUS = Gauge(
    "uptimewatch_site_status",
    "Current status of monitored website (1=UP, 0=DOWN)",
    ["url", "name"]
)

SITE_RESPONSE_TIME = Gauge(
    "uptimewatch_response_time_ms",
    "Latest response time in milliseconds for a website",
    ["url", "name"]
)

CHECKS_TOTAL = Counter(
    "uptimewatch_checks_total",
    "Total number of uptime checks performed",
    ["status"]
)


def update_metrics_for_check(url: str, name: str, status: str, response_time_ms: float = None):
    CHECKS_TOTAL.labels(status=status).inc()
    SITE_STATUS.labels(url=url, name=name).set(1.0 if status == "UP" else 0.0)
    if response_time_ms is not None:
        SITE_RESPONSE_TIME.labels(url=url, name=name).set(response_time_ms)


def sync_sites_status_metrics(sites):
    counts = {"UP": 0, "DOWN": 0, "PENDING": 0}
    for site in sites:
        if site.status in counts:
            counts[site.status] += 1
        else:
            counts["PENDING"] += 1
    
    for status, count in counts.items():
        SITES_BY_STATUS.labels(status=status).set(count)
