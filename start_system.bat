@echo off
title Packaged Commodity Legal Metrology Compliance & Inspection System (DoCA)
color 0A

echo ===============================================================================
echo   GOVERNMENT OF INDIA - MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION
echo         DIRECTORATE OF LEGAL METROLOGY - COMPLIANCE & INSPECTION SYSTEM
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python Virtual Environment...
if not exist ".venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    python -m venv .venv
    .venv\Scripts\pip install -r backend\requirements.txt
)

echo [2/3] Initializing and Verifying Database (legal_metrology.db)...
set PYTHONPATH=backend
.venv\Scripts\python.exe backend\enrich_database.py

echo.
echo [3/3] Starting Backend API Server (FastAPI on port 8000)...
start "DoCA Metrology Backend API" cmd /k "set PYTHONPATH=backend && .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting React Frontend Portal (port 5173)...
cd frontend
start "DoCA Metrology React Portal" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173...
start http://127.0.0.1:5173

echo.
echo ===============================================================================
echo   SYSTEM IS ONLINE AND OPERATIONAL!
echo   - React Web Portal : http://127.0.0.1:5173
echo   - Backend REST API : http://127.0.0.1:8000/docs (OpenAPI Swagger Documentation)
echo   - SQLite Database  : legal_metrology.db (Actively Linked)
echo ===============================================================================
echo.
pause
