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

def test_user_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@doca.gov.in",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Admin"

def test_user_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "admin@doca.gov.in",
        "password": "WrongPassword!99"
    })
    assert response.status_code == 401

def test_user_registration_and_jwt():
    unique_email = f"priya.consumer.{int(time.time()*1000)}@example.com"
    response = client.post("/api/auth/register", json={
        "name": "Priya Sharma",
        "email": unique_email,
        "password": "Password@123",
        "role": "Consumer",
        "phone": "9876543210"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email

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
