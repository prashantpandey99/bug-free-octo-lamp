from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(150), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., LOGIN, CREATE_PRODUCT, EVALUATE_COMPLIANCE, CREATE_RULE, INSPECT
    entity = Column(String(100), nullable=False)  # e.g., USER, PRODUCT, RULE, INSPECTION
    entity_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utc_now)
