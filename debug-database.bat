@echo off
title JaTour Database Debug
echo ========================================
echo  🔍 JaTour Database Debug Tool
echo ========================================
echo.

echo [1/4] Checking Prisma setup...
npx prisma --version
timeout /t 2 /nobreak >nul

echo [2/4] Checking database connection...
npx prisma db pull --schema=prisma\schema.prisma

echo [3/4] Listing all destinations in database...
npx prisma studio --schema=prisma\schema.prisma --port=5555

echo [4/4] Testing API endpoint...
echo.
echo Please check the following URLs in your browser:
echo 1. http://localhost:3001/destinations (API response)
echo 2. http://localhost:5555 (Prisma Studio for database inspection)
echo.

echo.
echo If you see JSON data with destinations at the first URL, 
echo then the issue is in the frontend. If not, the database is empty.
echo.
pause
