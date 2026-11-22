@echo off
setlocal
cd /d "%~dp0"
title BigWash Frontend - Local Preview
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Reinstall Node.js LTS.
  pause
  exit /b 1
)
if not exist ".env" (
  if not exist ".env.example" (
    echo [ERROR] .env.example not found. Download the complete project.
    pause
    exit /b 1
  )
  copy /y ".env.example" ".env" >nul
  if errorlevel 1 (
    echo [ERROR] Could not create .env from .env.example.
    pause
    exit /b 1
  )
  echo [OK] Created local development configuration from .env.example.
)
if not exist "node_modules\.package-lock.json" (
  echo Installing project dependencies...
  call npm ci
  if errorlevel 1 (
    echo.
    echo [ERROR] Install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
if /i "%~1"=="--lan" goto lan
echo.
echo =================================================
echo   BigWash will be available at http://localhost:5173
echo   Keep this console window open while browsing.
echo   Create your own local account using the registration form.
echo =================================================
echo.
call npm run dev -- --host 127.0.0.1 --port 5173
pause
exit /b

:lan
node scripts\dev-lan.mjs "%~2"
set "LAN_EXIT_CODE=%ERRORLEVEL%"
pause
exit /b %LAN_EXIT_CODE%
