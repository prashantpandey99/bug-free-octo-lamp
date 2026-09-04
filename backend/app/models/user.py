from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Consumer")  # Admin, Inspector, Manufacturer, Seller, Consumer
    phone = Column(String(20), nullable=True)
    organization = Column(String(200), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    products = relationship("Product", back_populates="manufacturer_user")
    inspections = relationship("Inspection", back_populates="inspector")
    complaints = relationship("Complaint", back_populates="user")
