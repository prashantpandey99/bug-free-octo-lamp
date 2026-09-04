from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "LMR-6-1-A"
    rule_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General Packaging")  # e.g. "Identity", "Quantity", "Pricing", "Grievance"
    field_to_check = Column(String(100), nullable=False)  # e.g., "manufacturer_address", "unit", "mrp_declaration_text"
    condition = Column(String(50), nullable=False)  # EXISTS, NOT_EMPTY, REGEX, GT, LT, EQ, IN, UNIT_VALID, DATE_FORMAT, MRP_TAX_INCLUSIVE
    expected_value = Column(Text, nullable=True)
    severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    weight = Column(Integer, default=10)  # for scoring
    legal_reference = Column(String(150), nullable=True)  # e.g., "Rule 6(1)(a), LMR 2011"
    explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    results = relationship("ComplianceResult", back_populates="rule")
