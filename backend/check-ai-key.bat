@echo off
title AI Interview - Check Gemini Key
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Please run start-backend.bat once first to set up the environment,
    echo then run this check.
    echo.
    pause
    exit /b 1
)

".venv\Scripts\python.exe" check-ai-key.py
echo.
pause
