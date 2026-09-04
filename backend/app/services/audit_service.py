from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

def log_audit_event(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: Optional[str] = None,
    details: Optional[str] = None
) -> AuditLog:
    log_entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else "anonymous",
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        ip_address=ip_address or "127.0.0.1",
        details=details
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
