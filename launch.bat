@echo off
setlocal enabledelayedexpansion

:: 1. Lock working directory to this script's location across drives
cd /d "%~dp0"

echo ============================================================
echo   ANIMALIA - Interactive Biodiversity Expedition Platform
echo ============================================================
echo.

:: 2. Check if Node.js is installed and in PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not detected in your PATH.
    echo Please install Node.js version 18 or newer from https://nodejs.org/
    echo and ensure "Add to PATH" is selected.
    echo.
    pause
    exit /b 1
)

:: 3. Check if npm is installed and in PATH
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm was not detected in your PATH.
    echo Please check your Node.js installation.
    echo.
    pause
    exit /b 1
)

:: 4. Check if node_modules exists (auto-install on first launch)
if not exist "node_modules\" (
    echo [INFO] Dependencies not yet installed. Running 'npm install'...
    echo This may take a moment on first launch.
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install project dependencies.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

:: 5. Launch the unified multi-process orchestrator
call node scripts\launch.js %*
set LAUNCH_EXIT_CODE=%errorlevel%

if %LAUNCH_EXIT_CODE% neq 0 (
    echo.
    echo [ANIMALIA] Application exited with status code !LAUNCH_EXIT_CODE!.
    pause
)

exit /b %LAUNCH_EXIT_CODE%
