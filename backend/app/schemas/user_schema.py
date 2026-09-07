from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class SendOtpRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    request_id: Optional[str] = None

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: Optional[str] = None
    role: Optional[str] = "Consumer"  # Admin, Inspector, Manufacturer, Seller, Consumer
    phone: Optional[str] = None
    organization: Optional[str] = None
    otp: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    organization: Optional[str] = None
    status: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserStatusUpdate(BaseModel):
    status: str  # ACTIVE, SUSPENDED

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: Optional[str] = None

class RequestOtpDTO(BaseModel):
    email: EmailStr

class VerifyOtpUnifiedDTO(BaseModel):
    request_id: str
    email: EmailStr
    otp: str

class RefreshTokenDTO(BaseModel):
    refresh_token: str

class OtpSessionResponse(BaseModel):
    message: str
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse
