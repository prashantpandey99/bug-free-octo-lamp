from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    checked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="NEEDS MANUAL REVIEW")  # COMPLIANT, NON-COMPLIANT, NEEDS MANUAL REVIEW
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=utc_now)

    # Relationships
    product = relationship("Product", back_populates="compliance_checks")
    results = relationship("ComplianceResult", back_populates="check", cascade="all, delete-orphan")

class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True)
    check_id = Column(Integer, ForeignKey("compliance_checks.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("compliance_rules.id"), nullable=True)
    rule_code = Column(String(50), nullable=False)
    rule_name = Column(String(200), nullable=True)
    legal_reference = Column(String(150), nullable=True)
    result = Column(String(20), nullable=False)  # PASSED, FAILED, WARNING
    severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    actual_value = Column(Text, nullable=True)
    expected_value = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Relationships
    check = relationship("ComplianceCheck", back_populates="results")
    rule = relationship("ComplianceRule", back_populates="results")
