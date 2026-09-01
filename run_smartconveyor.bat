@echo off
title SmartConveyor Launcher (NMDC SIH 26008)
echo ======================================================
echo   SmartConveyor System Launcher
echo   NMDC Bailadila Iron Ore Mine - SIH PS 26008
echo ======================================================
echo.

cd /d "%~dp0"

echo [*] Starting Python ML FastAPI Microservice on port 8000...
start "SmartConveyor ML Service (Port 8000)" cmd /k "cd /d ml\service && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [*] Starting React + Vite Frontend Client on port 3000...
start "SmartConveyor Frontend (Port 3000)" cmd /k "cd /d client && npm run dev -- --host --port 3000"

echo.
echo [OK] Both services launched in separate windows!
echo - Frontend: http://localhost:3000
echo - ML API:   http://127.0.0.1:8000
echo.
pause
