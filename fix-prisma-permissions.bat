@echo off
echo ========================================
echo  Fix Prisma Permission Issues
echo ========================================
echo.

echo [1/5] Stopping any running processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Clearing Prisma cache...
rmdir /s /q "node_modules\.prisma" 2>nul
del /q "node_modules\.prisma" 2>nul

echo [3/5] Clearing npm cache...
npm cache clean --force
timeout /t 3 /nobreak >nul

echo [4/5] Reinstalling Prisma...
npm uninstall prisma @prisma/client
npm install prisma@^5.20.0 @prisma/client@^5.20.0
timeout /t 5 /nobreak >nul

echo [5/5] Generating fresh Prisma client...
npx prisma generate

echo.
echo ========================================
echo  ✅ Permission Fix Complete!
echo ========================================
echo.
pause
