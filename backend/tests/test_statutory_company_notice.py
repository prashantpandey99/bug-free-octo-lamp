import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.services.email_service import OUTBOX_DIR, dispatch_statutory_company_notice_email
from app.services.report_generator import ReportGenerator, DEFAULT_REPORTS_DIR

client = TestClient(app)

def test_dispatch_statutory_company_notice_email_function():
    """
    Test direct execution of dispatch_statutory_company_notice_email with real product and violation data.
    """
    notice_id = "TEST-NOTICE-LMR-2026-001"
    company_name = "NutriBake Foods Private Limited"
    company_email = "compliance@nutribakefoods.in"
    company_address = "Plot No. C-14, MIDC Phase-II, Dombivli East, Thane, Maharashtra - 421204"
    product_name = "NutriBake Whole Wheat Roasted Almond Cookies"
    brand = "NutriBake Select"
    batch_number = "NB-ALM-26H04"
    section_violated = "Section 36(1) of Legal Metrology Act, 2009 read with Rule 6(1) and Rule 12 of LMR 2011"
    compounding_penalty = "₹ 25,000"
    violations = [
        "Rule 12: Prohibited non-standard metric unit '1200 gms' used instead of standard symbol 'g' or '1.2 kg'.",
        "Rule 6(1)(f): Absence of mandatory Unit Sale Price (USP) declaration on bulk package exceeding 1 kg.",
        "Rule 6(1)(e): Maximum Retail Price declared without mandatory phrase '(inclusive of all taxes)'."
    ]

    # Generate real PDF first
    report_gen = ReportGenerator()
    notice_payload = {
        "notice_id": notice_id,
        "company_name": company_name,
        "company_address": company_address,
        "company_email": company_email,
        "product_name": product_name,
        "brand": brand,
        "batch_number": batch_number,
        "section_violated": section_violated,
        "compounding_penalty": compounding_penalty,
        "violations": violations
    }
    pdf_path = report_gen.generate_statutory_notice_pdf(notice_payload, "Vikramaditya S. Rathore")
    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 1000

    # Dispatch statutory email
    res = dispatch_statutory_company_notice_email(
        notice_id=notice_id,
        company_name=company_name,
        company_email=company_email,
        company_address=company_address,
        product_name=product_name,
        brand=brand,
        batch_number=batch_number,
        section_violated=section_violated,
        compounding_penalty=compounding_penalty,
        compliance_deadline_days=15,
        officer_name="Vikramaditya S. Rathore",
        officer_designation="Inspector of Legal Metrology",
        officer_station="Western Zone Enforcement Directorate, Mumbai Division",
        violations_details=violations,
        pdf_path=pdf_path
    )

    assert res["success"] is True
    assert res["notice_id"] == notice_id
    assert res["recipient_email"] == company_email
    assert res["delivery_status"] in ("DISPATCHED_SMTP", "DISPATCHED_SIMULATED", "DISPATCHED_OUTBOX_AUDIT", "SIMULATED_DISPATCH_FALLBACK")
    assert "audit_file" in res
    assert os.path.exists(res["audit_file"])

    # Verify audit HTML contents
    with open(res["audit_file"], "r", encoding="utf-8") as f:
        html_body = f.read()
        assert "STATUTORY SHOW-CAUSE NOTICE" in html_body
        assert "NutriBake Foods Private Limited" in html_body
        assert "1200 gms" in html_body
        assert "₹ 25,000" in html_body


def test_api_issue_company_notice_endpoint():
    """
    Test POST /api/compliance/issue-company-notice with real scanned product data and violations.
    """
    payload = {
        "product_name": "Enzyme Active Detergent Powder",
        "brand": "Super Shine Cleaners",
        "batch_number": "SS-2026-B8",
        "barcode": "8901058852441",
        "company_name": "Super Shine Cleaners Pvt. Ltd.",
        "company_address": "Plot 5, Industrial Area, Ghaziabad, Uttar Pradesh - 201001",
        "company_email": "legal@supershinecleaners.in",
        "section_violated": "Section 36(1) of Legal Metrology Act, 2009 read with Rule 12 & Rule 6(1)(e)",
        "compounding_penalty": "₹ 25,000",
        "compliance_deadline_days": 15,
        "violations": [
            "Rule 12 Violation: Non-standard unit 'gms' used on label.",
            "Rule 6(1)(e) Violation: Missing '(inclusive of all taxes)' declaration.",
            "Rule 6(1)(a) Violation: Manufacturer address lacks 6-digit postal PIN code."
        ],
        "officer_directions": "Submit certified label artwork proofs and compounding application under Section 48 within 15 calendar days."
    }

    response = client.post("/api/compliance/issue-company-notice", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "notice_id" in data
    assert data["recipient_email"] == "legal@supershinecleaners.in"
    assert data["company_name"] == "Super Shine Cleaners Pvt. Ltd."
    assert "download_url" in data

    # Verify download of generated notice PDF
    dl_resp = client.get(data["download_url"])
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert len(dl_resp.content) > 1000
