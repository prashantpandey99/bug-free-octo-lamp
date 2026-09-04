from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.compliance_check import ComplianceCheck, ComplianceResult
from app.models.user import User
from app.schemas.compliance_schema import ComplianceCheckRequest, ComplianceCheckResponse, ComplianceResultItem
from app.services.compliance_engine import ComplianceEngine, STATUTORY_DISCLAIMER
from app.auth.dependencies import get_optional_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/compliance", tags=["Compliance Engine"])

@router.post("/check", response_model=ComplianceCheckResponse)
def execute_compliance_check(
    req: ComplianceCheckRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    engine = ComplianceEngine(db=db)
    result = engine.run_compliance_check(
        product_data=req.model_dump(),
        user_id=current_user.id if current_user else None,
        save_to_db=True
    )

    log_audit_event(
        db=db,
        action="EVALUATE_COMPLIANCE",
        entity="PRODUCT",
        entity_id=req.product_id or "ADHOC",
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Compliance evaluated: Status {result.status}, Score {result.score}/100"
    )

    return result

@router.get("/{check_id}", response_model=ComplianceCheckResponse)
def get_compliance_check(check_id: int, db: Session = Depends(get_db)):
    check = db.query(ComplianceCheck).filter(ComplianceCheck.id == check_id).first()
    if not check:
        raise HTTPException(status_code=404, detail="Compliance check record not found")

    items = []
    for r in check.results:
        items.append(
            ComplianceResultItem(
                rule_id=r.rule_id,
                rule_code=r.rule_code,
                rule_name=r.rule_name or r.rule_code,
                legal_reference=r.legal_reference,
                result=r.result,
                severity=r.severity,
                actual_value=r.actual_value,
                expected_value=r.expected_value,
                explanation=r.explanation,
                recommended_action=r.recommended_action
            )
        )

    return ComplianceCheckResponse(
        id=check.id,
        product_id=check.product_id,
        score=check.score,
        status=check.status,
        passed_count=check.passed_count,
        failed_count=check.failed_count,
        warning_count=check.warning_count,
        summary=check.summary or "",
        disclaimer=STATUTORY_DISCLAIMER,
        results=items,
        checked_at=check.checked_at
    )

@router.get("/product/{product_id}", response_model=List[ComplianceCheckResponse])
def get_product_checks(product_id: int, db: Session = Depends(get_db)):
    checks = (
        db.query(ComplianceCheck)
        .filter(ComplianceCheck.product_id == product_id)
        .order_by(ComplianceCheck.checked_at.desc())
        .all()
    )

    response_list = []
    for check in checks:
        items = [
            ComplianceResultItem(
                rule_id=r.rule_id,
                rule_code=r.rule_code,
                rule_name=r.rule_name or r.rule_code,
                legal_reference=r.legal_reference,
                result=r.result,
                severity=r.severity,
                actual_value=r.actual_value,
                expected_value=r.expected_value,
                explanation=r.explanation,
                recommended_action=r.recommended_action
            )
            for r in check.results
        ]
        response_list.append(
            ComplianceCheckResponse(
                id=check.id,
                product_id=check.product_id,
                score=check.score,
                status=check.status,
                passed_count=check.passed_count,
                failed_count=check.failed_count,
                warning_count=check.warning_count,
                summary=check.summary or "",
                disclaimer=STATUTORY_DISCLAIMER,
                results=items,
                checked_at=check.checked_at
            )
        )
    return response_list
