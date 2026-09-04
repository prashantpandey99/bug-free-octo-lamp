from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.user_schema import UserResponse, UserStatusUpdate
from app.auth.dependencies import require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
@router.get("/", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.id.desc()).all()

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    req: UserStatusUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_status = user.status
    user.status = req.status.upper()
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="USER_STATUS_CHANGE",
        entity="USER",
        entity_id=user.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Admin changed status from {old_status} to {user.status}"
    )

    return user
