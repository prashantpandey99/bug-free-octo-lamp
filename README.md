# Packaged Commodity Legal Metrology Compliance & Inspection System
### Ministry of Consumer Affairs, Food & Public Distribution (DoCA) • Government of India
**Statutory Regulatory Framework:** *Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011 (LMR 2011)*  
**College / Hackathon Track:** *Smart India Hackathon (SIH) Enforcement & Compliance Automation*

---

## 1. Executive Summary & Objective

The **Packaged Commodity Legal Metrology Compliance & Inspection System (METROLOGY-AI)** is an enterprise regulatory platform built to digitally verify packaged commodity packaging declarations, detect statutory violations, automate field market inspections, assess compoundable penalties under Section 36, and safeguard Indian consumers against deceptive packaging and overcharging.

### Key Capabilities:
- **7-Step Compliance Wizard**: From commodity identification to optical character token extraction and automated rule evaluation.
- **Configurable Dynamic Rule Engine**: Zero hardcoded legislation. Legal Metrology officers can dynamically update rules, regex patterns, thresholds, and penalty severities when Gazette amendments are notified.
- **Computer Vision & OCR Pipeline**: Image preprocessing (grayscale adaptive contrast boost, sharpening) with fallback token parsers to reliably extract MRP, units, dates, batch numbers, and grievance contacts.
- **Section 36 Compoundable Penalty Calculator**: Automatically flags offences (e.g. non-standard metric unit `gms`, missing tax phrase, missing postal PIN code).
- **Official Sealed PDF Reports**: Generates digitally attested Ministry of Consumer Affairs inspection certificates with QR reference codes using ReportLab.
- **Role-Based Access Control (RBAC)**: 5 tailored portals for Admin, Inspector, Manufacturer, Seller, and Citizen Consumer.
- **Immutable Audit Trail**: All inspection, rule, and check events are logged with timestamp, user attribution, and IP address.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, Vanilla CSS Design System, Lucide Icons, Responsive Mobile-First Architecture.
- **Backend**: Python 3.14 / 3.11+, FastAPI, Uvicorn, RESTful JSON APIs.
- **Database Engine**: MySQL 8.0+ / SQLite (Zero-configuration fallback), SQLAlchemy 2.0 ORM.
- **Authentication**: JWT (JSON Web Tokens), PBKDF2/Bcrypt password hashing, Role-Based Access Control guards.
- **Reporting**: ReportLab Engine (Tamper-evident official Government of India PDF certificates).
- **Image Processing / OCR**: Pillow, OpenCV, Modular OCR Service with token regex heuristics.

---

## 3. Database Architecture & Seeded Data

The system uses a normalized relational database schema (`legal_metrology.db` or MySQL `legal_metrology`):

| Table Name | Description | Seeded Record Count |
| :--- | :--- | :--- |
| `users` | 5 RBAC tiers (Admin, Inspector, Manufacturer, Seller, Consumer) | 7 Accounts |
| `categories` | Product classification (Food, Detergents, Bakery, Cosmetics, Beverages) | 5 Categories |
| `products` | Real Indian packaged commodities (Atta, Detergent, Cookies, Tea, Serum, Ghee, Olive Oil, etc.) | 9 Commodities |
| `compliance_rules` | Active statutory rules under LMR 2011 (Rule 6, Rule 12, Schedule II) | 9 Rules |
| `compliance_checks` | Evaluated pre-screening runs with scores (0–100) and status | 12 Checks |
| `compliance_results` | Granular clause-by-clause evaluation findings | 108 Findings |
| `inspections` | On-field inspection dockets across Delhi, Noida, Mumbai, Lucknow | 8 Dockets |
| `violations` | Detected offences with Section 36 statutory penalty attributions | 8 Violations |
| `reports` | Generated and downloadable official PDF reports | 6 Reports |
| `complaints` | Citizen consumer grievances (Overcharging above MRP, missing declarations) | 4 Complaints |
| `audit_logs` | Tamper-evident administrative and statutory event logs | 18 Logs |

