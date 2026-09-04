import os
from contextlib import asynccontextmanager
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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist
os.makedirs("./uploads/labels", exist_ok=True)
os.makedirs("./uploads/reports", exist_ok=True)

# Mount static uploads directory
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# Also mount assets if exists
if os.path.exists("./assets"):
    app.mount("/assets", StaticFiles(directory="./assets"), name="assets")

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
    # Prevent exposing internal stack traces to end users in production
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal regulatory processing error occurred. Please contact system administration.",
            "error_type": type(exc).__name__
        }
    )
