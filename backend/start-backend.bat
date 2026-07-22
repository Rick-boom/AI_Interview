@echo off
title AI Interview - Backend (port 8000)
cd /d "%~dp0"

echo ============================================================
echo   AI Interview - Backend   (http://localhost:8000)
echo ============================================================
echo.

REM --- Make sure Python is available ---
python --version >nul 2>&1
if errorlevel 1 goto :nopython

REM --- Create the virtual environment on first run ---
if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Creating virtual environment .venv ...
    python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" goto :venvfail
echo [1/3] Virtual environment ready.

echo [2/3] Installing dependencies ^(first run can take a minute^) ...
".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
if errorlevel 1 goto :pipfail

echo [3/3] Starting backend at http://localhost:8000
echo        Keep this window OPEN while you use the app. Press Ctrl+C to stop.
echo.
".venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
echo.
echo Backend stopped.
pause
exit /b 0

:nopython
echo ERROR: Python was not found on your PATH.
echo Install Python 3.10+ from https://www.python.org/downloads/
echo During setup, tick "Add python.exe to PATH", then run this file again.
echo.
pause
exit /b 1

:venvfail
echo ERROR: Could not create the virtual environment (.venv).
echo Try deleting the .venv folder and running this file again.
echo.
pause
exit /b 1

:pipfail
echo ERROR: Installing dependencies failed. Scroll up for the details.
echo.
pause
exit /b 1
