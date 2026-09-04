from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inspection import Inspection, Violation
from app.models.compliance_check import ComplianceCheck
from app.models.complaint import Complaint
from app.models.compliance_rule import ComplianceRule
from app.auth.dependencies import get_optional_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])

@router.get("/stats")
def get_dashboard_stats(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    role = current_user.role if current_user else "Public"

    # Common counts
    total_products = db.query(Product).count()
    total_inspections = db.query(Inspection).count()
    total_checks = db.query(ComplianceCheck).count()
    total_rules = db.query(ComplianceRule).filter(ComplianceRule.active == True).count()
    total_violations = db.query(Violation).count()
    total_complaints = db.query(Complaint).count()

    compliant_count = db.query(ComplianceCheck).filter(ComplianceCheck.status == "COMPLIANT").count()
    non_compliant_count = db.query(ComplianceCheck).filter(ComplianceCheck.status == "NON-COMPLIANT").count()
    review_count = db.query(ComplianceCheck).filter(ComplianceCheck.status == "NEEDS MANUAL REVIEW").count()

    # Recent inspections
    recent_inspections = (
        db.query(Inspection)
        .order_by(Inspection.created_at.desc())
        .limit(5)
        .all()
    )
    inspections_list = [
        {
            "id": i.id,
            "number": i.inspection_number,
            "status": i.status,
            "store": i.store_name or i.location or "Market Sample",
            "date": i.inspection_date.strftime("%d-%b-%Y") if i.inspection_date else "Recent"
        }
        for i in recent_inspections
    ]

    # Category compliance distribution
    stats = {
        "role": role,
        "user_name": current_user.name if current_user else "Public User",
        "total_products": total_products,
        "total_inspections": total_inspections,
        "total_checks": total_checks,
        "total_active_rules": total_rules,
        "total_violations": total_violations,
        "total_complaints": total_complaints,
        "compliance_breakdown": {
            "compliant": compliant_count,
            "non_compliant": non_compliant_count,
            "needs_review": review_count
        },
        "recent_inspections": inspections_list,
        "violation_severity_distribution": {
            "critical": db.query(Violation).filter(Violation.severity == "CRITICAL").count(),
            "high": db.query(Violation).filter(Violation.severity == "HIGH").count(),
            "medium": db.query(Violation).filter(Violation.severity == "MEDIUM").count(),
            "low": db.query(Violation).filter(Violation.severity == "LOW").count(),
        }
    }

    # Role-specific additions
    if role == "Admin":
        stats["total_users"] = db.query(User).count()
        stats["users_by_role"] = {
            "Admin": db.query(User).filter(User.role == "Admin").count(),
            "Inspector": db.query(User).filter(User.role == "Inspector").count(),
            "Manufacturer": db.query(User).filter(User.role == "Manufacturer").count(),
            "Seller": db.query(User).filter(User.role == "Seller").count(),
            "Consumer": db.query(User).filter(User.role == "Consumer").count(),
        }
    elif role == "Inspector":
        stats["my_inspections"] = db.query(Inspection).filter(Inspection.inspector_id == current_user.id).count()
        stats["pending_notices"] = db.query(Inspection).filter(Inspection.status.in_(["PENDING", "NOTICE_ISSUED"])).count()
    elif role == "Manufacturer":
        my_products = db.query(Product).filter(Product.manufacturer_id == current_user.id).count()
        stats["my_products"] = my_products
        stats["compliance_percentage"] = round((compliant_count / max(total_checks, 1)) * 100, 1)
    elif role == "Consumer":
        stats["my_complaints"] = db.query(Complaint).filter(Complaint.user_id == current_user.id).count()

    return stats
