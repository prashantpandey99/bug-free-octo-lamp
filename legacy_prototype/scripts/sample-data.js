/**
 * Pre-loaded Packaged Commodities Dataset for Legal Metrology Inspections
 * Contains compliant, partially compliant, and severely non-compliant commodities.
 */

window.SAMPLE_PRODUCTS = [
  {
    id: 'PROD-2026-001',
    productName: 'Golden Leaf Premium Assam Tea',
    brand: 'Golden Leaf',
    category: 'Beverages / Tea',
    imagePath: 'assets/samples/sample-tea.svg',
    barcode: '8901234567890',
    batchNo: 'GLT-2026-B84',
    pdpAreaSqCm: 320,
    actualFontHeightMm: 4.2,
    rawText: `GOLDEN LEAF PREMIUM ASSAM CTC TEA
COMMON / GENERIC NAME: Black Tea (Broken Orange Pekoe CTC Blend)
NET QUANTITY: 500 g
MAXIMUM RETAIL PRICE: MRP Rs. 345.00 (inclusive of all taxes)
Unit Sale Price: ₹ 0.69 / g
MONTH & YEAR OF PACKING: Pkd. Month & Year: 08/2026 | Batch No: GLT-2026-B84
Best Before 12 Months from Packing Date
MANUFACTURED & PACKED BY: Golden Leaf Tea Estates India Pvt. Ltd.
Plot No. 44, Tea Park Industrial Corridor, G.S. Road, Guwahati, Assam - 781015, India
Country of Origin: India | FSSAI Lic. No. 10019011000123
CONSUMER CARE & GRIEVANCE REDRESSAL: Consumer Care Executive, Golden Leaf Tea Estates India Pvt. Ltd., Address same as above
Toll Free: 1800-200-4545 | Email: care@goldenteaindia.com`,
    expectedStatus: 'COMPLIANT',
    expectedScore: 100,
    inspectorNotes: 'Label fully conforms with all statutory provisions of Legal Metrology (Packaged Commodities) Rules, 2011 and Rule 6 declarations.'
  },
  {
    id: 'PROD-2026-002',
    productName: 'Desi Taste Spicy Chana Crunch',
    brand: 'Desi Snacks',
    category: 'Snacks & Confectionery',
    imagePath: 'assets/samples/sample-namkeen.svg',
    barcode: '8909876543210',
    batchNo: 'DS-402',
    pdpAreaSqCm: 240,
    actualFontHeightMm: 3.5,
    rawText: `DESI TASTE SPICY MASALA CHANA CRUNCH
PRODUCT DESCRIPTION: Roasted Bengal Gram Snack with Spices
NET QUANTITY: 200 gms
MAXIMUM RETAIL PRICE: MRP Rs 45.00
PACKING DATE: Packed: 07/2026 | Batch: DS-402
Best before 4 months from packing
MANUFACTURED BY: Desi Snacks Foods, Jaipur, Rajasthan
CUSTOMER SUPPORT: Customer queries: Call +91 9876543210`,
    expectedStatus: 'NON_COMPLIANT',
    expectedScore: 35,
    inspectorNotes: 'Major violations under Rule 6(1)(e) (missing tax clause), Rule 12 (illegal unit "gms" instead of "g"), Rule 6(1)(a) (incomplete address without pincode), and Rule 6(1)(n) (missing grievance email).'
  },
  {
    id: 'PROD-2026-003',
    productName: 'Alpine Noir 72% Dark Chocolate',
    brand: 'Alpine Chocolatier',
    category: 'Imported Confectionery',
    imagePath: 'assets/samples/sample-chocolate.svg',
    barcode: '7612345678901',
    batchNo: 'AL-9821',
    pdpAreaSqCm: 180,
    actualFontHeightMm: 2.8,
    rawText: `ALPINE NOIR 72% ARTISAN DARK CHOCOLATE
GENERIC NAME: Dark Chocolate Bar (Cocoa Solids 72% min)
NET QUANTITY: 100 g
MAXIMUM RETAIL PRICE: MRP ₹ 240.00 (incl. of all taxes)
USP: ₹ 2.40 / g
MANUFACTURED DATE & EXPIRY: Mfg Date: 05/2026 | Best Before: 05/2027
OVERSEAS MANUFACTURER: Manufactured by: Alpine Chocolatier SA, Rue de Berne 12, Geneva, Switzerland
CONSUMER COMPLAINTS: Contact: info@alpinechoc.ch`,
    expectedStatus: 'NON_COMPLIANT',
    expectedScore: 40,
    inspectorNotes: 'Statutory import violations: Missing Indian Importer Name & Physical Address (Rule 6(1)(a)), missing explicit Country of Origin declaration (Rule 6(10)), and no Indian grievance redressal contact.'
  },
  {
    id: 'PROD-2026-004',
    productName: 'Ultra Bright Advanced Oxy-Power Detergent',
    brand: 'CleanHome',
    category: 'Home Care / Detergents',
    imagePath: 'assets/samples/sample-detergent.svg',
    barcode: '8905544332211',
    batchNo: 'UBD-609',
    pdpAreaSqCm: 550,
    actualFontHeightMm: 1.8, // Violates 4.0mm requirement
    isSmallFont: true,
    rawText: `ULTRA BRIGHT ADVANCED OXY-POWER DETERGENT SUPER SAVER JUMBO MEGA PACK
GENERIC / COMMON COMMODITY NAME: Synthetic Detergent Powder for Fabric Wash
NET QUANTITY: Net Wt: 3.0 kg
MAXIMUM RETAIL PRICE: MRP Rs. 420.00 (inclusive of all taxes)
MONTH & YEAR OF MANUFACTURING: Mfg. 06/2026 | Batch: UBD-609 | Best Before 24 Months
MANUFACTURED & PACKED BY: CleanHome Consumer Products Pvt. Ltd.
Plot No. 12, Phase-2, GIDC Industrial Estate, Vatva, Ahmedabad, Gujarat - 382445, India
Country of Origin: India
CONSUMER CARE DETAILS: Customer Care Officer, Address as above
Toll Free: 1800-108-9999 | Email: contact@cleanhomeindia.com`,
    expectedStatus: 'PARTIAL_COMPLIANT',
    expectedScore: 65,
    inspectorNotes: 'Font size violation on Principal Display Panel under Schedule II (1.8mm detected vs minimum 4.0mm required for >1kg pack). Unit Sale Price (USP) omitted for 3.0 kg pack.'
  },
  {
    id: 'PROD-2026-005',
    productName: 'Aura Botanics Vitamin C Facial Serum',
    brand: 'Aura Botanics',
    category: 'Cosmetics & Personal Care',
    imagePath: 'assets/samples/sample-serum.svg',
    barcode: '8907766554433',
    batchNo: 'AB-90',
    pdpAreaSqCm: 110,
    actualFontHeightMm: 2.2,
    rawText: `AURA BOTANICS VITAMIN C GLOW RADIANCE FACE SERUM
GENERIC NAME: Cosmetic Facial Serum (For External Use Only)
NET QUANTITY: 30 ml
MAXIMUM RETAIL PRICE: MRP ₹ 599.00 (incl. of all taxes)
USP: ₹ 19.97 / ml
MONTH & YEAR OF MANUFACTURING: Mfg Date: AUG | Batch: AB-90
MANUFACTURED BY: Aura Naturals Cosmeceuticals Pvt. Ltd., Selaqui Industrial Area, Dehradun, UK - 248011
Country of Origin: India | Mfg Lic No: COS/UK/2023/12
CONSUMER FEEDBACK: Contact Manager at: 0135-2448899`,
    expectedStatus: 'PARTIAL_COMPLIANT',
    expectedScore: 70,
    inspectorNotes: 'Incomplete date of manufacture (Missing year "AUG" without 2026) under Rule 6(1)(d). Missing mandatory consumer care email address under Rule 6(1)(n).'
  },
  {
    id: 'PROD-2026-006',
    productName: 'Shrestha Shudh Chakki Atta',
    brand: 'Shrestha Foods',
    category: 'Staples & Grains',
    imagePath: 'assets/samples/sample-atta.svg',
    barcode: '8902233445566',
    batchNo: 'SF-ATT-889',
    pdpAreaSqCm: 480,
    actualFontHeightMm: 6.5,
    rawText: `SHRESTHA SHUDH 100% WHOLE WHEAT CHAKKI ATTA
COMMON / GENERIC NAME: Whole Wheat Flour (Chakki Atta)
NET QUANTITY: 5 kg
MAXIMUM RETAIL PRICE: MRP Rs. 275.00 (inclusive of all taxes)
Unit Sale Price: ₹ 55.00 / kg
MONTH & YEAR OF PACKING: Pkd: 08/2026 | Batch No: SF-ATT-889
Best Before 6 Months from date of packaging
MANUFACTURED & PACKED BY: Shrestha Agro Foods Limited
Plot No. 101, Agro Food Park, NH-48, Gurugram, Haryana - 122004, India
Country of Origin: India | FSSAI Lic. No. 10018064000543
CONSUMER CARE & REDRESSAL CELL: Manager, Consumer Care Cell, Shrestha Agro Foods Ltd, Address same as above
Toll Free: 1800-444-2222 | Email: care@shresthafoods.com`,
    expectedStatus: 'COMPLIANT',
    expectedScore: 100,
    inspectorNotes: '100% compliant food grain packaging with clearly stated Unit Sale Price, standard metric symbol "kg", prominent font size, full address and active consumer grievance cell.'
  }
];

