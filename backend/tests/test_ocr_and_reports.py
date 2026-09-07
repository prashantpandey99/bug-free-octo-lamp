import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ocr_service import OCRService

client = TestClient(app)

def test_ocr_service_extraction():
    ocr = OCRService()
    # Test on sample atta label
    sample_path = "assets/samples/sample-atta.svg"
    if os.path.exists(sample_path):
        res = ocr.process_package_label(sample_path)
        assert res["confidence"] > 70.0
        assert "extracted_fields" in res
        fields = res["extracted_fields"]
        assert fields["net_quantity"] is not None
        assert fields["mrp"] is not None

def test_inspection_and_pdf_report_workflow():
    # 1. Register a real Inspector account
    import time
    insp_email = f"officer.test.{int(time.time()*1000)}@doca.gov.in"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Insp. Officer Test",
        "email": insp_email,
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "role": "Inspector",
        "organization": "Central Enforcement Wing"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register an Inspection
    insp_resp = client.post("/api/inspections/", json={
        "product_id": 1,
        "location": "Sector 18 Supermarket, Noida",
        "store_name": "Smart Hypermarket",
        "remarks": "SIH automated inspection run",
        "violations": [
            {
                "rule_code": "LMR-6-1-C",
                "description": "Non-standard unit check test",
                "severity": "HIGH",
                "penalty_clause": "Section 36(1), Legal Metrology Act, 2009"
            }
        ]
    }, headers=headers)
    assert insp_resp.status_code == 201
    insp_data = insp_resp.json()
    insp_id = insp_data["id"]

    # 3. Generate Official PDF Report
    rep_resp = client.post(f"/api/reports/generate/{insp_id}", headers=headers)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert "report_number" in rep_data
    assert os.path.exists(rep_data["report_path"])

    # 4. Download Report PDF
    dl_resp = client.get(f"/api/reports/{rep_data['id']}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert len(dl_resp.content) > 1000  # Non-empty valid PDF
