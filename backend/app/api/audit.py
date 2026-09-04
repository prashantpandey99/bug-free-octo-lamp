from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.auth.dependencies import require_role

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("")
@router.get("/")
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = None,
    entity: Optional[str] = None,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity == entity)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "user_email": l.user_email,
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "ip_address": l.ip_address,
            "details": l.details,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        for l in logs
    ]
