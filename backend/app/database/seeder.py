import os
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.compliance_rule import ComplianceRule
from app.models.compliance_check import ComplianceCheck, ComplianceResult
from app.models.inspection import Inspection, Violation
from app.auth.jwt_handler import get_password_hash

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already seeded with demo data.")
            return

        print("Seeding database with statutory Legal Metrology rules, demo users, and realistic products...")

        # 1. Seed Users for All 5 Roles
        admin_user = User(
            name="Dr. Alok Srivastava",
            email="admin@doca.gov.in",
            password_hash=get_password_hash("Admin@123"),
            role="Admin",
            phone="011-23384501",
            organization="Directorate of Legal Metrology, Krishi Bhawan, New Delhi",
            status="ACTIVE"
        )
        inspector_user = User(
            name="Insp. Rajesh Verma",
            email="inspector@doca.gov.in",
            password_hash=get_password_hash("Inspector@123"),
            role="Inspector",
            phone="9810234567",
            organization="Central Legal Metrology Enforcement Wing, Zone 1",
            status="ACTIVE"
        )
        mfg_user = User(
            name="Shakti Bhog Foods Ltd.",
            email="mfg@shaktibhog.com",
            password_hash=get_password_hash("Mfg@123"),
            role="Manufacturer",
            phone="011-47000000",
            organization="Shakti Bhog Agro Industries",
            status="ACTIVE"
        )
        seller_user = User(
            name="Reliance Retail Supercenter",
            email="seller@retailhub.in",
            password_hash=get_password_hash("Seller@123"),
            role="Seller",
            phone="022-35553000",
            organization="Reliance Retail Ltd.",
            status="ACTIVE"
        )
        consumer_user = User(
            name="Ramesh Kumar",
            email="consumer@gmail.com",
            password_hash=get_password_hash("Consumer@123"),
            role="Consumer",
            phone="9988776655",
            organization="Citizen Consumer",
            status="ACTIVE"
        )
        db.add_all([admin_user, inspector_user, mfg_user, seller_user, consumer_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(inspector_user)
        db.refresh(mfg_user)

        # 2. Seed Categories
        cat_food = Category(name="Food & Grain Commodities", description="Packaged grains, flours, pulses, spices, edible provisions", standard_units="g,kg,N")
        cat_detergent = Category(name="Household & Cleaning Chemicals", description="Detergent powders, soaps, cleaning concentrates", standard_units="g,kg,ml,l")
        cat_bakery = Category(name="Bakery & Confectionery", description="Biscuits, chocolates, cookies, snacks", standard_units="g,kg")
        cat_cosmetics = Category(name="Personal Care & Cosmetics", description="Face serums, lotions, soaps, shampoos", standard_units="g,ml")
        cat_beverages = Category(name="Beverages & Edible Oils", description="Tea, coffee, cooking oils, fruit juices", standard_units="g,kg,ml,l")

        db.add_all([cat_food, cat_detergent, cat_bakery, cat_cosmetics, cat_beverages])
        db.commit()
        db.refresh(cat_food)
        db.refresh(cat_detergent)

        # 3. Seed Configurable Compliance Rules (LMR 2011)
        rules = [
            ComplianceRule(
                rule_code="LMR-6-1-A",
                rule_name="Manufacturer / Packer Postal Address & PIN Code",
                description="Mandatory name and complete physical postal address including 6-digit postal PIN code.",
                category="Identity & Traceability",
                field_to_check="manufacturer_address",
                condition="PIN_CODE_PRESENT",
                expected_value="Valid 6-digit Postal PIN Code",
                severity="CRITICAL",
                weight=15,
                legal_reference="Rule 6(1)(a), LMR 2011",
                explanation="Incomplete manufacturer address prevents consumer grievance escalation and statutory regulatory inspection.",
                recommended_action="Declare full registered factory/packer address along with 6-digit postal PIN code.",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-B",
                rule_name="Generic or Common Commercial Name",
                description="Package must clearly declare the common generic commercial name of commodity.",
                category="Commodity Identity",
                field_to_check="product_name",
                condition="NOT_EMPTY",
                expected_value="Descriptive generic name",
                severity="HIGH",
                weight=10,
                legal_reference="Rule 6(1)(b), LMR 2011",
                explanation="Consumers must not be misled by arbitrary brand names without generic commercial description.",
                recommended_action="Print generic descriptive name prominently on Principal Display Panel.",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-C",
                rule_name="Standard Metric Units Only",
                description="Net quantity must be expressed strictly in standard SI metric units (g, kg, ml, l, N, U). Non-standard abbreviations (gms, gm., kgs, ltrs) are prohibited.",
                category="Net Quantity",
                field_to_check="unit",
                condition="UNIT_VALID",
                expected_value="g,kg,ml,l,N,U",
                severity="CRITICAL",
                weight=15,
                legal_reference="Rule 6(1)(c) & Rule 12, LMR 2011",
                explanation="Use of illegal notations like 'gms', 'gm', 'kgs', or 'ltrs' violates Schedule II and standard unit declarations.",
                recommended_action="Replace non-standard abbreviation with official metric symbol (e.g., '1000 g' or '1 kg' instead of '1000 gms').",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-D",
                rule_name="Month & Year of Manufacture or Packaging",
                description="Month and year of manufacture or packaging must be declared in MM/YYYY or Month YYYY format.",
                category="Manufacturing Chronology",
                field_to_check="manufacturing_date",
                condition="DATE_FORMAT",
                expected_value="MM/YYYY or Month YYYY",
                severity="HIGH",
                weight=10,
                legal_reference="Rule 6(1)(d), LMR 2011",
                explanation="Ambiguous dates or missing year prevent verification of product freshness and shelf-life compliance.",
                recommended_action="Print clear manufacturing or pre-packing month and 4-digit year on package.",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-E",
                rule_name="MRP with 'Inclusive of all taxes'",
                description="Maximum Retail Price must declare '(inclusive of all taxes)' or 'incl. of all taxes'.",
                category="Pricing Declarations",
                field_to_check="mrp_declaration_text",
                condition="MRP_TAX_INCLUSIVE",
                expected_value="inclusive of all taxes",
                severity="CRITICAL",
                weight=15,
                legal_reference="Rule 6(1)(e), LMR 2011",
                explanation="Failure to declare tax inclusion permits deceptive retail surcharge and violates consumer pricing protection.",
                recommended_action="Ensure 'MRP Rs. XX.XX (inclusive of all taxes)' is legibly printed.",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-F",
                rule_name="Mandatory Unit Sale Price (USP) for Bulk Packs",
                description="Commodities packaged in quantities greater than 1 kg or 1 L must declare Unit Sale Price (USP) in ₹ per g or ₹ per ml.",
                category="Pricing Declarations",
                field_to_check="unit_sale_price",
                condition="UNIT_SALE_PRICE_REQUIRED",
                expected_value="₹ per g or ₹ per ml / kg",
                severity="HIGH",
                weight=10,
                legal_reference="Rule 6(1)(f), LMR 2011 (as amended)",
                explanation="Unit Sale Price allows consumers to easily compare cost per standard weight across different pack sizes.",
                recommended_action="Print Unit Sale Price (e.g. ₹ 49.00 per kg) adjacent to the total MRP.",
                active=True,
                effective_from=date(2022, 10, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-N-PHONE",
                rule_name="Consumer Grievance Helpline Contact",
                description="Package must declare an active telephone/toll-free helpline number for consumer redressal.",
                category="Consumer Care",
                field_to_check="customer_care_phone",
                condition="NOT_EMPTY",
                expected_value="10-digit phone or 1800-toll-free number",
                severity="HIGH",
                weight=10,
                legal_reference="Rule 6(1)(n), LMR 2011",
                explanation="Missing customer redressal contact deprives consumers of statutory complaint escalation channels.",
                recommended_action="Print dedicated customer care telephone number prominently on package label.",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-1-N-EMAIL",
                rule_name="Consumer Grievance Email Address",
                description="Package must declare an active email address for customer service and complaint registration.",
                category="Consumer Care",
                field_to_check="customer_care_email",
                condition="REGEX",
                expected_value=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                severity="MEDIUM",
                weight=5,
                legal_reference="Rule 6(1)(n), LMR 2011",
                explanation="Email address provides formal written channel for consumer complaints.",
                recommended_action="Declare valid customer care email address.",
                active=True,
                effective_from=date(2011, 4, 1)
            ),
            ComplianceRule(
                rule_code="LMR-6-10-COO",
                rule_name="Country of Origin Declaration",
                description="Every packaged commodity, whether manufactured in India or imported, must declare country of origin.",
                category="Import & Origin",
                field_to_check="country_of_origin",
                condition="NOT_EMPTY",
                expected_value="Country Name (e.g. India)",
                severity="CRITICAL",
                weight=10,
                legal_reference="Rule 6(10), LMR 2011",
                explanation="Country of origin transparency is statutory under consumer right-to-know provisions.",
                recommended_action="Declare 'Country of Origin: India' or specific importing nation.",
                active=True,
                effective_from=date(2020, 11, 1)
            )
        ]
        db.add_all(rules)
        db.commit()

        # 4. Seed Realistic Packaged Products
        p1 = Product(
            product_name="Chakki Fresh Whole Wheat Atta",
            brand="Shakti Bhog",
            category_id=cat_food.id,
            manufacturer_id=mfg_user.id,
            manufacturer_name="Shakti Bhog Foods Ltd.",
            manufacturer_address="Plot 14, Okhla Industrial Area, Phase III, New Delhi - 110020",
            country_of_origin="India",
            batch_number="SB-2026-901",
            manufacturing_date="08/2026",
            net_quantity=5.0,
            unit="kg",
            mrp=245.0,
            mrp_declaration_text="MRP Rs. 245.00 (inclusive of all taxes)",
            unit_sale_price="₹ 49.00 per kg",
            customer_care_email="care@shaktibhog.com",
            customer_care_phone="1800-11-4545",
            customer_care_address="Customer Care Cell, Shakti Bhog Foods, Okhla, New Delhi - 110020",
            label_image_path="sample-atta.svg"
        )

        p2 = Product(
            product_name="Enzyme Active Detergent Powder",
            brand="Super Shine",
            category_id=cat_detergent.id,
            manufacturer_name="Super Chemicals Pvt Ltd",
            manufacturer_address="Industrial Area, Kanpur, UP",  # VIOLATION: Missing PIN code
            country_of_origin="India",
            batch_number="KNP-7721",
            manufacturing_date="Aug 2026",
            net_quantity=1000.0,
            unit="gms",  # VIOLATION: Illegal non-standard unit 'gms'
            mrp=140.0,
            mrp_declaration_text="MRP Rs. 140.00",  # VIOLATION: Missing (inclusive of all taxes)
            unit_sale_price="",  # Missing USP for bulk pack
            customer_care_email="",
            customer_care_phone="",  # VIOLATION: Missing customer care phone
            label_image_path="sample-detergent.svg"
        )

        p3 = Product(
            product_name="Premium Choco Delight Cookies",
            brand="Baker's Pride",
            category_id=cat_bakery.id,
            manufacturer_name="Baker's Pride Foods Pvt Ltd",
            manufacturer_address="B-12, Sector 62, Noida, Gautam Buddha Nagar, UP - 201309",
            country_of_origin="India",
            batch_number="BP-8812",
            manufacturing_date="05/2026",
            net_quantity=150.0,
            unit="g",
            mrp=60.0,
            mrp_declaration_text="₹ 60.00 (incl. of all taxes)",
            unit_sale_price="₹ 0.40 per g",
            customer_care_email="help@bakerspride.com",
            customer_care_phone="011-23456789",
            label_image_path="sample-chocolate.svg"
        )

        db.add_all([p1, p2, p3])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)

        # 5. Pre-run compliance check for demo products
        from app.services.compliance_engine import ComplianceEngine
        engine_svc = ComplianceEngine(db=db)
        
        # Check P1 (Compliant)
        c1 = engine_svc.run_compliance_check(
            product_data={
                "product_id": p1.id,
                "product_name": p1.product_name,
                "brand": p1.brand,
                "manufacturer_name": p1.manufacturer_name,
                "manufacturer_address": p1.manufacturer_address,
                "country_of_origin": p1.country_of_origin,
                "batch_number": p1.batch_number,
                "manufacturing_date": p1.manufacturing_date,
                "net_quantity": p1.net_quantity,
                "unit": p1.unit,
                "mrp": p1.mrp,
                "mrp_declaration_text": p1.mrp_declaration_text,
                "unit_sale_price": p1.unit_sale_price,
                "customer_care_email": p1.customer_care_email,
                "customer_care_phone": p1.customer_care_phone,
            },
            user_id=inspector_user.id
        )

        # Check P2 (Non-compliant)
        c2 = engine_svc.run_compliance_check(
            product_data={
                "product_id": p2.id,
                "product_name": p2.product_name,
                "brand": p2.brand,
                "manufacturer_name": p2.manufacturer_name,
                "manufacturer_address": p2.manufacturer_address,
                "country_of_origin": p2.country_of_origin,
                "batch_number": p2.batch_number,
                "manufacturing_date": p2.manufacturing_date,
                "net_quantity": p2.net_quantity,
                "unit": p2.unit,
                "mrp": p2.mrp,
                "mrp_declaration_text": p2.mrp_declaration_text,
                "unit_sale_price": p2.unit_sale_price,
                "customer_care_email": p2.customer_care_email,
                "customer_care_phone": p2.customer_care_phone,
            },
            user_id=inspector_user.id
        )

        # 6. Seed Sample Inspections
        insp1 = Inspection(
            inspection_number="INSP-LMR-2026-001",
            product_id=p1.id,
            inspector_id=inspector_user.id,
            location="Vasant Kunj Supermarket, New Delhi",
            store_name="Big Bazaar / Smart Bazaar",
            status="COMPLIANT",
            remarks="Routine market surveillance. Package displays all mandatory Rule 6 declarations legibly."
        )

        insp2 = Inspection(
            inspection_number="INSP-LMR-2026-002",
            product_id=p2.id,
            inspector_id=inspector_user.id,
            location="Chandni Chowk Retail Market, Delhi",
            store_name="Gupta General Store",
            status="SEIZURE_RECOMMENDED",
            remarks="Observed multiple compoundable offences under Section 36(1). Illegal metric unit 'gms' and missing tax inclusion declaration."
        )
        db.add_all([insp1, insp2])
        db.commit()
        db.refresh(insp2)

        v1 = Violation(
            inspection_id=insp2.id,
            rule_code="LMR-6-1-C",
            description="Use of prohibited non-standard unit 'gms' instead of standard metric unit 'g' or 'kg' under Rule 12.",
            severity="CRITICAL",
            penalty_clause="Section 36(1), Legal Metrology Act, 2009",
            status="OPEN"
        )
        v2 = Violation(
            inspection_id=insp2.id,
            rule_code="LMR-6-1-E",
            description="MRP declaration lacks mandatory phrase '(inclusive of all taxes)' under Rule 6(1)(e).",
            severity="CRITICAL",
            penalty_clause="Section 36(1), Legal Metrology Act, 2009",
            status="OPEN"
        )
        v3 = Violation(
            inspection_id=insp2.id,
            rule_code="LMR-6-1-A",
            description="Manufacturer address lacks 6-digit postal PIN code for consumer traceability.",
            severity="HIGH",
            penalty_clause="Section 36(1), Legal Metrology Act, 2009",
            status="OPEN"
        )
        db.add_all([v1, v2, v3])
        db.commit()

        print("Database successfully seeded with realistic Legal Metrology statutory rules and sample records.")

    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_database()
