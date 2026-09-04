import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.inspection import Inspection, Violation
from app.models.product import Product
from app.models.user import User
from app.schemas.inspection_schema import (
    InspectionCreate, InspectionStatusUpdate, InspectionResponse, ViolationCreate, ViolationResponse
)
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/inspections", tags=["Field Inspections & Enforcement"])

@router.get("", response_model=List[InspectionResponse])
@router.get("/", response_model=List[InspectionResponse])
def list_inspections(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role(["Admin", "Inspector"])),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)
    if current_user.role == "Inspector":
        # Inspectors can see all or their own; let's allow seeing inspections in the zone/system
        pass
    if status_filter:
        query = query.filter(Inspection.status == status_filter)

    inspections = query.order_by(Inspection.created_at.desc()).all()
    resp = []
    for insp in inspections:
        resp.append(
            InspectionResponse(
                id=insp.id,
                inspection_number=insp.inspection_number,
                product_id=insp.product_id,
                inspector_id=insp.inspector_id,
                inspector_name=insp.inspector.name if insp.inspector else "Authorized Officer",
                inspection_date=insp.inspection_date,
                location=insp.location,
                store_name=insp.store_name,
                status=insp.status,
                remarks=insp.remarks,
                violations=[
                    ViolationResponse(
                        id=v.id,
                        rule_code=v.rule_code,
                        description=v.description,
                        severity=v.severity,
                        penalty_clause=v.penalty_clause,
                        evidence=v.evidence,
                        status=v.status,
                        created_at=v.created_at
                    )
                    for v in insp.violations
                ],
                created_at=insp.created_at
            )
        )
    return resp

@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def register_inspection(
    req: InspectionCreate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Inspector"])),
    db: Session = Depends(get_db)
):
    timestamp = int(datetime.now(timezone.utc).timestamp())
    insp_number = f"INSP-LMR-{timestamp}"

    # Determine status based on violations
    has_violations = bool(req.violations and len(req.violations) > 0)
    has_critical = any(v.severity == "CRITICAL" for v in req.violations) if has_violations else False

    status_val = "COMPLIANT"
    if has_critical:
        status_val = "SEIZURE_RECOMMENDED"
    elif has_violations:
        status_val = "NOTICE_ISSUED"

    inspection = Inspection(
        inspection_number=insp_number,
        product_id=req.product_id,
        inspector_id=current_user.id,
        inspection_date=datetime.now(timezone.utc),
        location=req.location,
        store_name=req.store_name,
        status=status_val,
        remarks=req.remarks
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Add violations
    violation_objs = []
    if req.violations:
        for v in req.violations:
            viol = Violation(
                inspection_id=inspection.id,
                rule_id=v.rule_id,
                rule_code=v.rule_code,
                description=v.description,
                severity=v.severity or "HIGH",
                penalty_clause=v.penalty_clause or "Section 36(1), Legal Metrology Act, 2009",
                evidence=v.evidence,
                status="OPEN"
            )
            db.add(viol)
            violation_objs.append(viol)
        db.commit()

    log_audit_event(
        db=db,
        action="RECORD_INSPECTION",
        entity="INSPECTION",
        entity_id=inspection.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Inspection recorded: {insp_number} - Status {status_val}"
    )

    return InspectionResponse(
        id=inspection.id,
        inspection_number=inspection.inspection_number,
        product_id=inspection.product_id,
        inspector_id=inspection.inspector_id,
        inspector_name=current_user.name,
        inspection_date=inspection.inspection_date,
        location=inspection.location,
        store_name=inspection.store_name,
        status=inspection.status,
        remarks=inspection.remarks,
        violations=[
            ViolationResponse(
                id=v.id,
                rule_code=v.rule_code,
                description=v.description,
                severity=v.severity,
                penalty_clause=v.penalty_clause,
                evidence=v.evidence,
                status=v.status,
                created_at=v.created_at
            )
            for v in violation_objs
        ],
        created_at=inspection.created_at
    )

@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection(
    inspection_id: int,
    current_user: User = Depends(require_role(["Admin", "Inspector"])),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection docket not found")

    return InspectionResponse(
        id=insp.id,
        inspection_number=insp.inspection_number,
        product_id=insp.product_id,
        inspector_id=insp.inspector_id,
        inspector_name=insp.inspector.name if insp.inspector else "Authorized Officer",
        inspection_date=insp.inspection_date,
        location=insp.location,
        store_name=insp.store_name,
        status=insp.status,
        remarks=insp.remarks,
        violations=[
            ViolationResponse(
                id=v.id,
                rule_code=v.rule_code,
                description=v.description,
                severity=v.severity,
                penalty_clause=v.penalty_clause,
                evidence=v.evidence,
                status=v.status,
                created_at=v.created_at
            )
            for v in insp.violations
        ],
        created_at=insp.created_at
    )

@router.patch("/{inspection_id}/status", response_model=InspectionResponse)
def update_inspection_status(
    inspection_id: int,
    req: InspectionStatusUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Inspector"])),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    old_status = insp.status
    insp.status = req.status
    if req.remarks:
        insp.remarks = f"{insp.remarks or ''}\n[Update]: {req.remarks}".strip()
    db.commit()
    db.refresh(insp)

    log_audit_event(
        db=db,
        action="UPDATE_INSPECTION_STATUS",
        entity="INSPECTION",
        entity_id=insp.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Inspection status changed from {old_status} to {insp.status}"
    )

    return InspectionResponse(
        id=insp.id,
        inspection_number=insp.inspection_number,
        product_id=insp.product_id,
        inspector_id=insp.inspector_id,
        inspector_name=insp.inspector.name if insp.inspector else "Authorized Officer",
        inspection_date=insp.inspection_date,
        location=insp.location,
        store_name=insp.store_name,
        status=insp.status,
        remarks=insp.remarks,
        violations=[
            ViolationResponse(
                id=v.id,
                rule_code=v.rule_code,
                description=v.description,
                severity=v.severity,
                penalty_clause=v.penalty_clause,
                evidence=v.evidence,
                status=v.status,
                created_at=v.created_at
            )
            for v in insp.violations
        ],
        created_at=insp.created_at
    )
