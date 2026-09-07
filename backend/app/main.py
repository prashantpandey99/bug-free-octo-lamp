import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.database.session import engine, Base
from app.database.seeder import seed_database
import app.models  # Ensures all SQLAlchemy models are registered

# Import API routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.products import router as products_router
from app.api.rules import router as rules_router
from app.api.compliance import router as compliance_router
from app.api.ocr import router as ocr_router
from app.api.inspections import router as inspections_router
from app.api.reports import router as reports_router
from app.api.complaints import router as complaints_router
from app.api.dashboard import router as dashboard_router
from app.api.audit import router as audit_router
from app.api.grievances import router as grievances_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB tables exist and seed demo data if fresh
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Notice during database initialization: {e}")
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Packaged Commodity Legal Metrology Compliance & Inspection System",
    description=(
        "Official Regulatory Verification & Enforcement Platform for the Directorate of Legal Metrology, "
        "Ministry of Consumer Affairs, Food & Public Distribution, Government of India. "
        "Built for automated packaged commodity compliance checks, OCR Principal Display Panel extraction, "
        "inspection docket management, compoundable offence assessment under Section 36, and statutory reporting."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration - Support local Vite, tunnels, and mobile dev devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist in project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = PROJECT_ROOT / "uploads"
os.makedirs(UPLOADS_DIR / "labels", exist_ok=True)
os.makedirs(UPLOADS_DIR / "reports", exist_ok=True)

# Mount static uploads directory
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Mount assets from frontend public folder if exists
frontend_assets = PROJECT_ROOT / "frontend" / "public" / "assets"
if frontend_assets.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_assets)), name="assets")

# Include Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(rules_router)
app.include_router(compliance_router)
app.include_router(ocr_router)
app.include_router(inspections_router)
app.include_router(reports_router)
app.include_router(complaints_router)
app.include_router(grievances_router)
app.include_router(dashboard_router)
app.include_router(audit_router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Packaged Commodity Legal Metrology Compliance & Inspection System",
        "department": "Ministry of Consumer Affairs (DoCA)",
        "statutory_act": "Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011",
        "version": "2.0.0"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"An internal server error occurred: {str(exc) or type(exc).__name__}",
            "error_type": type(exc).__name__
        }
    )
