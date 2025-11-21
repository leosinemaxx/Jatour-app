# JaTour Database Debug Guide

## 🔍 Step-by-Step Debug Process

### Step 1: Check if Data is in Database
Run this to see if your 100+ destinations were seeded:
```cmd
debug-database.bat
```

**Expected Result**: Prisma Studio should open showing destinations like:
- Gunung Bromo
- Kawah Ijen  
- Pantai Klayar
- Candi Singosari

### Step 2: Test Backend API Directly
Open your browser and go to:
```
http://localhost:3001/destinations
```

**Expected Result**: You should see JSON data with array of destinations.

**If this returns empty array `[]`**: Database is empty
**If this returns data**: Backend is working, issue is in frontend

### Step 3: Test Frontend API Call
Open your browser DevTools (F12) → Network tab
1. Go to `/dashboard` or `/explore`
2. Look for requests to `http://localhost:3001/destinations`
3. Check the response - does it contain data?

### Step 4: Check Frontend Environment
Verify your `.env.local` file has:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL="file:./dev.db"
```

## 🚨 Common Issues & Fixes

### Issue 1: Database is Empty
**Symptoms**: `http://localhost:3001/destinations` returns `[]`
**Fix**: Re-run seeding
```cmd
npm run prisma:seed
```

### Issue 2: CORS Error
**Symptoms**: Console shows CORS errors
**Fix**: Backend CORS setup (check server/src/main.ts)

### Issue 3: API URL Mismatch
**Symptoms**: 404 errors in Network tab
**Fix**: Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Issue 4: Frontend Filters Too Strict
**Symptoms**: API returns data but UI shows nothing
**Fix**: Check explorepage.tsx filtering logic

## 📋 Verification Checklist

- [ ] Prisma Studio shows 100+ destinations
- [ ] `http://localhost:3001/destinations` returns JSON data  
- [ ] Browser DevTools shows successful API calls
- [ ] No CORS errors in console
- [ ] Environment variables are correct

## 🔧 Quick Reset Script
If everything fails, run:
```cmd
rmdir /s /q prisma\dev.db
npm run prisma:seed
npm run dev:server
