from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    product_name: str
    brand: Optional[str] = None
    category_id: Optional[int] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    packer_name: Optional[str] = None
    importer_name: Optional[str] = None
    country_of_origin: Optional[str] = "India"
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    net_quantity: float
    unit: str
    mrp: float
    mrp_declaration_text: Optional[str] = None
    unit_sale_price: Optional[str] = None
    customer_care_email: Optional[str] = None
    customer_care_phone: Optional[str] = None
    customer_care_address: Optional[str] = None
    pdp_dimensions: Optional[str] = None
    image_path: Optional[str] = None
    label_image_path: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[int] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    packer_name: Optional[str] = None
    importer_name: Optional[str] = None
    country_of_origin: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    net_quantity: Optional[float] = None
    unit: Optional[str] = None
    mrp: Optional[float] = None
    mrp_declaration_text: Optional[str] = None
    unit_sale_price: Optional[str] = None
    customer_care_email: Optional[str] = None
    customer_care_phone: Optional[str] = None
    customer_care_address: Optional[str] = None
    pdp_dimensions: Optional[str] = None
    image_path: Optional[str] = None
    label_image_path: Optional[str] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manufacturer_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
