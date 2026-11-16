# Coding Buddy PowerShell Startup Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "          Starting Coding Buddy Server...          " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js not detected in PATH. Install from https://nodejs.org" -ForegroundColor Red
    Pause
    Exit 1
}

# Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies via npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "[INFO] Starting dev server at http://localhost:3000" -ForegroundColor Green
Start-Process "http://localhost:3000"
npm run dev
