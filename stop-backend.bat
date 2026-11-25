@echo off
title MEEDOSys Backend Stopper
color 0C

echo =============================================================
echo   MEEDOSys v2.0 - Stopping PocketBase and Cloudflare
echo =============================================================
echo.

taskkill /F /IM pocketbase.exe 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] PocketBase stopped.
) else (
    echo [INFO] PocketBase was not running.
)

taskkill /F /IM ngrok.exe 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Ngrok stopped.
) else (
    echo [INFO] Ngrok was not running.
)

taskkill /F /IM cloudflared.exe 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Cloudflared stopped.
) else (
    echo [INFO] Cloudflared was not running.
)

echo.
echo All MEEDOSys backend processes have been stopped cleanly.
timeout /t 3 >nul
