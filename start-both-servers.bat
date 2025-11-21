@echo off
title JaTour Development Servers
color 0A
echo ========================================
echo  🚀 Starting JaTour Development Servers
echo ========================================
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo [2/3] Starting Backend API Server...
echo    💻 Backend: http://localhost:3001
echo    📊 API Docs: http://localhost:3001/api
echo.
start "JaTour Backend API" cmd /k "npm run dev:server"

echo [3/3] Starting Frontend Application...
echo    🌐 Frontend: http://localhost:3000
echo.
timeout /t 8 /nobreak >nul

start "JaTour Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  ✅ Both servers are starting!
echo ========================================
echo.
echo 📱 Frontend URL: http://localhost:3000
echo 🔌 Backend API:  http://localhost:3001
echo.
echo 🔑 Demo Login: demo@jatour.com / demo123
echo.
echo 📋 Expected Results:
echo    • 100+ destinations in explore page
echo    • Smart itinerary builder in preferences
echo    • Full East Java travel data
echo.
pause
