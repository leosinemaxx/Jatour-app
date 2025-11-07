# 🚀 Quick Start Guide

Get your JaTour app up and running in 5 minutes!

## Prerequisites

✅ Node.js 18+ installed  
✅ npm or yarn installed  
✅ Code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start the Development Servers

You need **TWO terminals** open:

### Terminal 1 - Frontend (Next.js)
```bash
npm run dev
```
✅ App runs on: http://localhost:3000

### Terminal 2 - Backend (JSON Server)
```bash
npm run json-server
```
✅ API runs on: http://localhost:3001

## Step 3: Test the Backend

Open http://localhost:3001 in your browser. You should see the JSON Server welcome page.

Try these endpoints:
- http://localhost:3001/users
- http://localhost:3001/destinations
- http://localhost:3001/itineraries

## Step 4: Test Authentication

The default test user is:
- **Email**: `alden@jatour.test`
- **Password**: `1234`

## 🎯 Your First Tasks

### Task 1: Update the Home Page
File: `app/dashboard/section/homepage.tsx`

```typescript
import { useAuth } from "@/lib/contexts/AuthContext";
import { useWeather, useRecommendations } from "@/lib/hooks/useData";

export default function HomePage() {
  const { user } = useAuth();
  const { data: weather } = useWeather("Surabaya");
  const { data: recommendations } = useRecommendations();
  
  return (
    <div>
      <h1>Hi, {user?.fullName}!</h1>
      <p>Temperature: {weather?.temperature}°C</p>
      {/* Add your UI components here */}
    </div>
  );
}
```

### Task 2: Create the Explore Page
File: `app/dashboard/section/feedpage.tsx`

```typescript
import { useDestinations } from "@/lib/hooks/useData";
import { useState } from "react";

export default function ExplorePage() {
  const [category, setCategory] = useState<string>();
  const { data: destinations, isLoading } = useDestinations({ category });
  
  return (
    <div>
      <input 
        type="search" 
        placeholder="Cari tempat Filtersnya..." 
      />
      {/* Category filters */}
      {/* Destination grid */}
    </div>
  );
}
```

### Task 3: Display Itineraries
File: `app/dashboard/section/itinerarypage.tsx`

```typescript
import { useItineraries } from "@/lib/hooks/useData";
import { formatDate } from "@/lib/utils";

export default function ItineraryPage() {
  const { data: itineraries, isLoading } = useItineraries();
  
  return (
    <div>
      <h1>My Itinerary</h1>
      {itineraries?.map(trip => (
        <div key={trip.id}>
          <h2>{trip.title}</h2>
          <p>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
        </div>
      ))}
    </div>
  );
}
```

## 📱 Match Your Design

Your design shows these main sections:

### 1. **Beranda (Home)**
- Weather: 22°C Partly Cloudy ☁️
- User greeting: "Hi, Alden"
- Phone: 081-1309-090-093
- 4 Quick access buttons
- Trip recommendations
- Nearby destinations

### 2. **Eksplor (Explore)**
- Search bar
- Category icons
- Destination cards

### 3. **Jadwalku (My Itinerary)**
- Trip cards with dates
- Destination images
- Status indicators

### 4. **Wallet**
- Balance: IDR 1,000,000
- Payment methods (GoPay, OVO, DANA)
- Transaction history

### 5. **Pengaturan (Settings)**
- Account settings
- Notification settings
- App preferences
- Log out

## 🎨 Styling Tips

Use Tailwind classes to match your design:

```tsx
// Weather card
<div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6">
  <p className="text-white text-4xl">{weather?.temperature}°C</p>
</div>

// Quick access button
<button className="bg-white rounded-xl p-4 shadow-lg">
  <Icon className="w-8 h-8 text-blue-500" />
  <p className="text-sm mt-2">Travel Card</p>
</button>

// Destination card
<div className="rounded-2xl overflow-hidden shadow-lg">
  <img src={destination.image} className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="font-bold">{destination.name}</h3>
    <p className="text-gray-500">{destination.city}</p>
  </div>
</div>
```

## 🔥 Pro Tips

1. **Use the hooks** - They handle loading states automatically
2. **Import types** - Get autocomplete and type safety
3. **Use constants** - Don't hardcode values
4. **Format data** - Use utility functions for dates/currency
5. **Handle errors** - Show user-friendly messages

## 📚 Resources

- **Full Documentation**: `BACKEND_README.md`
- **Configuration Summary**: `CONFIGURATION_SUMMARY.md`
- **API Reference**: `lib/api.ts`
- **Type Definitions**: `app/datatypes.ts`
- **Utilities**: `lib/utils.ts`

## 🆘 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

### API Not Working
- Check if JSON Server is running on port 3001
- Verify `.env.local` has correct API URL
- Check browser network tab for API calls

### Type Errors
- Run `npm install` to ensure all dependencies are installed
- Check import paths are correct
- Ensure TypeScript is configured correctly

## 🎉 You're Ready!

Now start building your beautiful UI! The backend is fully configured and ready to serve your data.

**Next Steps:**
1. ✅ Servers running
2. 🎨 Design your components
3. 🔌 Connect to the API
4. ✨ Add animations
5. 🚀 Deploy!

Happy coding! 💻
