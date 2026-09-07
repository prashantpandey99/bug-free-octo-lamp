from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ViolationCreate(BaseModel):
    rule_id: Optional[int] = None
    rule_code: Optional[str] = None
    description: str
    severity: Optional[str] = "HIGH"
    penalty_clause: Optional[str] = "Section 36(1), Legal Metrology Act, 2009"
    evidence: Optional[str] = None

class ViolationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rule_code: Optional[str] = None
    description: str
    severity: str
    penalty_clause: Optional[str] = None
    evidence: Optional[str] = None
    status: str
    created_at: datetime

class InspectionCreate(BaseModel):
    product_id: Optional[int] = None
    location: Optional[str] = None
    store_name: Optional[str] = None
    remarks: Optional[str] = None
    violations: Optional[List[ViolationCreate]] = []

class InspectionStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None

class InspectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_number: str
    product_id: Optional[int] = None
    inspector_id: int
    inspector_name: Optional[str] = None
    inspection_date: datetime
    location: Optional[str] = None
    store_name: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    violations: List[ViolationResponse] = []
    created_at: datetime
