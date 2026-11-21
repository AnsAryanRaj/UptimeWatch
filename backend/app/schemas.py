from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict


class WebsiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=4, max_length=500)
    check_interval: Optional[int] = Field(default=60, ge=10, le=3600)

    @field_validator("url")
    @classmethod
    def validate_and_normalize_url(cls, v: str) -> str:
        clean_url = v.strip()
        if not clean_url.startswith(("http://", "https://")):
            clean_url = f"https://{clean_url}"
        return clean_url


class WebsiteCreate(WebsiteBase):
    pass


class CheckHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    website_id: int
    checked_at: datetime
    status: str
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    error_message: Optional[str] = None


class WebsiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    url: str
    check_interval: int
    is_active: bool
    created_at: datetime
    last_checked_at: Optional[datetime] = None
    status: str
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    error_message: Optional[str] = None


class StatsResponse(BaseModel):
    total_monitored: int
    online_count: int
    offline_count: int
    pending_count: int
    avg_response_time_ms: float
    uptime_percentage: float
