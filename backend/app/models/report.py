from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), unique=True, nullable=False)
    report_number = Column(String(100), unique=True, index=True, nullable=False)
    report_path = Column(String(255), nullable=False)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime, default=utc_now)

    # Relationships
    inspection = relationship("Inspection", back_populates="report")
    generator = relationship("User")
