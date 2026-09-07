import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.database.seeder import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "Ministry of Consumer Affairs" in data["department"]

def test_user_registration_and_jwt():
    unique_email = f"real.user.{int(time.time()*1000)}@example.com"
    response = client.post("/api/auth/register", json={
        "name": "Priya Sharma",
        "email": unique_email,
        "password": "Password@123",
        "confirm_password": "Password@123",
        "role": "Consumer",
        "phone": "9876543210"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["name"] == "Priya Sharma"

    # Test login with registered credentials
    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password@123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == unique_email

    # Test login with incorrect password
    bad_pw_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword!99"
    })
    assert bad_pw_resp.status_code == 401
    assert "Incorrect password" in bad_pw_resp.json()["detail"]

    # Test login with non-existent user
    not_found_resp = client.post("/api/auth/login", json={
        "email": "nonexistent.user.12345@example.com",
        "password": "SomePassword@123"
    })
    assert not_found_resp.status_code == 404
    assert "User does not exist" in not_found_resp.json()["detail"]

    # Test duplicate registration rejection
    dup_resp = client.post("/api/auth/register", json={
        "name": "Priya Duplicate",
        "email": unique_email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    assert dup_resp.status_code == 409
    assert "already exists" in dup_resp.json()["detail"]

    # Test password mismatch rejection
    mismatch_resp = client.post("/api/auth/register", json={
        "name": "Mismatch User",
        "email": f"mismatch.{int(time.time()*1000)}@example.com",
        "password": "Password@123",
        "confirm_password": "DifferentPassword@456"
    })
    assert mismatch_resp.status_code == 400
    assert "do not match" in mismatch_resp.json()["detail"]

from unittest.mock import patch

def test_email_otp_generation_and_verification():
    import time
    test_email = f"customer.otp.{int(time.time()*1000)}@portal.gov.in"

    # 1. Request OTP (mock random generator to return deterministic 6-digit OTP: 245678)
    with patch("secrets.randbelow", return_value=145678):
        otp_resp = client.post("/api/auth/send-otp", json={"email": test_email})
    assert otp_resp.status_code == 200
    assert otp_resp.json()["status"] == "success"
    # Ensure demo_otp is NOT returned in response
    assert "demo_otp" not in otp_resp.json()

    # 2. Test invalid OTP verification
    bad_verify = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": "000000"
    })
    assert bad_verify.status_code == 400
    assert "Invalid OTP" in bad_verify.json()["detail"]

    # 3. Test that old backdoor code 999999 is strictly REJECTED
    backdoor_verify = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": "999999"
    })
    assert backdoor_verify.status_code == 400
    assert "Invalid OTP" in backdoor_verify.json()["detail"]

    # 4. Test genuine OTP verification (245678)
    good_verify = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": "245678"
    })
    assert good_verify.status_code == 200
    assert good_verify.json()["verified"] is True

    # 5. Test complete registration with full customer data and verified OTP
    reg_resp = client.post("/api/auth/register", json={
        "name": "Rohan Deshmukh",
        "email": test_email,
        "phone": "9876543210",
        "organization": "Deshmukh Agro Packagers Ltd.",
        "role": "Manufacturer",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "otp": "245678"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["name"] == "Rohan Deshmukh"
    assert reg_data["user"]["role"] == "Manufacturer"
    assert reg_data["user"]["phone"] == "9876543210"

def test_mobile_number_validation():
    import time
    test_email = f"mobile.test.{int(time.time()*1000)}@portal.gov.in"

    # Test rejection of repetitive dummy phone number
    resp1 = client.post("/api/auth/register", json={
        "name": "Fake User",
        "email": test_email,
        "phone": "9999999999",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "role": "Consumer"
    })
    assert resp1.status_code == 400
    assert "genuine" in resp1.json()["detail"].lower()

    # Test rejection of non-Indian starting digit (e.g. starting with 1)
    resp2 = client.post("/api/auth/register", json={
        "name": "Fake User",
        "email": test_email,
        "phone": "1234567890",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "role": "Consumer"
    })
    assert resp2.status_code == 400
    assert "valid 10-digit mobile number" in resp2.json()["detail"].lower()

def test_products_list():
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) >= 2

def test_compliance_check_api():
    payload = {
        "product_name": "Test Atta Pack",
        "brand": "Demo Brand",
        "manufacturer_name": "Test Millers",
        "manufacturer_address": "Sector 18, Gurugram, Haryana - 122001",
        "net_quantity": 5.0,
        "unit": "kg",
        "mrp": 220.0,
        "mrp_declaration_text": "MRP Rs. 220.00 (inclusive of all taxes)",
        "unit_sale_price": "₹ 44.00 per kg",
        "customer_care_phone": "1800-200-1111",
        "customer_care_email": "care@demobrand.in",
        "country_of_origin": "India",
        "manufacturing_date": "08/2026",
        "batch_number": "BATCH-01"
    }
    response = client.post("/api/compliance/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["COMPLIANT", "NEEDS MANUAL REVIEW"]
    assert data["score"] >= 80.0
    assert "STATUTORY ASSISTANCE DISCLAIMER" in data["disclaimer"]

def test_unauthorized_rule_creation():
    payload = {
        "rule_code": "TEST-UNAUTH-01",
        "rule_name": "Test Rule",
        "field_to_check": "brand",
        "condition": "NOT_EMPTY"
    }
    response = client.post("/api/rules/", json=payload)
    assert response.status_code in [401, 403]

def test_ocr_extract_multi():
    svg_sample_1 = b'''<svg xmlns="http://www.w3.org/2000/svg">
    <text>Shakti Bhog Chakki Fresh Atta</text>
    <text>Net Quantity: 5 kg</text>
    </svg>'''
    svg_sample_2 = b'''<svg xmlns="http://www.w3.org/2000/svg">
    <text>MRP Rs. 245.00 (inclusive of all taxes)</text>
    <text>Pkd: 08/2026</text>
    <text>Batch: SB-2026-901</text>
    </svg>'''

    files = [
        ("files", ("side1.svg", svg_sample_1, "image/svg+xml")),
        ("files", ("side2.svg", svg_sample_2, "image/svg+xml")),
    ]
    response = client.post("/api/ocr/extract-multi", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_files"] == 2
    assert "merged_fields" in data
    assert len(data["files"]) == 2

def test_ocr_extract_batch():
    svg_sample = b'''<svg xmlns="http://www.w3.org/2000/svg">
    <text>Premium Cookies</text>
    <text>Net Quantity: 100 g</text>
    <text>MRP Rs. 50.00 (inclusive of all taxes)</text>
    </svg>'''

    files = [
        ("files", ("prod_a.svg", svg_sample, "image/svg+xml")),
        ("files", ("prod_b.svg", svg_sample, "image/svg+xml")),
    ]
    response = client.post("/api/ocr/extract-batch", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_processed"] == 2
    assert "pass_rate" in data
    assert len(data["items"]) == 2

def test_consumer_complaint_auth_requirement():
    import time
    complaint_payload = {
        "product_name": "Overcharged Packaged Milk",
        "store_details": "City Grocery Mart, Delhi",
        "complaint_type": "Overcharging (Above MRP)",
        "description": "Charged Rs 35 for Rs 30 MRP packet."
    }

    # 1. Unauthenticated submission must fail with 401
    unauth_resp = client.post("/api/complaints", json=complaint_payload)
    assert unauth_resp.status_code == 401

    # 2. Register & login a consumer with verified OTP
    consumer_email = f"citizen.{int(time.time()*1000)}@portal.gov.in"
    with patch("secrets.randbelow", return_value=145678):
        client.post("/api/auth/send-otp", json={"email": consumer_email})

    reg_resp = client.post("/api/auth/register", json={
        "name": "Citizen Ravi",
        "email": consumer_email,
        "phone": "9811223344",
        "organization": "Independent Citizen",
        "role": "Consumer",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "otp": "245678"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    user_id = reg_resp.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Authenticated submission must succeed and bind to user_id
    auth_resp = client.post("/api/complaints", json=complaint_payload, headers=headers)
    assert auth_resp.status_code == 201
    created_complaint = auth_resp.json()
    assert created_complaint["user_id"] == user_id
    assert created_complaint["complainant_name"] == "Citizen Ravi"
    assert created_complaint["product_name"] == "Overcharged Packaged Milk"

    # 4. Listing complaints with consumer token returns their registered complaint
    list_resp = client.get("/api/complaints", headers=headers)
    assert list_resp.status_code == 200
    complaints_list = list_resp.json()
    assert any(c["id"] == created_complaint["id"] for c in complaints_list)
