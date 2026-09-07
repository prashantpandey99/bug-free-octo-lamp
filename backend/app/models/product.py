from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.utils.datetime_utils import utc_now

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(50), unique=True, index=True, nullable=True)
    product_name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    manufacturer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    manufacturer_name = Column(String(200), nullable=True)
    manufacturer_address = Column(Text, nullable=True)
    packer_name = Column(String(200), nullable=True)
    importer_name = Column(String(200), nullable=True)
    country_of_origin = Column(String(100), default="India")
    batch_number = Column(String(100), nullable=True)
    manufacturing_date = Column(String(50), nullable=True)  # e.g., "08/2026" or "15/08/2026"
    expiry_date = Column(String(50), nullable=True)
    net_quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(20), nullable=False, default="g")  # g, kg, ml, l, N, U
    mrp = Column(Float, nullable=False, default=0.0)
    mrp_declaration_text = Column(String(255), nullable=True)  # e.g. "MRP Rs. 150.00 (inclusive of all taxes)"
    unit_sale_price = Column(String(100), nullable=True)  # e.g. "₹ 0.30 per g"
    customer_care_email = Column(String(150), nullable=True)
    customer_care_phone = Column(String(50), nullable=True)
    customer_care_address = Column(Text, nullable=True)
    pdp_dimensions = Column(String(100), nullable=True)  # e.g. "120 sq cm"
    image_path = Column(String(255), nullable=True)
    label_image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    category = relationship("Category", back_populates="products")
    manufacturer_user = relationship("User", back_populates="products")
    compliance_checks = relationship("ComplianceCheck", back_populates="product", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="product")
    complaints = relationship("Complaint", back_populates="product")
