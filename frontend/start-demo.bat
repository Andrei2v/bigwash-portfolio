@echo off
setlocal
cd /d "%~dp0"
title BigWash - Demo Preview
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo npm is not installed. Reinstall Node.js LTS.
  pause
  exit /b 1
)
if not exist "node_modules\.package-lock.json" (
  echo Installing dependencies for first run...
  call npm ci
  if errorlevel 1 (
    echo Installation failed. Check internet connection.
    pause
    exit /b 1
  )
)
REM Explicit local development/demo flags apply only to this terminal session.
set "VITE_LOCAL_MODE=true"
set "VITE_DEMO_MODE=true"
echo.
echo BIGWASH DEMO: http://localhost:5173/login
echo Register your own local account at /login. No shared demo credentials.
echo No Go backend required. Local accounts are for development only.
echo.
call npm run dev -- --host 127.0.0.1 --port 5173
pause
