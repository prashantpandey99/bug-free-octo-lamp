import os
from datetime import datetime, date, timedelta
from app.database.session import SessionLocal, engine, Base
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.compliance_rule import ComplianceRule
from app.models.compliance_check import ComplianceCheck, ComplianceResult
from app.models.inspection import Inspection, Violation
from app.models.report import Report
from app.models.complaint import Complaint
from app.models.audit_log import AuditLog
from app.services.compliance_engine import ComplianceEngine
from app.services.report_generator import ReportGenerator

def enrich():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Enriching database with comprehensive Legal Metrology records...")

        # Ensure categories
        cats = {
            "food": db.query(Category).filter(Category.name.like("%Food%")).first(),
            "detergent": db.query(Category).filter(Category.name.like("%Household%")).first(),
            "bakery": db.query(Category).filter(Category.name.like("%Bakery%")).first(),
            "cosmetics": db.query(Category).filter(Category.name.like("%Personal Care%")).first(),
            "beverages": db.query(Category).filter(Category.name.like("%Beverages%")).first(),
        }

        # Users
        admin = db.query(User).filter(User.role == "Admin").first()
        inspector = db.query(User).filter(User.role == "Inspector").first()
        mfg = db.query(User).filter(User.role == "Manufacturer").first()
        seller = db.query(User).filter(User.role == "Seller").first()
        consumer = db.query(User).filter(User.role == "Consumer").first()

        # Additional Products
        products_data = [
            {
                "product_name": "Royal Kashmiri Kahwa Green Tea",
                "brand": "Himalayan Herbs",
                "category_id": cats["beverages"].id if cats["beverages"] else 1,
                "manufacturer_name": "Kashmir Valley Agro Producer Co.",
                "manufacturer_address": "Estate No. 4, Industrial Growth Centre, Lassipora, Pulwama, J&K - 192301",
                "country_of_origin": "India",
                "batch_number": "KK-2026-78",
                "manufacturing_date": "06/2026",
                "expiry_date": "06/2028",
                "net_quantity": 250.0,
                "unit": "g",
                "mrp": 380.0,
                "mrp_declaration_text": "MRP Rs. 380.00 (inclusive of all taxes)",
                "unit_sale_price": "₹ 1.52 per g",
                "customer_care_email": "care@himalayanherbs.in",
                "customer_care_phone": "1800-889-2233",
                "label_image_path": "sample-tea.svg"
            },
            {
                "product_name": "Glow Hydrating Face Serum",
                "brand": "Derma Labs India",
                "category_id": cats["cosmetics"].id if cats["cosmetics"] else 1,
                "manufacturer_name": "Derma Labs Formulation Ltd.",
                "manufacturer_address": "B-42, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra - 400093",
                "country_of_origin": "India",
                "batch_number": "DL-SERUM-884",
                "manufacturing_date": "07/2026",
                "expiry_date": "07/2028",
                "net_quantity": 30.0,
                "unit": "ml",
                "mrp": 699.0,
                "mrp_declaration_text": "MRP ₹ 699.00 (incl. of all taxes)",
                "unit_sale_price": "₹ 23.30 per ml",
                "customer_care_email": "support@dermalabs.in",
                "customer_care_phone": "1800-22-9900",
                "label_image_path": "sample-serum.svg"
            },
            {
                "product_name": "Mediterranean Extra Virgin Olive Oil",
                "brand": "Villa Toscana",
                "category_id": cats["food"].id if cats["food"] else 1,
                "manufacturer_name": "Toscana Bottlers SRL",
                "manufacturer_address": "Via Roma, Florence, Italy", # Missing Indian importer and PIN
                "country_of_origin": "", # VIOLATION: Missing Country of Origin
                "batch_number": "VT-2026-X",
                "manufacturing_date": "04/2026",
                "expiry_date": "04/2028",
                "net_quantity": 1.0,
                "unit": "l",
                "mrp": 850.0,
                "mrp_declaration_text": "MRP ₹ 850.00 (inclusive of all taxes)",
                "unit_sale_price": "₹ 85.00 per 100ml",
                "customer_care_email": "info@villoscanatrading.com",
                "customer_care_phone": "", # VIOLATION: Missing phone
                "label_image_path": "sample-tea.svg"
            },
            {
                "product_name": "Crispy Aloo Bhujia Namkeen",
                "brand": "Haldiram's",
                "category_id": cats["food"].id if cats["food"] else 1,
                "manufacturer_name": "Haldiram Snacks Pvt. Ltd.",
                "manufacturer_address": "B-1/H-8, Mohan Co-op Industrial Estate, Main Mathura Road, New Delhi - 110044",
                "country_of_origin": "India",
                "batch_number": "HR-ALOO-401",
                "manufacturing_date": "08/2026",
                "expiry_date": "02/2027",
                "net_quantity": 400.0,
                "unit": "g",
                "mrp": 95.0,
                "mrp_declaration_text": "MRP Rs. 95.00 (inclusive of all taxes)",
                "unit_sale_price": "₹ 0.24 per g",
                "customer_care_email": "care@haldirams.com",
                "customer_care_phone": "011-45204100",
                "label_image_path": "sample-namkeen.svg"
            },
            {
                "product_name": "Pure Cow Ghee Poly Pack",
                "brand": "Amul",
                "category_id": cats["food"].id if cats["food"] else 1,
                "manufacturer_name": "Gujarat Cooperative Milk Marketing Federation Ltd.",
                "manufacturer_address": "Amul Dairy Road, Anand, Gujarat - 388001",
                "country_of_origin": "India",
                "batch_number": "AMUL-GH-991",
                "manufacturing_date": "07/2026",
                "expiry_date": "03/2027",
                "net_quantity": 1.0,
                "unit": "l",
                "mrp": 620.0,
                "mrp_declaration_text": "MRP ₹ 620.00 (inclusive of all taxes)",
                "unit_sale_price": "₹ 0.62 per ml",
                "customer_care_email": "customercare@amul.coop",
                "customer_care_phone": "1800-258-3333",
                "label_image_path": "sample-atta.svg"
            },
            {
                "product_name": "Sparkle Lemon Dishwash Bar",
                "brand": "Sparkle Chemicals",
                "category_id": cats["detergent"].id if cats["detergent"] else 1,
                "manufacturer_name": "Sparkle Cleantech Ltd.",
                "manufacturer_address": "GIDC Estate, Phase II, Vatva, Ahmedabad - 382445",
                "country_of_origin": "India",
                "batch_number": "SP-DISH-10",
                "manufacturing_date": "08/2026",
                "expiry_date": "",
                "net_quantity": 300.0,
                "unit": "g",
                "mrp": 35.0,
                "mrp_declaration_text": "MRP Rs. 35.00 (inclusive of all taxes)",
                "unit_sale_price": "₹ 0.12 per g",
                "customer_care_email": "", # VIOLATION: Missing email
                "customer_care_phone": "079-25890000",
                "label_image_path": "sample-detergent.svg"
            }
        ]

        added_products = []
        for p_data in products_data:
            existing = db.query(Product).filter(Product.product_name == p_data["product_name"]).first()
            if not existing:
                p = Product(**p_data)
                db.add(p)
                added_products.append(p)
        db.commit()

        # Re-fetch all products
        all_products = db.query(Product).all()
        print(f"Total Products in Database: {len(all_products)}")

        # Run Compliance Engine checks for all products
        comp_engine = ComplianceEngine(db=db)
        for prod in all_products:
            # check if compliance check exists
            has_check = db.query(ComplianceCheck).filter(ComplianceCheck.product_id == prod.id).first()
            if not has_check:
                comp_engine.run_compliance_check(
                    product_data={
                        "product_id": prod.id,
                        "product_name": prod.product_name,
                        "brand": prod.brand,
                        "manufacturer_name": prod.manufacturer_name,
                        "manufacturer_address": prod.manufacturer_address,
                        "country_of_origin": prod.country_of_origin,
                        "batch_number": prod.batch_number,
                        "manufacturing_date": prod.manufacturing_date,
                        "net_quantity": prod.net_quantity,
                        "unit": prod.unit,
                        "mrp": prod.mrp,
                        "mrp_declaration_text": prod.mrp_declaration_text,
                        "unit_sale_price": prod.unit_sale_price,
                        "customer_care_email": prod.customer_care_email,
                        "customer_care_phone": prod.customer_care_phone,
                    },
                    user_id=inspector.id if inspector else None,
                    save_to_db=True
                )

        # Seed Realistic Field Inspections
        inspections_data = [
            {
                "inspection_number": "INSP-LMR-2026-003",
                "product_name": "Pure Cow Ghee Poly Pack",
                "location": "Reliance Smart Superstore, Vashi, Navi Mumbai",
                "store_name": "Reliance Retail Ltd.",
                "status": "COMPLIANT",
                "remarks": "Packaging verified under Rule 6(1)(a)-(n). Metric units standard. USP clearly declared.",
                "violations": []
            },
            {
                "inspection_number": "INSP-LMR-2026-004",
                "product_name": "Mediterranean Extra Virgin Olive Oil",
                "location": "Gourmet Plaza, Khan Market, New Delhi",
                "store_name": "Modern Food Hall",
                "status": "SEIZURE_RECOMMENDED",
                "remarks": "Imported commodity seized under Section 15. Missing country of origin under Rule 6(10) and no Indian importer address.",
                "violations": [
                    {
                        "rule_code": "LMR-6-10-COO",
                        "description": "Missing statutory Country of Origin declaration on pre-packed imported commodity.",
                        "severity": "CRITICAL",
                        "penalty_clause": "Section 36(1), Legal Metrology Act, 2009"
                    },
                    {
                        "rule_code": "LMR-6-1-A",
                        "description": "No registered Indian importer or packer postal address with PIN code.",
                        "severity": "CRITICAL",
                        "penalty_clause": "Section 36(1), Legal Metrology Act, 2009"
                    }
                ]
            },
            {
                "inspection_number": "INSP-LMR-2026-005",
                "product_name": "Crispy Aloo Bhujia Namkeen",
                "location": "Aggarwal Sweets & Provisions, Pitampura, Delhi",
                "store_name": "Aggarwal Retail Hub",
                "status": "COMPLIANT",
                "remarks": "Label complies with Schedule II font height and metric unit declarations.",
                "violations": []
            },
            {
                "inspection_number": "INSP-LMR-2026-006",
                "product_name": "Sparkle Lemon Dishwash Bar",
                "location": "Shri Ram General Store, Gomti Nagar, Lucknow",
                "store_name": "Shri Ram Provisions",
                "status": "NOTICE_ISSUED",
                "remarks": "Statutory notice issued to manufacturer under Section 48 for missing grievance email.",
                "violations": [
                    {
                        "rule_code": "LMR-6-1-N-EMAIL",
                        "description": "Missing customer care grievance email address required under Rule 6(1)(n).",
                        "severity": "MEDIUM",
                        "penalty_clause": "Section 36(1), Legal Metrology Act, 2009"
                    }
                ]
            }
        ]

        rep_gen = ReportGenerator()

        for insp_d in inspections_data:
            existing = db.query(Inspection).filter(Inspection.inspection_number == insp_d["inspection_number"]).first()
            if not existing:
                prod = db.query(Product).filter(Product.product_name == insp_d["product_name"]).first()
                insp = Inspection(
                    inspection_number=insp_d["inspection_number"],
                    product_id=prod.id if prod else 1,
                    inspector_id=inspector.id if inspector else 1,
                    inspection_date=datetime.utcnow() - timedelta(days=2),
                    location=insp_d["location"],
                    store_name=insp_d["store_name"],
                    status=insp_d["status"],
                    remarks=insp_d["remarks"]
                )
                db.add(insp)
                db.commit()
                db.refresh(insp)

                for v in insp_d["violations"]:
                    viol = Violation(
                        inspection_id=insp.id,
                        rule_code=v["rule_code"],
                        description=v["description"],
                        severity=v["severity"],
                        penalty_clause=v["penalty_clause"],
                        status="OPEN"
                    )
                    db.add(viol)
                db.commit()

                # Generate Official Report PDF
                try:
                    pdf_path = rep_gen.generate_inspection_pdf(
                        inspection_data={
                            "inspection_number": insp.inspection_number,
                            "status": insp.status,
                            "location": insp.location,
                            "store_name": insp.store_name,
                            "remarks": insp.remarks
                        },
                        product_data={
                            "product_name": prod.product_name if prod else "Commodity",
                            "brand": prod.brand if prod else "Brand",
                            "net_quantity": prod.net_quantity if prod else 1,
                            "unit": prod.unit if prod else "kg",
                            "mrp": prod.mrp if prod else 100,
                            "mrp_declaration_text": prod.mrp_declaration_text if prod else "MRP",
                            "unit_sale_price": prod.unit_sale_price if prod else "USP",
                            "batch_number": prod.batch_number if prod else "B-1",
                            "manufacturing_date": prod.manufacturing_date if prod else "08/2026",
                            "manufacturer_name": prod.manufacturer_name if prod else "Mfg",
                            "manufacturer_address": prod.manufacturer_address if prod else "Address",
                            "country_of_origin": prod.country_of_origin if prod else "India",
                        },
                        compliance_check={"score": 100.0 if not insp_d["violations"] else 45.0, "results": []},
                        inspector_name=inspector.name if inspector else "Insp. Rajesh Verma"
                    )
                    rep = Report(
                        inspection_id=insp.id,
                        report_number=f"REP-{insp.inspection_number}",
                        report_path=pdf_path,
                        generated_by=inspector.id if inspector else 1,
                        generated_at=datetime.utcnow()
                    )
                    db.add(rep)
                    db.commit()
                except Exception as e:
                    print(f"Notice during PDF generation: {e}")

        # Seed Realistic Consumer Complaints
        complaints_data = [
            {
                "complainant_name": "Ramesh Kumar",
                "complainant_contact": "9988776655",
                "product_name": "Packaged Cold Drink 750ml",
                "store_details": "Sharma Paan & Kirana Corner, Connaught Place, New Delhi",
                "complaint_type": "Overcharging (Above MRP)",
                "description": "Retailer charged ₹ 45 for a ₹ 40 printed MRP bottle, claiming an unauthorized ₹ 5 'refrigerator electricity fee'.",
                "status": "UNDER_INVESTIGATION"
            },
            {
                "complainant_name": "Sunita Aggarwal",
                "complainant_contact": "9811223344",
                "product_name": "Super Shine Detergent 1kg",
                "store_details": "Gupta General Store, Chandni Chowk, Delhi",
                "complaint_type": "Prohibited Non-Standard Metric Units",
                "description": "Package declares '1000 gms' instead of standard legal SI unit '1000 g' or '1 kg'. Missing postal PIN code on manufacturer address.",
                "status": "RESOLVED"
            },
            {
                "complainant_name": "Vikram Malhotra",
                "complainant_contact": "9871112233",
                "product_name": "Mediterranean Extra Virgin Olive Oil 1L",
                "store_details": "Modern Food Hall, Khan Market, New Delhi",
                "complaint_type": "Missing Country of Origin",
                "description": "Imported commodity sold without declaring Country of Origin or mandatory Indian importer registration details.",
                "status": "SUBMITTED"
            },
            {
                "complainant_name": "Ananya Roy",
                "complainant_contact": "9711889900",
                "product_name": "Mineral Water 1L",
                "store_details": "Railway Station Platform Kiosk #4, New Delhi Railway Station",
                "complaint_type": "Overcharging (Above MRP)",
                "description": "Vendor charged ₹ 20 for ₹ 15 MRP Rail Neer bottle. Overcharging above printed MRP is illegal under Section 36(2).",
                "status": "UNDER_INVESTIGATION"
            }
        ]

        for c_data in complaints_data:
            existing = db.query(Complaint).filter(Complaint.description == c_data["description"]).first()
            if not existing:
                comp = Complaint(
                    user_id=consumer.id if consumer else None,
                    complainant_name=c_data["complainant_name"],
                    complainant_contact=c_data["complainant_contact"],
                    product_name=c_data["product_name"],
                    store_details=c_data["store_details"],
                    complaint_type=c_data["complaint_type"],
                    description=c_data["description"],
                    status=c_data["status"]
                )
                db.add(comp)
        db.commit()

        # Log audit events
        audit_events = [
            ("INSPECTION_SEIZURE", "INSPECTION", "INSP-LMR-2026-004", "Seizure order formulated under Section 15 for missing country of origin"),
            ("STATUTORY_NOTICE", "INSPECTION", "INSP-LMR-2026-006", "Notice issued under Section 48 for missing grievance email"),
            ("GRIEVANCE_REGISTERED", "COMPLAINT", "GRV-1", "Citizen consumer lodged overcharging complaint against Sharma Kirana"),
            ("COMPLIANCE_EVALUATION", "PRODUCT", "PRD-1", "Automatic pre-screening completed: Shakti Bhog Atta scored 100/100"),
        ]

        for action, entity, entity_id, details in audit_events:
            log = AuditLog(
                user_id=inspector.id if inspector else 1,
                user_email=inspector.email if inspector else "inspector@doca.gov.in",
                action=action,
                entity=entity,
                entity_id=entity_id,
                ip_address="10.24.112.5",
                details=details
            )
            db.add(log)
        db.commit()

        print("Database enrichment complete! All tables now have rich, realistic production data.")

    finally:
        db.close()

if __name__ == "__main__":
    enrich()
