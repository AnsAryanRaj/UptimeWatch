from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Website(Base):
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False, unique=True, index=True)
    check_interval = Column(Integer, default=60)  # check interval in seconds
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_checked_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="PENDING")  # UP, DOWN, PENDING
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    checks = relationship("CheckHistory", back_populates="website", cascade="all, delete-orphan", order_by="desc(CheckHistory.checked_at)")


class CheckHistory(Base):
    __tablename__ = "check_history"

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(20), nullable=False)  # UP, DOWN
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    website = relationship("Website", back_populates="checks")
