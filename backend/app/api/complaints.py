from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.complaint import Complaint
from app.models.user import User
from app.schemas.complaint_schema import ComplaintCreate, ComplaintStatusUpdate, ComplaintResponse
from app.auth.dependencies import get_optional_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/complaints", tags=["Consumer Complaints"])

@router.get("", response_model=List[ComplaintResponse])
@router.get("/", response_model=List[ComplaintResponse])
def list_complaints(
    status_filter: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if current_user and current_user.role == "Consumer":
        query = query.filter(Complaint.user_id == current_user.id)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)

    return query.order_by(Complaint.created_at.desc()).all()

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    req: ComplaintCreate,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    complaint = Complaint(
        user_id=current_user.id if current_user else None,
        product_id=req.product_id,
        complainant_name=req.complainant_name,
        complainant_contact=req.complainant_contact,
        product_name=req.product_name,
        store_details=req.store_details,
        complaint_type=req.complaint_type or "Overcharging (Above MRP)",
        description=req.description,
        image_path=req.image_path,
        status="SUBMITTED"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    log_audit_event(
        db=db,
        action="LODGE_COMPLAINT",
        entity="COMPLAINT",
        entity_id=complaint.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Consumer grievance lodged against: {complaint.product_name}"
    )

    return complaint

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    req: ComplaintStatusUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Inspector"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = req.status
    db.commit()
    db.refresh(complaint)

    log_audit_event(
        db=db,
        action="UPDATE_COMPLAINT_STATUS",
        entity="COMPLAINT",
        entity_id=complaint.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Complaint status updated from {old_status} to {complaint.status}"
    )

    return complaint