// Historical seed records for inspection dashboard & repository
window.INITIAL_INSPECTIONS = [
  {
    inspectionId: 'INSP-2026-0891',
    date: '2026-08-28T10:15:00Z',
    officerName: 'Insp. Rajesh Verma',
    station: 'Central Zone Metrology Directorate, New Delhi',
    product: window.SAMPLE_PRODUCTS[0],
    complianceStatus: 'COMPLIANT',
    score: 100,
    violations: 0,
    actionTaken: 'Certificate of Compliance Issued',
    fineAmount: 0
  },
  {
    inspectionId: 'INSP-2026-0892',
    date: '2026-08-29T14:30:00Z',
    officerName: 'Insp. Rajesh Verma',
    station: 'Central Zone Metrology Directorate, New Delhi',
    product: window.SAMPLE_PRODUCTS[1],
    complianceStatus: 'NON_COMPLIANT',
    score: 35,
    violations: 4,
    actionTaken: 'Section 36 Compounding Notice Issued',
    fineAmount: 25000
  },
  {
    inspectionId: 'INSP-2026-0893',
    date: '2026-08-30T11:45:00Z',
    officerName: 'Insp. Meenakshi Sundaram',
    station: 'South Zone Port & Customs Metrology Unit, Chennai',
    product: window.SAMPLE_PRODUCTS[2],
    complianceStatus: 'NON_COMPLIANT',
    score: 40,
    violations: 3,
    actionTaken: 'Consignment Seizure & Show Cause Notice Issued',
    fineAmount: 50000
  },
  {
    inspectionId: 'INSP-2026-0894',
    date: '2026-08-31T16:20:00Z',
    officerName: 'Insp. Priya Sharma',
    station: 'West Zone Consumer Protection Unit, Ahmedabad',
    product: window.SAMPLE_PRODUCTS[3],
    complianceStatus: 'PARTIAL_COMPLIANT',
    score: 65,
    violations: 2,
    actionTaken: 'Rectification Notice Issued (15 days)',
    fineAmount: 0
  },
  {
    inspectionId: 'INSP-2026-0895',
    date: '2026-09-01T09:10:00Z',
    officerName: 'Insp. Priya Sharma',
    station: 'North Zone Metrology Division, Dehradun',
    product: window.SAMPLE_PRODUCTS[4],
    complianceStatus: 'PARTIAL_COMPLIANT',
    score: 70,
    violations: 2,
    actionTaken: 'Warning & Label Modification Order',
    fineAmount: 0
  },
  {
    inspectionId: 'INSP-2026-0896',
    date: '2026-09-02T13:00:00Z',
    officerName: 'Insp. Rajesh Verma',
    station: 'Central Zone Metrology Directorate, New Delhi',
    product: window.SAMPLE_PRODUCTS[5],
    complianceStatus: 'COMPLIANT',
    score: 100,
    violations: 0,
    actionTaken: 'Certificate of Compliance Issued',
    fineAmount: 0
  }
];
