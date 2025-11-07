# JaTour App - Backend Configuration

A travel planning application built with Next.js and JSON Server.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. The project uses JSON Server as a mock backend. The database is configured in `db.json`.

### Running the Application

#### Development Mode

You need to run **two terminals** simultaneously:

**Terminal 1 - Next.js Dev Server:**
```bash
npm run dev
```
This starts the Next.js app on `http://localhost:3000`

**Terminal 2 - JSON Server (Mock Backend):**
```bash
npm run json-server
```
This starts the JSON Server API on `http://localhost:3001`

#### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
jatour-app/
├── app/                          # Next.js App Router
│   ├── components/              # Reusable components
│   ├── dashboard/               # Dashboard pages
│   │   └── section/            # Dashboard sections
│   │       ├── homepage.tsx     # Home (Beranda)
│   │       ├── feedpage.tsx     # Explore (Eksplor)
│   │       ├── itinerarypage.tsx # My Itinerary (Jadwalku)
│   │       └── settingspage.tsx  # Settings (Pengaturan)
│   ├── signin/                  # Sign in page
│   ├── signup/                  # Sign up page
│   ├── datatypes.ts            # TypeScript types
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── lib/                         # Utilities and configurations
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/                  # Custom React hooks
│   │   └── useData.ts         # Data fetching hooks
│   ├── api.ts                 # API utility functions
│   └── utils.ts               # Helper utilities
├── public/                     # Static assets
├── db.json                     # JSON Server database
├── .env.local                 # Environment variables
└── package.json               # Dependencies
```

## 🔌 API Endpoints

The JSON Server provides the following REST API endpoints:

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users?email=xxx` - Get user by email
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Itineraries
- `GET /itineraries` - Get all itineraries
- `GET /itineraries/:id` - Get itinerary by ID
- `GET /itineraries?userId=xxx` - Get user's itineraries
- `POST /itineraries` - Create new itinerary
- `PATCH /itineraries/:id` - Update itinerary
- `DELETE /itineraries/:id` - Delete itinerary

### Destinations
- `GET /destinations` - Get all destinations
- `GET /destinations/:id` - Get destination by ID
- `GET /destinations?city=xxx` - Filter by city
- `GET /destinations?category=xxx` - Filter by category
- `GET /destinations?featured=true` - Get featured destinations
- `GET /destinations?q=search` - Search destinations

### Weather
- `GET /weather` - Get all weather data
- `GET /weather/:id` - Get weather by ID
- `GET /weather?city=xxx` - Get weather by city

### Wallet
- `GET /wallet` - Get all wallets
- `GET /wallet/:id` - Get wallet by ID
- `GET /wallet?userId=xxx` - Get user's wallet
- `PATCH /wallet/:id` - Update wallet

### Transactions
- `GET /transactions` - Get all transactions
- `GET /transactions/:id` - Get transaction by ID
- `GET /transactions?userId=xxx` - Get user's transactions
- `POST /transactions` - Create new transaction

### Notifications
- `GET /notifications` - Get all notifications
- `GET /notifications/:id` - Get notification by ID
- `GET /notifications?userId=xxx` - Get user's notifications
- `POST /notifications` - Create new notification
- `PATCH /notifications/:id` - Update notification (mark as read)
- `DELETE /notifications/:id` - Delete notification

### Recommendations
- `GET /recommendations` - Get all recommendations
- `GET /recommendations?userId=xxx` - Get user's recommendations

### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID

## 🛠️ API Usage Examples

### Using the API utilities:

```typescript
import api from "@/lib/api";

// User authentication
const user = await api.user.login("email@example.com", "password");

// Get user's itineraries
const itineraries = await api.itinerary.getByUserId(user.id);

// Search destinations
const destinations = await api.destination.search("Surabaya");

// Get wallet balance
const wallet = await api.wallet.getByUserId(user.id);

// Create transaction
const transaction = await api.transaction.create({
  userId: user.id,
  walletId: wallet.id,
  type: "expense",
  amount: 150000,
  description: "Hotel booking",
  category: "accommodation"
});
```

