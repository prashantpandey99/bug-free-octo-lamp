from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class RuleBase(BaseModel):
    rule_code: str
    rule_name: str
    description: Optional[str] = None
    category: Optional[str] = "General Packaging"
    field_to_check: str
    condition: str
    expected_value: Optional[str] = None
    severity: Optional[str] = "HIGH"
    weight: Optional[int] = 10
    legal_reference: Optional[str] = None
    explanation: Optional[str] = None
    recommended_action: Optional[str] = None
    active: Optional[bool] = True
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None

class RuleCreate(RuleBase):
    pass

class RuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    field_to_check: Optional[str] = None
    condition: Optional[str] = None
    expected_value: Optional[str] = None
    severity: Optional[str] = None
    weight: Optional[int] = None
    legal_reference: Optional[str] = None
    explanation: Optional[str] = None
    recommended_action: Optional[str] = None
    active: Optional[bool] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None

class RuleResponse(RuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
