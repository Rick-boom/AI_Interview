@echo off
title AI Interview - Launcher
echo ============================================================
echo   AI Interview Platform  -  One-click launcher
echo ============================================================
echo.
echo This opens TWO windows and keeps them running:
echo     * Backend    http://localhost:8000
echo     * Frontend   http://localhost:5173
echo.
echo Keep BOTH windows open while you use the app.
echo Close them (or press Ctrl+C in each) to stop the servers.
echo.
echo Starting backend...
start "AI Interview - Backend" /d "%~dp0backend" cmd /k start-backend.bat

echo Waiting a few seconds before starting the frontend...
timeout /t 6 /nobreak >nul

echo Starting frontend...
start "AI Interview - Frontend" /d "%~dp0frontend" cmd /k start-frontend.bat

echo.
echo ------------------------------------------------------------
echo   Wait until BOTH new windows have finished loading:
echo     - Backend  window shows:  Application startup complete
echo     - Frontend window shows:  Local:   http://localhost:5173/
echo   Then open   http://localhost:5173   in Chrome or Edge.
echo ------------------------------------------------------------
echo.
echo You can close THIS window now.
pause
