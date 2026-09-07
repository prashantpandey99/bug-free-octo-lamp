from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class OtpToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), index=True, nullable=False)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False)  # "REGISTRATION" or "PASSWORD_RESET"
    attempts = Column(Integer, default=0, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utc_now)
