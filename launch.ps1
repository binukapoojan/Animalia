# ANIMALIA — Native PowerShell Application Launcher
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ForwardArgs
)

# 1. Lock working directory to this script's directory across drives
Set-Location -LiteralPath $PSScriptRoot

Write-Host "============================================================" -ForegroundColor DarkYellow
Write-Host "  ANIMALIA - Interactive Biodiversity Expedition Platform   " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor DarkYellow
Write-Host ""

# 2. Check Node.js environment
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js was not detected in your PATH." -ForegroundColor Red
    Write-Host "Please install Node.js version 18 or newer from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# 3. Check npm environment
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm was not detected in your PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 4. Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies ('npm install')..." -ForegroundColor Cyan
    npm.cmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install project dependencies." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit $LASTEXITCODE
    }
    Write-Host "[SUCCESS] Dependencies installed." -ForegroundColor Green
    Write-Host ""
}

# 5. Execute Node.js launcher
& node scripts/launch.js $ForwardArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ANIMALIA] Application exited with exit code $LASTEXITCODE." -ForegroundColor Red
}

exit $LASTEXITCODE
