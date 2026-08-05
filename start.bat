@echo off
REM Real Estate Platform - Quick Start Script for Windows
REM Run this file to set up and start the application

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   Real Estate Premium Platform - Quick Start Setup         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found!
    echo   Please install from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo   Node.js version: %NODE_VERSION%

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm not found!
    echo   Please install npm
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
echo   npm version: %NPM_VERSION%

echo.
echo ════════════════════════════════════════════════════════════
echo   STEP 1: Installing Dependencies
echo ════════════════════════════════════════════════════════════
echo.

if exist "node_modules" (
    echo ✓ node_modules already exists
    set /p REINSTALL="Reinstall dependencies? (y/n): "
    if /i "!REINSTALL!"=="y" (
        call npm install
    )
) else (
    echo Installing dependencies (this may take 2-5 minutes)...
    call npm install
)

echo.
echo ════════════════════════════════════════════════════════════
echo   STEP 2: Environment Setup
echo ════════════════════════════════════════════════════════════
echo.

if exist ".env" (
    echo ✓ .env file already exists
    set /p RECREATE="Recreate from template? (y/n): "
    if /i "!RECREATE!"=="y" (
        copy .env.example .env
        echo ✓ .env recreated from template
    )
) else (
    echo Creating .env from template...
    copy .env.example .env
    echo ✓ .env created
)

echo.
echo ════════════════════════════════════════════════════════════
echo   STEP 3: AWS Credentials Setup
echo ════════════════════════════════════════════════════════════
echo.
echo Please add your AWS credentials to .env file:
echo.
echo   1. Open: .env (in your project folder)
echo   2. Get credentials from AWS Console:
echo      - VITE_AWS_ACCESS_KEY_ID
echo      - VITE_AWS_SECRET_ACCESS_KEY  
echo      - VITE_S3_BUCKET_NAME
echo      - VITE_AWS_REGION
echo.
echo   3. Save the file
echo.

echo Opening .env file for editing...
start notepad .env

set /p EDITED="Have you filled in AWS credentials and saved? (y/n): "
if /i not "!EDITED!"=="y" (
    echo ✗ Please fill in AWS credentials first
    echo See ENV_SETUP.md for detailed instructions
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════
echo   STEP 4: Verifying Setup
echo ════════════════════════════════════════════════════════════
echo.

REM Check .env for template values
find "your_" .env >nul 2>&1
if not errorlevel 1 (
    echo ✗ .env still has template values!
    echo Please update .env with your real credentials
    pause
    exit /b 1
)

echo ✓ .env looks good
echo ✓ npm dependencies installed
echo ✓ Ready to start!

echo.
echo ════════════════════════════════════════════════════════════
echo   STARTING DEVELOPMENT SERVER
echo ════════════════════════════════════════════════════════════
echo.
echo Server will start at: http://localhost:5173
echo.
echo Login with:
echo   Email: demo@example.com
echo   Password: password
echo.
echo Press Ctrl+C to stop server
echo.

timeout /t 3

REM Start dev server
call npm run dev

pause
