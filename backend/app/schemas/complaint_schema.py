from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ComplaintCreate(BaseModel):
    product_id: Optional[int] = None
    complainant_name: Optional[str] = None
    complainant_contact: Optional[str] = None
    product_name: str
    store_details: Optional[str] = None
    complaint_type: Optional[str] = "Overcharging (Above MRP)"
    description: str
    image_path: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    status: str

class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    product_id: Optional[int] = None
    complainant_name: str
    complainant_contact: Optional[str] = None
    product_name: str
    store_details: Optional[str] = None
    complaint_type: str
    description: str
    image_path: Optional[str] = None
    status: str
    created_at: datetime

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_id: int
    report_number: str
    report_path: str
    generated_by: int
    generated_at: datetime
