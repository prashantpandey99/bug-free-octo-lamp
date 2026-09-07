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

# Check if Backend is already active on port 8000
$Port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($Port8000) {
    Write-Host "  -> Backend REST API is already active on port 8000 (PID: $($Port8000[0].OwningProcess))." -ForegroundColor Yellow
} else {
    Write-Host "  -> Launching FastAPI Backend on port 8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath'; `$env:PYTHONPATH='backend'; .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

# Check if Frontend is already active on port 5173
$Port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($Port5173) {
    Write-Host "  -> Frontend Web Portal is already active on port 5173 (PID: $($Port5173[0].OwningProcess))." -ForegroundColor Yellow
} else {
    Write-Host "  -> Launching React Frontend Portal on port 5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath\frontend'; npm run dev -- --host 0.0.0.0 --port 5173" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

# Open Browser
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  SYSTEM IS ONLINE AND OPERATIONAL!" -ForegroundColor Green
Write-Host "  - React Web Portal : http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  - Backend REST API : http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Database Engine  : legal_metrology.db (Actively Linked)" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan
