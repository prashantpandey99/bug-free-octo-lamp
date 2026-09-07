from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ComplianceCheckRequest(BaseModel):
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    product_name: Optional[str] = "Packaged Commodity"
    brand: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    packer_name: Optional[str] = None
    importer_name: Optional[str] = None
    country_of_origin: Optional[str] = "India"
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    net_quantity: Optional[float] = 0.0
    unit: Optional[str] = ""
    mrp: Optional[float] = 0.0
    mrp_declaration_text: Optional[str] = None
    unit_sale_price: Optional[str] = None
    customer_care_email: Optional[str] = None
    customer_care_phone: Optional[str] = None
    customer_care_address: Optional[str] = None
    pdp_dimensions: Optional[str] = None
    extracted_text: Optional[str] = None

class ComplianceResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rule_id: Optional[int] = None
    rule_code: str
    rule_name: str
    legal_reference: Optional[str] = None
    result: str  # PASSED, FAILED, WARNING
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    actual_value: Optional[str] = None
    expected_value: Optional[str] = None
    explanation: Optional[str] = None
    recommended_action: Optional[str] = None

class ComplianceCheckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    product_id: Optional[int] = None
    score: float
    status: str  # COMPLIANT, NON-COMPLIANT, NEEDS MANUAL REVIEW
    passed_count: int
    failed_count: int
    warning_count: int
    summary: str
    disclaimer: str
    results: List[ComplianceResultItem]
    checked_at: datetime


class CompanyNoticeIssueRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    brand: Optional[str] = "Declared Brand"
    batch_number: Optional[str] = "Declared Batch"
    barcode: Optional[str] = None
    company_name: str
    company_address: str
    company_email: str
    section_violated: Optional[str] = "Section 36(1) of Legal Metrology Act, 2009 read with LMR 2011"
    compounding_penalty: Optional[str] = "₹ 25,000"
    compliance_deadline_days: Optional[int] = 15
    officer_directions: Optional[str] = None
    violations: Optional[List[str]] = []
    inspection_id: Optional[int] = None


class CompanyNoticeIssueResponse(BaseModel):
    success: bool
    notice_id: str
    recipient_email: str
    company_name: str
    delivery_status: str
    download_url: str
    message: str
    created_at: datetime

