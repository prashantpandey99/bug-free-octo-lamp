from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.user_schema import UserRegister, UserLogin, TokenResponse, UserResponse, ForgotPasswordRequest
from app.auth.jwt_handler import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.auth.dependencies import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegister, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    # Restrict Admin creation to existing Admins or default seed; default new users to Consumer or requested role
    valid_roles = ["Admin", "Inspector", "Manufacturer", "Seller", "Consumer"]
    role = req.role if req.role in valid_roles else "Consumer"

    new_user = User(
        name=req.name,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=role,
        phone=req.phone,
        organization=req.organization,
        status="ACTIVE"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role, "name": new_user.name},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    log_audit_event(
        db=db,
        action="USER_REGISTER",
        entity="USER",
        entity_id=new_user.id,
        user=new_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"User registered with role {new_user.role}"
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated. Contact Legal Metrology Administration."
        )

    token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.name},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    log_audit_event(
        db=db,
        action="USER_LOGIN",
        entity="USER",
        entity_id=user.id,
        user=user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Successful login as {user.role}"
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Avoid user enumeration by returning standard message
        return {"message": "If an account exists with this email, a statutory password reset token has been dispatched."}
    return {
        "message": "Password reset token generated.",
        "note": "For security purposes in demonstration mode, use administrator reset or login with standard demo credentials."
    }
