@echo off
title Open Legal Metrology Portal
cd /d "%~dp0"

:: Check if port 5173 is running
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo Starting Portal Servers...
    call start_system.bat
    exit /b
)

:: If already running, simply launch default browser to the portal URL
echo Opening Portal in default browser...
start http://localhost:5173
exit /b
