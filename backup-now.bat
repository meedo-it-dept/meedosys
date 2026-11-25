@echo off
title MEEDOSys - Create Database Backup
color 0B

echo =============================================================
echo   MEEDOSys v2.0 - Municipal Database Backup Generator
echo =============================================================
echo.

cd /d "D:\IBM-Latin\market"
node scripts\create-backup.js

if %ERRORLEVEL% EQU 0 (
    echo [INFO] You can also view and download backups in the browser at:
    echo        http://127.0.0.1:8090/_/#/settings/backups
) else (
    echo [ERROR] Backup creation failed. Make sure PocketBase is running!
)

echo.
pause
