import os
import secrets
import hashlib
import hmac
from typing import Optional

# Retrieve server pepper from environment or fallback constant
OTP_PEPPER = os.getenv("OTP_PEPPER_SECRET", "doca_metrology_secure_otp_pepper_2026_sih_gov_in")


class OtpCryptoService:
    @staticmethod
    def generate_numeric_otp(digits: int = 6) -> str:
        """
        Generates a cryptographically secure numeric OTP of exactly `digits` length.
        Guarantees leading digit is never zero (range: 100,000 to 999,999 for 6 digits).
        """
        if digits < 6:
            digits = 6
        lower = 10 ** (digits - 1)
        upper = (10 ** digits) - lower
        return str(lower + secrets.randbelow(upper))

    @staticmethod
    def generate_salt() -> str:
        """Generates a secure 32-character hexadecimal salt."""
        return secrets.token_hex(16)

    @staticmethod
    def hash_otp(raw_otp: str, salt: str, email: str) -> str:
        """
        Calculates a keyed HMAC-SHA256 hash incorporating the email, per-request salt,
        OTP code, and server-side secret pepper.
        """
        sanitized_email = email.lower().strip()
        sanitized_otp = raw_otp.strip()
        payload = f"{sanitized_email}:{salt}:{sanitized_otp}:{OTP_PEPPER}".encode("utf-8")
        return hmac.new(OTP_PEPPER.encode("utf-8"), payload, hashlib.sha256).hexdigest()

    @classmethod
    def verify_otp(cls, raw_otp: str, salt: str, email: str, stored_hash: str) -> bool:
        """
        Constant-time comparison between computed hash and stored hash to prevent timing attacks.
        """
        if not raw_otp or not salt or not email or not stored_hash:
            return False
        candidate_hash = cls.hash_otp(raw_otp, salt, email)
        return hmac.compare_digest(candidate_hash, stored_hash)
