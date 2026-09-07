from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now


class OtpRequest(Base):
    __tablename__ = "otp_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Cryptographic verification
    otp_hash = Column(String(128), nullable=False)  # Keyed HMAC-SHA256
    salt = Column(String(64), nullable=False)       # Per-request salt
    
    purpose = Column(String(32), default="AUTHENTICATION", nullable=False)
    attempts_count = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    
    # Audit telemetry
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", backref="otp_requests")

    __table_args__ = (
        Index("idx_otp_requests_email_used", "email", "is_used", "expires_at"),
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_family = Column(String(64), index=True, nullable=False)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    device_hash = Column(String(64), nullable=False)
    
    is_revoked = Column(Boolean, default=False, nullable=False)
    replaced_by = Column(String(128), nullable=True)
    
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", backref="refresh_tokens")

    __table_args__ = (
        Index("idx_refresh_tokens_family", "token_family", "is_revoked"),
    )
