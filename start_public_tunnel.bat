@echo off
title SIH Legal Metrology - Public Internet Tunnel
color 0B

echo ===============================================================================
echo   LEGAL METROLOGY COMPLIANCE SYSTEM - PUBLIC INTERNET TUNNEL LAUNCHER
echo ===============================================================================
echo.
echo Starting secure public tunnel to port 5173 (Frontend + Backend API)...
echo.
echo Your public HTTPS URLs will appear below:
echo -------------------------------------------------------------------------------

ssh -p 443 -R0:127.0.0.1:5173 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 a.pinggy.io

pause
