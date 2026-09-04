import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.compliance_rule import ComplianceRule
from app.services.compliance_engine import ComplianceEngine

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Add test rules
    rule1 = ComplianceRule(
        rule_code="TEST-UNIT",
        rule_name="Standard Metric Unit",
        field_to_check="unit",
        condition="UNIT_VALID",
        expected_value="g,kg,ml,l,N,U",
        severity="CRITICAL",
        weight=15,
        active=True
    )
    rule2 = ComplianceRule(
        rule_code="TEST-MRP-TAX",
        rule_name="MRP Tax Inclusion",
        field_to_check="mrp_declaration_text",
        condition="MRP_TAX_INCLUSIVE",
        expected_value="inclusive of all taxes",
        severity="CRITICAL",
        weight=15,
        active=True
    )
    rule3 = ComplianceRule(
        rule_code="TEST-PIN",
        rule_name="Postal PIN Code",
        field_to_check="manufacturer_address",
        condition="PIN_CODE_PRESENT",
        expected_value="6-digit PIN",
        severity="HIGH",
        weight=10,
        active=True
    )
    db.add_all([rule1, rule2, rule3])
    db.commit()

    yield db
    db.close()

def test_compliant_product_evaluation(test_db):
    engine = ComplianceEngine(test_db)
    product_data = {
        "product_name": "Premium Wheat Flour",
        "net_quantity": 5.0,
        "unit": "kg",
        "mrp": 250.0,
        "mrp_declaration_text": "MRP Rs. 250.00 (inclusive of all taxes)",
        "manufacturer_address": "Plot 12, Industrial Estate, New Delhi - 110020",
    }
    result = engine.run_compliance_check(product_data, save_to_db=False)
    assert result.status == "COMPLIANT"
    assert result.score == 100.0
    assert result.failed_count == 0
    assert result.passed_count == 3

def test_non_compliant_illegal_unit(test_db):
    engine = ComplianceEngine(test_db)
    product_data = {
        "product_name": "Detergent Powder",
        "net_quantity": 1000.0,
        "unit": "gms",  # Prohibited non-standard abbreviation
        "mrp": 120.0,
        "mrp_declaration_text": "MRP Rs. 120.00 (inclusive of all taxes)",
        "manufacturer_address": "Factory 4, Sector 5, Noida - 201301",
    }
    result = engine.run_compliance_check(product_data, save_to_db=False)
    assert result.status == "NON-COMPLIANT"
    assert result.failed_count >= 1
    # Check that the failed check specifically caught the illegal unit
    failed_codes = [r.rule_code for r in result.results if r.result == "FAILED"]
    assert "TEST-UNIT" in failed_codes

def test_missing_tax_phrase(test_db):
    engine = ComplianceEngine(test_db)
    product_data = {
        "product_name": "Bath Soap",
        "net_quantity": 125.0,
        "unit": "g",
        "mrp": 45.0,
        "mrp_declaration_text": "MRP Rs. 45.00 only",  # Missing taxes phrase
        "manufacturer_address": "Plot 99, Okhla, New Delhi - 110020",
    }
    result = engine.run_compliance_check(product_data, save_to_db=False)
    assert result.status == "NON-COMPLIANT"
    failed_codes = [r.rule_code for r in result.results if r.result == "FAILED"]
    assert "TEST-MRP-TAX" in failed_codes
