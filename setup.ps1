# PowerShell Setup Script for JaTour App
# Run this script to set up the development environment

Write-Host "🚀 Setting up JaTour Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local" -ErrorAction SilentlyContinue
    Write-Host "✅ Created .env.local - Please update DATABASE_URL with your PostgreSQL credentials" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.local with your PostgreSQL DATABASE_URL" -ForegroundColor White
Write-Host "2. Create PostgreSQL database: CREATE DATABASE jatour;" -ForegroundColor White
Write-Host "3. Run: npm run prisma:generate" -ForegroundColor White
Write-Host "4. Run: npm run prisma:migrate" -ForegroundColor White
Write-Host "5. Run: npm run prisma:seed (optional)" -ForegroundColor White
Write-Host "6. Start servers:" -ForegroundColor White
Write-Host "   - Terminal 1: npm run dev:server" -ForegroundColor Cyan
Write-Host "   - Terminal 2: npm run dev" -ForegroundColor Cyan
Write-Host ""

