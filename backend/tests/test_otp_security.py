import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import Base, get_db
from app.models.user import User
from app.models.otp_models import OtpRequest, RefreshToken
from app.services.otp_crypto_service import OtpCryptoService
from app.services.rate_limiter import SecurityRateLimiter
from app.auth.session_manager import SessionManager, hash_refresh_token

from sqlalchemy.pool import StaticPool

# In-memory test SQLite DB with StaticPool to retain tables across connections
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clear_rate_limits():
    SecurityRateLimiter.reset_for_testing()
    yield
    SecurityRateLimiter.reset_for_testing()


# ==============================================================================
# 1. Cryptographic OTP Generation & Verification
# ==============================================================================
def test_crypto_otp_generation_and_hashing():
    for _ in range(10):
        code = OtpCryptoService.generate_numeric_otp(6)
        assert len(code) == 6
        assert code.isdigit()
        assert int(code) >= 100000

    email = "citizen@example.gov.in"
    salt = OtpCryptoService.generate_salt()
    otp_code = "739201"
    otp_hash = OtpCryptoService.hash_otp(otp_code, salt, email)

    assert len(otp_hash) == 64  # SHA-256 hex digest length
    assert OtpCryptoService.verify_otp(otp_code, salt, email, otp_hash) is True
    assert OtpCryptoService.verify_otp("000000", salt, email, otp_hash) is False
    assert OtpCryptoService.verify_otp(otp_code, salt, "other@email.com", otp_hash) is False


# ==============================================================================
# 2. Anti-Enumeration Check (/api/auth/request-otp)
# ==============================================================================
def test_request_otp_anti_enumeration(client, test_db):
    # Create registered user
    existing_user = User(
        name="Existing Officer",
        email="registered@doca.gov.in",
        password_hash="fakehash",
        role="Inspector",
        status="ACTIVE"
    )
    test_db.add(existing_user)
    test_db.commit()

    # Request OTP for registered email
    res1 = client.post("/api/auth/request-otp", json={"email": "registered@doca.gov.in"})
    assert res1.status_code == 200
    data1 = res1.json()

    # Reset rate limit to test unregistered email from same IP
    SecurityRateLimiter.reset_for_testing()

    # Request OTP for non-registered email
    res2 = client.post("/api/auth/request-otp", json={"email": "unregistered@nowhere.com"})
    assert res2.status_code == 200
    data2 = res2.json()

    # Verify identical message to prevent account enumeration
    assert data1["message"] == data2["message"]
    assert "request_id" in data1 and data1["request_id"].startswith("req_")
    assert "request_id" in data2 and data2["request_id"].startswith("req_")


# ==============================================================================
# 3. Expiry & Single-Use Enforcement
# ==============================================================================
def test_otp_expiry_and_reuse_prevention(client, test_db):
    email = "testuser@doca.gov.in"
    salt = OtpCryptoService.generate_salt()
    raw_otp = "852963"
    otp_hash = OtpCryptoService.hash_otp(raw_otp, salt, email)

    # 1. Expired OTP Test (expired 10 minutes ago)
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    expired_record = OtpRequest(
        request_id="req_expired_01",
        email=email,
        otp_hash=otp_hash,
        salt=salt,
        attempts_count=0,
        max_attempts=3,
        is_used=False,
        expires_at=expired_time.replace(tzinfo=None)
    )
    test_db.add(expired_record)
    test_db.commit()

    res_exp = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp": raw_otp,
        "request_id": "req_expired_01"
    })
    assert res_exp.status_code == 400
    assert "expired" in res_exp.json()["detail"].lower()

    # 2. Valid OTP & Single-Use Test
    valid_record = OtpRequest(
        request_id="req_valid_02",
        email=email,
        otp_hash=otp_hash,
        salt=salt,
        attempts_count=0,
        max_attempts=3,
        is_used=False,
        expires_at=(datetime.now(timezone.utc) + timedelta(minutes=5)).replace(tzinfo=None)
    )
    test_db.add(valid_record)
    test_db.commit()

    # First attempt: succeeds and returns tokens
    res_valid = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp": raw_otp,
        "request_id": "req_valid_02"
    })
    assert res_valid.status_code == 200
    data_valid = res_valid.json()
    assert "access_token" in data_valid
    assert "refresh_token" in data_valid
    assert data_valid["user"]["email"] == email

    # Second attempt: fails immediately because single-use is enforced
    res_reuse = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp": raw_otp,
        "request_id": "req_valid_02"
    })
    assert res_reuse.status_code == 400
    assert "already been used" in res_reuse.json()["detail"].lower()