### Using React hooks:

```typescript
import { useItineraries, useWallet, useWeather } from "@/lib/hooks/useData";

function MyComponent() {
  const { data: itineraries, isLoading, error } = useItineraries();
  const { data: wallet } = useWallet();
  const { data: weather } = useWeather("Surabaya");
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Your component */}</div>;
}
```

### Using Auth Context:

```typescript
import { useAuth } from "@/lib/contexts/AuthContext";

function LoginForm() {
  const { login, isLoading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## 📱 UI Pages Structure

Based on your design, the app has these main pages:

1. **Beranda (Home)** - `homepage.tsx`
   - Weather display
   - User profile section
   - Quick access buttons (Travel Card, Balance and Point, E-KTP and Sim, Record)
   - Trip recommendations
   - Nearby destinations

2. **Eksplor (Explore)** - `feedpage.tsx`
   - Search destinations
   - Filter by categories
   - Browse all destinations

3. **Jadwalku (My Itinerary)** - `itinerarypage.tsx`
   - List of upcoming trips
   - Trip details with dates
   - Day-by-day itinerary

4. **Pengaturan (Account/Settings)** - `settingspage.tsx`
   - User profile
   - Edit profile
   - Notification settings
   - Calendar integration
   - My transportation
   - App settings
   - Privacy policy
   - Terms & conditions
   - Theme settings
   - Log out

5. **Wallet** (to be implemented)
   - Balance display
   - Top up options (GoPay, OVO, DANA, Bank Transfer)
   - Payment methods
   - Transaction history
   - E-money card management

## 🔧 Utility Functions

The `lib/utils.ts` file provides many helper functions:

### Date & Time
- `formatDate()` - Format dates in various styles
- `formatTime()` - Format time strings
- `getDaysBetween()` - Calculate days between dates
- `getDaysUntil()` - Days until a future date

### Currency
- `formatCurrency()` - Format numbers as currency (IDR/USD)

### Validation
- `isValidEmail()` - Email validation
- `isValidPhone()` - Phone number validation
- `isValidPassword()` - Password strength validation

### String Operations
- `truncate()` - Truncate long text
- `capitalize()` - Capitalize strings
- `slugify()` - Create URL-friendly slugs

### Storage
- `storage.set()` / `storage.get()` - LocalStorage helpers
- `sessionStorage.set()` / `sessionStorage.get()` - SessionStorage helpers

## 🔐 Authentication Flow

1. User signs up with email, password, full name, and phone
2. Auth context stores user ID in localStorage
3. User can log in with email and password
4. Auth context provides user data throughout the app
5. Protected routes check authentication status

## 💾 Data Models

### User
```typescript
{
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  profilePicture?: string;
  preferences: {
    language: "id" | "en";
    notifications: boolean;
    theme: "light" | "dark";
  };
  createdAt: string;
}
```

### Itinerary
```typescript
{
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  thumbnail?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  days: ItineraryDay[];
  createdAt: string;
}
```

### Destination
```typescript
{
  id: string;
  name: string;
  city: string;
  province: string;
  category: string;
  rating: number;
  image: string;
  description: string;
  coordinates: { lat: number; lng: number };
  price: { min: number; max: number; currency: string };
  featured: boolean;
}
```

## 🎨 Styling

The project uses:
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

## 🚧 Future Enhancements

- [ ] Integrate real weather API
- [ ] Add Google Maps integration
- [ ] Implement payment gateway
- [ ] Add social features (share trips)
- [ ] Real-time notifications
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Export itinerary as PDF

## 📝 Notes

- The backend uses JSON Server, which is perfect for development but should be replaced with a real database (PostgreSQL, MongoDB, etc.) for production
- All passwords are stored in plain text in the mock database - implement proper hashing in production
- Images are referenced by path - set up proper image hosting for production
- Add proper error boundaries and loading states throughout the app

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is private and confidential.

---

**Happy Coding! 🚀**
