from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_number = Column(String(100), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspection_date = Column(DateTime, default=utc_now)
    location = Column(String(255), nullable=True)
    store_name = Column(String(200), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, COMPLIANT, VIOLATION_FOUND, NOTICE_ISSUED, SEIZURE_RECOMMENDED
    remarks = Column(Text, nullable=True)
    evidence_image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    product = relationship("Product", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
    violations = relationship("Violation", back_populates="inspection", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="inspection", uselist=False)

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("compliance_rules.id"), nullable=True)
    rule_code = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    evidence = Column(String(255), nullable=True)
    penalty_clause = Column(String(100), default="Section 36(1), Legal Metrology Act, 2009")
    status = Column(String(50), default="OPEN")  # OPEN, COMPOUNDED, REFERRED_TO_COURT, RESOLVED
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    inspection = relationship("Inspection", back_populates="violations")
