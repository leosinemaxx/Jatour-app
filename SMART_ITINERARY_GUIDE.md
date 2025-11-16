# 🧠 Smart Itinerary & Budget Engine Guide

## Overview

The Smart Itinerary section provides two powerful engines that work together to help users plan their Jawa Timur trip efficiently:

1. **Smart Itinerary Engine** - Creates personalized itineraries based on user preferences
2. **Smart Budget Engine** - Calculates accurate budget estimates based on the generated itinerary

## Features

### Smart Itinerary Engine

**Preference Collection:**
- Budget input (IDR)
- Number of days
- Number of travelers
- Start date
- Accommodation type (Budget, Moderate, Luxury)
- Interests (Mountain, Beach, Temple, Nature, Park, Museum, Culinary, Shopping)
- Preferred cities (Surabaya, Malang, Banyuwangi, etc.)

**Itinerary Generation:**
- AI-powered destination recommendations
- Optimal route calculation (nearest neighbor algorithm)
- Day-by-day schedule with time slots
- Transportation integration between cities
- Accommodation suggestions
- Interactive maps for each destination

### Smart Budget Engine

**Budget Calculation:**
- Accommodation costs (based on type and itinerary)
- Transportation costs (from transportation API)
- Food & drinks estimation
- Activities & entrance fees
- Miscellaneous expenses
- Total budget with breakdown
- Budget comparison (your budget vs estimated cost)

**Features:**
- Real-time calculation based on itinerary
- Per-category breakdown with percentages
- Visual budget cards with gradients
- Remaining budget indicator

## User Flow

1. **Preferences Tab:**
   - User fills in trip details
   - Selects interests and cities
   - Clicks "Generate Smart Itinerary"

2. **Itinerary Tab:**
   - View generated day-by-day itinerary
   - See destinations with maps
   - View transportation and accommodation details
   - Click "Calculate Budget" to proceed

3. **Budget Tab:**
   - View detailed budget breakdown
   - See category-wise costs
   - Compare with original budget
   - See remaining budget

## Integration

### Google Maps
- Maps displayed for each destination
- Interactive markers with info windows
- Click "View Map" to see location
- Integrated in destination cards and itinerary

### Transportation API
- Fetches routes between cities
- Shows transportation type (train, bus, plane, ferry)
- Displays costs and schedules
- Calculates multi-city routes

### Backend Integration
- Uses `/planner/recommendations/:userId` endpoint
- Uses `/planner/route` for route optimization
- Uses `/budget/calculate/:itineraryId` for budget

## API Endpoints Used

- `GET /planner/recommendations/:userId` - Get destination recommendations
- `GET /planner/route` - Calculate optimal route
- `GET /budget/calculate/:itineraryId` - Calculate budget breakdown

## Next Steps

1. Connect to real user authentication to get userId
2. Integrate actual transportation APIs (Traveloka, Tiket.com, etc.)
3. Add ability to save and edit itineraries
4. Add ability to share itineraries
5. Add real-time price updates from APIs