# ==============================================================================
# 4. Brute-Force Lockout (3 Attempts Maximum)
# ==============================================================================
def test_brute_force_lockout(client, test_db):
    email = "target@doca.gov.in"
    salt = OtpCryptoService.generate_salt()
    correct_otp = "654321"
    otp_hash = OtpCryptoService.hash_otp(correct_otp, salt, email)

    record = OtpRequest(
        request_id="req_lockout_03",
        email=email,
        otp_hash=otp_hash,
        salt=salt,
        attempts_count=0,
        max_attempts=3,
        is_used=False,
        expires_at=(datetime.now(timezone.utc) + timedelta(minutes=5)).replace(tzinfo=None)
    )
    test_db.add(record)
    test_db.commit()

    # Attempt 1: Failed (2 remaining)
    r1 = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000001", "request_id": "req_lockout_03"})
    assert r1.status_code == 401
    assert "2 attempt(s) remaining" in r1.json()["detail"]

    # Attempt 2: Failed (1 remaining)
    r2 = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000002", "request_id": "req_lockout_03"})
    assert r2.status_code == 401
    assert "1 attempt(s) remaining" in r2.json()["detail"]

    # Attempt 3: Threshold hit -> Locked out permanently
    r3 = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000003", "request_id": "req_lockout_03"})
    assert r3.status_code == 429
    assert "Maximum verification attempts exceeded" in r3.json()["detail"]

    # Even if correct code is entered on 4th attempt, it remains locked
    r4 = client.post("/api/auth/verify-otp", json={"email": email, "otp": correct_otp, "request_id": "req_lockout_03"})
    assert r4.status_code in (400, 429)


# ==============================================================================
# 5. Invalidation of Older Pending OTPs on New Request
# ==============================================================================
def test_new_otp_invalidates_prior_pending_otps(client, test_db):
    email = "rotate_otps@doca.gov.in"
    
    # Issue first OTP
    res1 = client.post("/api/auth/request-otp", json={"email": email})
    req_id_1 = res1.json()["request_id"]
    
    otp1 = test_db.query(OtpRequest).filter(OtpRequest.request_id == req_id_1).first()
    assert otp1.is_used is False

    # Clear cooldown to allow second request
    SecurityRateLimiter.reset_for_testing()

    # Issue second OTP
    res2 = client.post("/api/auth/request-otp", json={"email": email})
    req_id_2 = res2.json()["request_id"]

    test_db.refresh(otp1)
    otp2 = test_db.query(OtpRequest).filter(OtpRequest.request_id == req_id_2).first()

    assert otp1.is_used is True   # Previous invalidated
    assert otp2.is_used is False  # New one active


# ==============================================================================
# 6. Refresh Token Rotation & Replay Attack Detection
# ==============================================================================
def test_refresh_token_rotation_and_family_replay_detection(client, test_db):
    # Create user
    user = User(
        name="Refresh Test User",
        email="refresh@doca.gov.in",
        password_hash="pwd",
        role="Consumer",
        status="ACTIVE"
    )
    test_db.add(user)
    test_db.commit()

    # Issue initial token pair
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"
    mock_request.headers.get.return_value = "TestAgent"
    tokens1 = SessionManager.issue_token_pair(test_db, user, mock_request)

    raw_rfr_1 = tokens1["refresh_token"]

    # 1. Legitimate Rotation: Exchange raw_rfr_1 for raw_rfr_2
    res_rot = client.post("/api/auth/refresh-token", json={"refresh_token": raw_rfr_1})
    assert res_rot.status_code == 200
    tokens2 = res_rot.json()
    assert "access_token" in tokens2
    assert "refresh_token" in tokens2
    raw_rfr_2 = tokens2["refresh_token"]
    assert raw_rfr_2 != raw_rfr_1

    # 2. Replay Attack: Attacker tries to reuse raw_rfr_1
    res_replay = client.post("/api/auth/refresh-token", json={"refresh_token": raw_rfr_1})
    assert res_replay.status_code == 401
    assert "reuse detected" in res_replay.json()["detail"].lower()

    # 3. Verify ALL tokens in this family were revoked due to the replay attack
    t1_record = test_db.query(RefreshToken).filter(RefreshToken.token_hash == hash_refresh_token(raw_rfr_1)).first()
    t2_record = test_db.query(RefreshToken).filter(RefreshToken.token_hash == hash_refresh_token(raw_rfr_2)).first()
    assert t1_record.is_revoked is True
    assert t2_record.is_revoked is True

    # 4. Attempting to use raw_rfr_2 now also fails because the family was revoked
    res_subsequent = client.post("/api/auth/refresh-token", json={"refresh_token": raw_rfr_2})
    assert res_subsequent.status_code == 401
