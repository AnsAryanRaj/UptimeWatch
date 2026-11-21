FROM python:3.10-slim

WORKDIR /app

# Prevent Python from writing .pyc files & buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL="sqlite:////data/uptimewatch.db"
ENV PIP_DEFAULT_TIMEOUT=600
ENV PIP_RETRIES=10

# Install system dependencies if required (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies with 600s timeout, 10 retries, and layer caching
COPY requirements.txt .
RUN pip install --default-timeout=600 --retries 10 -r requirements.txt

# Create volume mount point for database storage
RUN mkdir -p /data

# Copy source code
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
