#!/bin/bash
# Setup Script for JaTour App
# Run this script to set up the development environment

echo "🚀 Setting up JaTour Development Environment..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local 2>/dev/null || true
    echo "✅ Created .env.local - Please update DATABASE_URL with your PostgreSQL credentials"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Update .env.local with your PostgreSQL DATABASE_URL"
echo "2. Create PostgreSQL database: CREATE DATABASE jatour;"
echo "3. Run: npm run prisma:generate"
echo "4. Run: npm run prisma:migrate"
echo "5. Run: npm run prisma:seed (optional)"
echo "6. Start servers:"
echo "   - Terminal 1: npm run dev:server"
echo "   - Terminal 2: npm run dev"
echo ""

