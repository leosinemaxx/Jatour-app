// User Types
export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  profilePicture?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  language: "id" | "en";
  notifications: boolean;
  theme: "light" | "dark";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferences?: {
    theme?: "light" | "dark";
    language?: string;
  };
}

// Itinerary Types
export interface Itinerary {
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

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  duration: number; // in minutes
  category: "sightseeing" | "food" | "accommodation" | "transport" | "other";
  notes?: string;
  cost?: number;
}

// Destination Types
export interface Destination {
  id: string;
  name: string;
  city: string;
  province: string;
  category: DestinationCategory;
  rating: number;
  image: string;
  description: string;
  coordinates: Coordinates;
  price: PriceRange;
  featured: boolean;
}

export type DestinationCategory = 
  | "Beach" 
  | "Mountain" 
  | "Temple" 
  | "Nature" 
  | "Park" 
  | "Shopping" 
  | "Museum" 
  | "Restaurant" 
  | "Hotel";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: "IDR" | "USD";
}

// Weather Types
export interface Weather {
  id: string;
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  forecast?: string;
  timestamp: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: "IDR" | "USD";
  cards: PaymentCard[];
}

export interface PaymentCard {
  id: string;
  type: "debit" | "credit";
  lastFourDigits: string;
  bankName: string;
  isDefault: boolean;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: "expense" | "topup" | "refund";
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string;
  itineraryId?: string;
  method?: PaymentMethod;
}

export type TransactionCategory = 
  | "accommodation" 
  | "transport" 
  | "food" 
  | "tickets" 
  | "shopping" 
  | "topup" 
  | "other";

export type PaymentMethod = 
  | "gopay" 
  | "ovo" 
  | "dana" 
  | "bank_transfer" 
  | "credit_card" 
  | "debit_card";

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: "itinerary" | "transaction" | "destination";
}

export type NotificationType = 
  | "reminder" 
  | "transaction" 
  | "promotion" 
  | "system" 
  | "social";

// Recommendation Types
export interface Recommendation {
  id: string;
  userId: string;
  destinationId: string;
  destination?: Destination;
  title: string;
  type: "destination" | "itinerary" | "activity";
  priority: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  confirmPassword?: string;
}

export interface ItineraryForm {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  thumbnail?: string;
}

export interface ActivityForm {
  time: string;
  title: string;
  location: string;
  duration: number;
  category: Activity["category"];
  notes?: string;
  cost?: number;
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  category?: DestinationCategory;
  city?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
}

export interface ItineraryFilters {
  status?: Itinerary["status"];
  startDate?: string;
  endDate?: string;
  destination?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

// Dashboard Stats
export interface DashboardStats {
  upcomingTrips: number;
  completedTrips: number;
  totalSpent: number;
  savedDestinations: number;
}

// Session/Auth Types
export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}
