from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.compliance_rule import ComplianceRule
from app.models.user import User
from app.schemas.rule_schema import RuleCreate, RuleUpdate, RuleResponse
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/rules", tags=["Compliance Rules Management"])

@router.get("", response_model=List[RuleResponse])
@router.get("/", response_model=List[RuleResponse])
def list_rules(
    active_only: bool = False,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ComplianceRule)
    if active_only:
        query = query.filter(ComplianceRule.active == True)
    if category:
        query = query.filter(ComplianceRule.category == category)
    return query.order_by(ComplianceRule.id.asc()).all()

@router.post("", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    req: RuleCreate,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(ComplianceRule).filter(ComplianceRule.rule_code == req.rule_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rule with code '{req.rule_code}' already exists"
        )

    rule = ComplianceRule(**req.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)

    log_audit_event(
        db=db,
        action="CREATE_RULE",
        entity="COMPLIANCE_RULE",
        entity_id=rule.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Admin created statutory rule: {rule.rule_code}"
    )

    return rule

@router.get("/{rule_id}", response_model=RuleResponse)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(
    rule_id: int,
    req: RuleUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(rule, field, val)

    db.commit()
    db.refresh(rule)

    log_audit_event(
        db=db,
        action="UPDATE_RULE",
        entity="COMPLIANCE_RULE",
        entity_id=rule.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Admin updated statutory rule: {rule.rule_code}"
    )

    return rule

@router.patch("/{rule_id}/toggle", response_model=RuleResponse)
def toggle_rule(
    rule_id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.active = not rule.active
    db.commit()
    db.refresh(rule)

    state_str = "ENABLED" if rule.active else "DISABLED"
    log_audit_event(
        db=db,
        action="TOGGLE_RULE",
        entity="COMPLIANCE_RULE",
        entity_id=rule.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Admin {state_str} statutory rule: {rule.rule_code}"
    )

    return rule

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    log_audit_event(
        db=db,
        action="DELETE_RULE",
        entity="COMPLIANCE_RULE",
        entity_id=rule.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Admin deleted statutory rule: {rule.rule_code}"
    )

    db.delete(rule)
    db.commit()
    return None