---

## 4. Test Credentials for Demonstration

For Smart India Hackathon jury evaluation, use these preloaded official demo accounts (or use the **"⚡ Fast Demo Roles"** 1-click modal in the top navbar):

| Role | Email Address | Password | Official Name & Department |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@doca.gov.in` | `Admin@123` | Dr. Alok Srivastava (Directorate of Legal Metrology) |
| **Inspector** | `inspector@doca.gov.in` | `Inspector@123` | Insp. Rajesh Verma (Central Enforcement Wing) |
| **Manufacturer** | `mfg@shaktibhog.com` | `Mfg@123` | Shakti Bhog Foods Ltd. (Registered Manufacturer) |
| **Seller** | `seller@retailhub.in` | `Seller@123` | Reliance Retail Superstore (Retail Merchant) |
| **Consumer** | `consumer@gmail.com` | `Consumer@123` | Ramesh Kumar (Citizen Consumer) |

---

## 5. Quick Launch Instructions

### Option A: 1-Click Launch (Recommended for Windows)
Double-click `start_system.bat` or run in PowerShell:
```powershell
.\start_system.ps1
```
This automatically verifies dependencies, enriches the database, launches FastAPI on port 8000, launches Vite React on port 5173, and opens your browser.

### Option B: Manual Terminal Execution

#### 1. Backend Setup & Run:
```bash
# In project root
python -m venv .venv
.venv\Scripts\activate

# Install Python requirements
pip install -r backend/requirements.txt

# Enrich / Seed Database
set PYTHONPATH=backend
python backend/enrich_database.py

# Run FastAPI Server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation:* `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup & Run:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
*React Portal URL:* `http://127.0.0.1:5173`

---

## 6. SIH 60-Second Demonstration Workflow

For evaluators and hackathon judges:
1. Open `http://127.0.0.1:5173/`
2. Click the orange **"⚡ Run Fast SIH Demo (60s)"** button in the hero section or navbar.
3. Select **Case #2: Super Shine Detergent (1000 gms)**.
4. Watch the 6-stage computer vision & rule evaluation pipeline execute in real-time.
5. Review the detected non-compliances:
   - ✗ Illegal non-standard unit `gms` (violates Rule 12)
   - ✗ Missing mandatory phrasing `(inclusive of all taxes)` (violates Rule 6(1)(e))
   - ✗ Incomplete manufacturer address missing 6-digit PIN code (violates Rule 6(1)(a))
   - ✗ Missing customer grievance contact (violates Rule 6(1)(n))
6. View the statutory compounding penalty under **Section 36(1) of the Legal Metrology Act, 2009**.
7. Click **"Download Official Inspection PDF"** to inspect the generated tamper-evident certificate.
8. Click **"Rules Matrix"** in navbar to show judges that statutory rules are 100% dynamically configurable by administrators without altering code.

---

## 7. Running Automated Tests

Run the full pytest suite (12 tests passing):
```bash
$env:PYTHONPATH="backend"
.venv\Scripts\pytest backend/tests/ -v
```

Tests cover:
- Endpoint health and OpenAPI schemas
- User registration, password hashing, and JWT authorization
- Dynamic rule evaluation conditions (`UNIT_VALID`, `MRP_TAX_INCLUSIVE`, `PIN_CODE_PRESENT`, `DATE_FORMAT`)
- Illegal metric unit violation detection
- Field inspection recording and Section 36 penalty attribution
- PDF report generation and download streaming
- Modular OCR extraction service

---

## 8. Statutory Disclaimer

> **STATUTORY NOTICE:** This system is an automated regulatory decision-support and pre-screening verification tool developed for the Directorate of Legal Metrology, Ministry of Consumer Affairs, Food & Public Distribution. Official enforcement actions, compounding orders, and seizure notices remain subject to statutory inspection by authorized Legal Metrology Officers under Section 15 of the Legal Metrology Act, 2009.
