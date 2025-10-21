@echo off
title Axzora Super App - Local Server
cls

echo.
echo ===============================================
echo    🚀 AXZORA SUPER APP LAUNCHER
echo ===============================================
echo.
echo Starting the local development server...
echo.

REM Change to the frontend directory
cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python 3.x
    echo    Download from: https://python.org
    pause
    exit /b 1
)

REM Start the server
echo ✅ Python found - starting server...
echo.
python server.py

echo.
echo 👋 Server stopped. Press any key to exit...
pause >nul