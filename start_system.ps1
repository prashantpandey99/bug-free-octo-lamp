# Packaged Commodity Legal Metrology Compliance & Inspection System (DoCA)
# 1-Click Launch Script

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  GOVERNMENT OF INDIA - MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION" -ForegroundColor Yellow
Write-Host "        DIRECTORATE OF LEGAL METROLOGY - COMPLIANCE & INSPECTION SYSTEM" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootPath

Write-Host "[1/3] Checking Python Virtual Environment..." -ForegroundColor Green
if (!(Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    & .venv\Scripts\pip install -r backend\requirements.txt
}

Write-Host "[2/3] Initializing Database (legal_metrology.db)..." -ForegroundColor Green
$env:PYTHONPATH = "backend"
& .venv\Scripts\python.exe backend\enrich_database.py

Write-Host "[3/3] Starting Services..." -ForegroundColor Green

# Start FastAPI Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath'; `$env:PYTHONPATH='backend'; .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start React Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath\frontend'; npm run dev -- --host 0.0.0.0 --port 5173" -WindowStyle Normal

Start-Sleep -Seconds 3

# Open Browser
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  SYSTEM IS ONLINE AND OPERATIONAL!" -ForegroundColor Green
Write-Host "  - React Web Portal : http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  - Backend REST API : http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Database Engine  : legal_metrology.db (Actively Linked)" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan
