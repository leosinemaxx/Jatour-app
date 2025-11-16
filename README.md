# 🗺️ Jatour - Jawa Timur Travel Planner

A comprehensive travel planning application for Jawa Timur, Indonesia, built with Next.js, NestJS, Prisma, and PostgreSQL.

## ✨ Features

- 🗺️ **Interactive OpenStreetMap** - View destinations on interactive maps (completely free!)
- 📍 **15+ Jawa Timur Destinations** - Comprehensive database with detailed information
- ⭐ **Review System** - User reviews and ratings
- 💰 **Budget Planner** - Smart budget calculation and planning
- 🎯 **Smart Recommendations** - AI-powered destination recommendations
- 📱 **Responsive Design** - Optimized for mobile and desktop
- 🎨 **Smooth Animations** - Beautiful UI with Framer Motion
- 🔐 **User Authentication** - Secure login and registration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create `.env.local` in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/jatour?schema=public"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   FRONTEND_URL="http://localhost:3000"
   PORT=3001
   # OpenStreetMap - No API key needed! Works out of the box.
   ```

3. **Create PostgreSQL database:**
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE jatour;
   \q
   ```

4. **Set up database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # Seed database
   npm run prisma:seed
   ```

5. **Start development servers:**
   
   Terminal 1 (Backend):
   ```bash
   npm run dev:server
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
jatour-app/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── components/       # App-specific components
│   └── ...
├── components/           # Shared UI components
│   ├── ui/              # shadcn/ui components
│   ├── maps/            # OpenStreetMap components
│   └── reviews/         # Review components
├── server/              # NestJS backend
│   └── src/
│       ├── users/       # User module
│       ├── destinations/ # Destination module
│       ├── itineraries/  # Itinerary module
│       ├── planner/     # Planner module
│       └── budget/       # Budget module
├── prisma/              # Prisma schema and migrations
└── lib/                 # Utilities and API client
```

## 🛠️ Available Scripts

- `npm run dev` - Start Next.js dev server
- `npm run dev:server` - Start NestJS backend
- `npm run build` - Build for production
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio

## 🗄️ Database

The application uses PostgreSQL with Prisma ORM. The database includes:

- **Users** - User accounts and authentication
- **Destinations** - Jawa Timur travel destinations
- **Itineraries** - User travel plans
- **Reviews** - Destination reviews and ratings
- **Budgets** - Travel budget planning
- **Favorites** - User favorite destinations

## 🎨 Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** NestJS, Prisma ORM, PostgreSQL
- **UI Components:** shadcn/ui, Radix UI
- **Maps:** Leaflet with OpenStreetMap (completely free, no API key required)
- **Transportation APIs:** Gojek, Grab, Bluebird, Traveloka, RedBus
- **Content APIs:** TripAdvisor, Airbnb
- **HTTP Client:** Axios

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
