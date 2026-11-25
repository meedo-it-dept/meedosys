@echo off
title MEEDOSys Backend (PocketBase + Permanent Ngrok Domain)
color 0A

echo =============================================================
echo   MEEDOSys v2.0 - Municipal Economic Enterprise System
echo   Starting PocketBase Backend + Permanent Domain...
echo =============================================================
echo.

:: 1. Navigate to PocketBase directory
cd /d "D:\IBM-Latin\market\pocketbase"

:: 2. Check if PocketBase is already running
tasklist /FI "IMAGENAME eq pocketbase.exe" 2>NUL | find /I /N "pocketbase.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] PocketBase is already running on port 8090.
) else (
    echo [1/2] Launching PocketBase Server [port 8090]...
    start "MEEDOSys - PocketBase Database" /min "pocketbase.exe" serve --http="0.0.0.0:8090"
    ping 127.0.0.1 -n 3 >nul
    echo [OK] PocketBase launched successfully.
)

:: 3. Launch Ngrok with Permanent Domain
echo.
echo [2/2] Connecting to Permanent Domain: unkind-staff-glancing.ngrok-free.dev...
echo =============================================================
echo   - Local Admin Dashboard: http://127.0.0.1:8090/_/
echo   - Permanent API Domain:  https://unkind-staff-glancing.ngrok-free.dev
echo   - Hosted Application:    https://meedosystem.web.app
echo.
echo   Keep this window open while using the system!
echo =============================================================
echo.
echo Launching Web Application in browser...
start https://meedosystem.web.app

.\ngrok.exe http 8090 --url https://unkind-staff-glancing.ngrok-free.dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTE] If ngrok command failed, make sure ngrok is installed and authtoken added.
    pause
)
