import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.inspection import Inspection
from app.models.product import Product
from app.models.compliance_check import ComplianceCheck
from app.models.report import Report
from app.models.user import User
from app.schemas.complaint_schema import ReportResponse
from app.services.report_generator import ReportGenerator
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/reports", tags=["Inspection Reports & Certificates"])

report_generator = ReportGenerator()

@router.post("/generate/{inspection_id}", response_model=ReportResponse)
def generate_report(
    inspection_id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Inspector", "Manufacturer"])),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection record not found")

    # Fetch product details
    product = db.query(Product).filter(Product.id == insp.product_id).first() if insp.product_id else None
    prod_dict = {}
    if product:
        prod_dict = {
            "product_name": product.product_name,
            "brand": product.brand,
            "net_quantity": product.net_quantity,
            "unit": product.unit,
            "mrp": product.mrp,
            "mrp_declaration_text": product.mrp_declaration_text,
            "unit_sale_price": product.unit_sale_price,
            "batch_number": product.batch_number,
            "manufacturing_date": product.manufacturing_date,
            "expiry_date": product.expiry_date,
            "manufacturer_name": product.manufacturer_name,
            "manufacturer_address": product.manufacturer_address,
            "country_of_origin": product.country_of_origin,
            "customer_care_phone": product.customer_care_phone,
            "customer_care_email": product.customer_care_email,
        }

    # Fetch latest compliance check for this product or construct from violations
    latest_check = None
    if insp.product_id:
        latest_check = (
            db.query(ComplianceCheck)
            .filter(ComplianceCheck.product_id == insp.product_id)
            .order_by(ComplianceCheck.checked_at.desc())
            .first()
        )

    check_dict = {
        "score": latest_check.score if latest_check else (100.0 if not insp.violations else 45.0),
        "results": []
    }
    if latest_check:
        for r in latest_check.results:
            check_dict["results"].append({
                "rule_code": r.rule_code,
                "rule_name": r.rule_name,
                "legal_reference": r.legal_reference,
                "result": r.result,
                "severity": r.severity,
                "actual_value": r.actual_value,
                "explanation": r.explanation
            })
    else:
        for v in insp.violations:
            check_dict["results"].append({
                "rule_code": v.rule_code or "LMR-SEC-36",
                "rule_name": v.description,
                "legal_reference": v.penalty_clause,
                "result": "FAILED",
                "severity": v.severity,
                "actual_value": "Defect Observed on Packaging",
                "explanation": v.description
            })

    insp_dict = {
        "inspection_number": insp.inspection_number,
        "status": insp.status,
        "location": insp.location,
        "store_name": insp.store_name,
        "remarks": insp.remarks
    }

    inspector_name = insp.inspector.name if insp.inspector else current_user.name

    pdf_path = report_generator.generate_inspection_pdf(
        inspection_data=insp_dict,
        product_data=prod_dict,
        compliance_check=check_dict,
        inspector_name=inspector_name
    )

    # Check if report record already exists
    report_record = db.query(Report).filter(Report.inspection_id == insp.id).first()
    if not report_record:
        report_record = Report(
            inspection_id=insp.id,
            report_number=f"REP-{insp.inspection_number}",
            report_path=pdf_path,
            generated_by=current_user.id,
            generated_at=datetime.now(timezone.utc)
        )
        db.add(report_record)
    else:
        report_record.report_path = pdf_path
        report_record.generated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(report_record)

    log_audit_event(
        db=db,
        action="GENERATE_REPORT",
        entity="REPORT",
        entity_id=report_record.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"PDF report generated: {report_record.report_number}"
    )

    return report_record

@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report record not found")

    if not os.path.exists(rep.report_path):
        raise HTTPException(status_code=404, detail="PDF report file does not exist on disk")

    filename = os.path.basename(rep.report_path)
    return FileResponse(
        path=rep.report_path,
        media_type="application/pdf",
        filename=filename
    )

@router.get("/inspection/{inspection_id}")
def get_report_by_inspection(inspection_id: int, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.inspection_id == inspection_id).first()
    if not rep:
        return {"report": None}
    return {
        "report": {
            "id": rep.id,
            "report_number": rep.report_number,
            "report_path": rep.report_path,
            "generated_at": rep.generated_at
        }
    }
