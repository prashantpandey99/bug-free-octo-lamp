from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    complainant_name = Column(String(150), nullable=False)
    complainant_contact = Column(String(100), nullable=True)
    product_name = Column(String(200), nullable=False)
    store_details = Column(Text, nullable=True)
    complaint_type = Column(String(100), default="Overcharging (Above MRP)")  # Overcharging, Missing Declarations, Non-Standard Units, Deceptive Packaging
    description = Column(Text, nullable=False)
    image_path = Column(String(255), nullable=True)
    status = Column(String(50), default="SUBMITTED")  # SUBMITTED, UNDER_INVESTIGATION, RESOLVED, REJECTED
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="complaints")
    product = relationship("Product", back_populates="complaints")
