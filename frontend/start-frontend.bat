@echo off
title AI Interview - Frontend (port 5173)
cd /d "%~dp0"

echo ============================================================
echo   AI Interview - Frontend   (http://localhost:5173)
echo ============================================================
echo.

REM --- Make sure Node.js is available ---
node --version >nul 2>&1
if errorlevel 1 goto :nonode

if not exist "node_modules" (
    echo [1/2] Installing npm packages ^(first run can take a couple of minutes^) ...
    call npm install
    if errorlevel 1 goto :npmfail
) else (
    echo [1/2] Node packages found.
)

echo [2/2] Starting frontend at http://localhost:5173
echo        Keep this window OPEN. When it prints
echo            Local:   http://localhost:5173/
echo        open that address in Chrome or Edge. Press Ctrl+C to stop.
echo.
call npm run dev
echo.
echo Frontend stopped.
pause
exit /b 0

:nonode
echo ERROR: Node.js was not found on your PATH.
echo Install the LTS version from https://nodejs.org/ then run this file again.
echo.
pause
exit /b 1

:npmfail
echo ERROR: npm install failed. Scroll up for the details.
echo.
pause
exit /b 1
