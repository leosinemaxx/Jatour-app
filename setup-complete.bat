@echo off
echo ========================================
echo  JaTour Database Setup (Complete)
echo ========================================
echo.

echo [1/4] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo Error: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [3/4] Creating SQLite database...
npx prisma db push
if %errorlevel% neq 0 (
    echo Error: Failed to create database
    pause
    exit /b 1
)

echo.
echo [4/4] Seeding database with rich data...
npm run prisma:seed
if %errorlevel% neq 0 (
    echo Error: Failed to seed database
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ✅ Setup Complete!
echo ========================================
echo.
echo Your JaTour app is ready to run!
echo.
echo 🚀 To start the application:
echo.
echo Frontend (Recommended):
echo   npm run dev
echo.
echo Backend API:
echo   npm run dev:server
echo.
echo Or run both together:
echo   npm run dev:full
echo.
echo 🔑 Demo Accounts:
echo   demo@jatour.com / demo123
echo   traveler@jatour.com / traveler123
echo   mountain@jatour.com / mountain123
echo   beachlover@jatour.com / beach123
echo   photographer@jatour.com / photo123
echo.
pause
