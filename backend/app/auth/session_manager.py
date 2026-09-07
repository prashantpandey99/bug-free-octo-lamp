import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.otp_models import RefreshToken
from app.auth.jwt_handler import SECRET_KEY, ALGORITHM

ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "7"))


def generate_device_fingerprint(request: Request) -> str:
    """
    Generates a deterministic SHA-256 fingerprint binding the token to the client's
    User-Agent and network IP address.
    """
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("User-Agent", "unknown")
    payload = f"{ip}:{ua}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def hash_refresh_token(raw_token: str) -> str:
    """Computes SHA-256 digest of an opaque refresh token."""
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


def create_device_bound_access_token(user: User, device_hash: str) -> str:
    """
    Issues a short-lived (15 minutes) signed JWT containing subject, role,
    and device fingerprint claims.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "device_hash": device_hash,
        "exp": expire,
        "iat": now,
        "type": "access"
    }
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)


class SessionManager:
    @staticmethod
    def issue_token_pair(
        db: Session,
        user: User,
        request: Request,
        family_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Issues an access token and a rotating refresh token, persisting the token
        hash in the database.
        """
        device_hash = generate_device_fingerprint(request)
        access_token = create_device_bound_access_token(user, device_hash)

        # Generate cryptographically secure opaque refresh token
        raw_refresh_token = f"rfr_{secrets.token_urlsafe(48)}"
        token_hash = hash_refresh_token(raw_refresh_token)

        family = family_id or f"fam_{secrets.token_hex(16)}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS)

        refresh_record = RefreshToken(
            user_id=user.id,
            token_family=family,
            token_hash=token_hash,
            device_hash=device_hash,
            is_revoked=False,
            expires_at=expires_at
        )
        db.add(refresh_record)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
            "token_type": "Bearer",
            "expires_in": ACCESS_TOKEN_MINUTES * 60,
            "refresh_expires_in": REFRESH_TOKEN_DAYS * 86400
        }

    @classmethod
    def rotate_refresh_token(cls, db: Session, raw_token: str, request: Request) -> Dict[str, Any]:
        """
        Rotates a refresh token following RFC 6749 guidelines with Token Family
        Replay Protection:
        If an already-revoked refresh token is presented, replay attack is detected,
        and all tokens within that entire token family are immediately invalidated.
        """
        if not raw_token or not raw_token.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required."
            )

        token_hash = hash_refresh_token(raw_token)
        existing = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or unrecognized refresh token."
            )

        # Replay Attack Detection: If token is already revoked, revoke whole family!
        if existing.is_revoked:
            db.query(RefreshToken).filter(
                RefreshToken.token_family == existing.token_family
            ).update({"is_revoked": True})
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security violation: Refresh token reuse detected. All sessions in this family have been revoked."
            )

        # Check token expiration
        now = datetime.now(timezone.utc)
        expiry = existing.expires_at.replace(tzinfo=timezone.utc) if existing.expires_at.tzinfo is None else existing.expires_at
        if expiry < now:
            existing.is_revoked = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired. Please sign in again."
            )

        # Mark current token as revoked
        existing.is_revoked = True

        # Retrieve user
        user = db.query(User).filter(User.id == existing.user_id).first()
        if not user or user.status != "ACTIVE":
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or disabled."
            )

        # Issue successor token pair within the same token family
        tokens = cls.issue_token_pair(db, user, request, family_id=existing.token_family)
        existing.replaced_by = hash_refresh_token(tokens["refresh_token"])
        db.commit()

        return tokens
