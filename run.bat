@echo off
title Coding Buddy Runner
echo ===================================================
echo           Starting Coding Buddy Server...
echo ===================================================
echo.

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [INFO] Launching server on http://localhost:3000
echo [INFO] Press Ctrl+C in this terminal to stop the server.
echo.

:: Automatically open browser after 2 seconds in background
start "" timeout /t 2 /nobreak >nul & start http://localhost:3000

:: Start dev server
call npm run dev
