import os
import shutil
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/api/ocr", tags=["OCR Extraction Engine"])

UPLOAD_DIR = os.getenv("LABEL_DIR", "./uploads/labels")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ocr_engine = OCRService()

@router.post("/extract")
async def extract_label_data(file: UploadFile = File(...)):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Generate unique filename
    timestamp = int(datetime.now(timezone.utc).timestamp())
    safe_name = f"label_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store uploaded package image: {str(e)}"
        )

    # Process through OCR pipeline
    result = ocr_engine.process_package_label(file_path)
    result["file_path"] = file_path
    result["file_name"] = safe_name

    return result
