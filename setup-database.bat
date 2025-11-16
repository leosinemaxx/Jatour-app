@echo off
REM Quick database setup script for Windows
REM Uses full path to psql

set PGPATH="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo Creating jatour database...
%PGPATH% -U postgres -c "CREATE DATABASE jatour;" 2>nul

if %errorlevel% equ 0 (
    echo ✅ Database 'jatour' created successfully!
    echo.
    echo Next steps:
    echo 1. Update .env.local with your DATABASE_URL
    echo 2. Run: npm run prisma:generate
    echo 3. Run: npm run prisma:migrate
) else (
    echo ⚠️  Database might already exist or there was an error.
    echo Try connecting manually to check.
)

pause

