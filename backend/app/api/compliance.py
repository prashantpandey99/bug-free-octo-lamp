import os
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.compliance_check import ComplianceCheck, ComplianceResult
from app.models.user import User
from app.schemas.compliance_schema import (
    ComplianceCheckRequest, ComplianceCheckResponse, ComplianceResultItem,
    CompanyNoticeIssueRequest, CompanyNoticeIssueResponse
)
from app.services.compliance_engine import ComplianceEngine, STATUTORY_DISCLAIMER
from app.services.report_generator import ReportGenerator, DEFAULT_REPORTS_DIR
from app.services.email_service import dispatch_statutory_company_notice_email
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


@router.post("/issue-company-notice", response_model=CompanyNoticeIssueResponse)
def issue_company_notice_from_compliance(
    req: CompanyNoticeIssueRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Issues an official Legal Metrology Statutory Show-Cause Notice directly from product scan/label data.
    Generates the official signed PDF notice under Section 15 & 36(1) of Legal Metrology Act, 2009,
    and dispatches the notice via email directly to the brand/company's registered compliance email.
    """
    timestamp = int(datetime.now(timezone.utc).timestamp())
    notice_id = f"NOTICE-LMR-SCAN-{timestamp}"
    officer_name = current_user.name if current_user else "Authorized Inspector of Legal Metrology"
    officer_station = "Central Legal Metrology Enforcement Directorate, New Delhi"

    # 1. Generate Statutory PDF Notice
    report_gen = ReportGenerator()
    notice_payload = {
        "notice_id": notice_id,
        "docket_id": f"INSP-SCAN-{timestamp}",
        "company_name": req.company_name,
        "company_address": req.company_address,
        "company_email": req.company_email,
        "product_name": req.product_name,
        "brand": req.brand or "Declared Brand",
        "batch_number": req.batch_number or "Declared Batch",
        "section_violated": req.section_violated or "Section 36(1) of Legal Metrology Act, 2009 read with LMR 2011",
        "compliance_deadline_days": req.compliance_deadline_days or 15,
        "compounding_penalty": req.compounding_penalty or "₹ 25,000",
        "inspection_summary": "Statutory label audit observed non-conformance of packaged commodity declarations.",
        "violations": req.violations or [],
        "officer_directions": req.officer_directions or (
            f"You are hereby directed to show cause in writing within {req.compliance_deadline_days or 15} calendar days "
            f"as to why legal proceedings under Section 36(1) of the Legal Metrology Act, 2009 should not be instituted. "
            f"Certified packaging proofs and compounding application under Section 48 must be submitted to the Directorate."
        )
    }

    pdf_path = None
    try:
        pdf_path = report_gen.generate_statutory_notice_pdf(notice_payload, officer_name)
    except Exception as e:
        print(f"Error generating compliance notice PDF: {e}")

    # 2. Dispatch Statutory Email to Company with PDF attachment
    email_res = dispatch_statutory_company_notice_email(
        notice_id=notice_id,
        company_name=req.company_name,
        company_email=req.company_email,
        company_address=req.company_address,
        product_name=req.product_name,
        brand=req.brand,
        batch_number=req.batch_number,
        section_violated=req.section_violated,
        compounding_penalty=req.compounding_penalty,
        compliance_deadline_days=req.compliance_deadline_days or 15,
        officer_name=officer_name,
        officer_designation="Inspector of Legal Metrology",
        officer_station=officer_station,
        violations_details=req.violations,
        officer_directions=req.officer_directions,
        pdf_path=pdf_path
    )

    # 3. Log Immutable Audit Log
    log_audit_event(
        db=db,
        action="STATUTORY_NOTICE_SERVED_TO_COMPANY",
        entity="PRODUCT",
        entity_id=str(req.product_id or "SCAN"),
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Statutory Notice #{notice_id} served on {req.company_name} ({req.company_email}). Delivery: {email_res.get('delivery_status')}"
    )

    return CompanyNoticeIssueResponse(
        success=True,
        notice_id=notice_id,
        recipient_email=req.company_email,
        company_name=req.company_name,
        delivery_status=email_res.get("delivery_status", "DISPATCHED"),
        download_url=f"/api/compliance/notice/{notice_id}/download",
        message=f"Statutory Show-Cause Notice #{notice_id} successfully issued and dispatched to {req.company_name} ({req.company_email}).",
        created_at=datetime.now(timezone.utc)
    )


@router.get("/notice/{notice_id}/download")
def download_compliance_notice_pdf(notice_id: str):
    clean_id = notice_id.replace("..", "").replace("/", "").replace("\\", "").strip()
    filename = f"Statutory_Notice_{clean_id}.pdf"
    file_path = os.path.join(DEFAULT_REPORTS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"Statutory notice PDF '{filename}' not found on server."
        )
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename
    )

