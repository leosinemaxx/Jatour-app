// app/datatypes.ts

// Representasi satu destinasi wisata
export interface Destination {
  image: string;
  id: string;
  name: string;
  city: string;
  province?: string;
  country?: string;
  tags?: string[];
  description?: string;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  priceRange?: string; // e.g., "$$", "budget", "moderate", "luxury"
  category?: string; // e.g., "Nature", "Museum", "Beach", "Mountain", "Temple", "Park"
  coordinates?: { lat: number; lng: number };
  address?: string;
  openingHours?: string;
  contact?: string;
  website?: string;
  featured?: boolean;
  disabledFriendly?: boolean;
  accessibilityFeatures?: {
    wheelchairAccessible?: boolean;
    accessibleParking?: boolean;
    accessibleRestrooms?: boolean;
    audioGuide?: boolean;
    signLanguage?: boolean;
    accessiblePaths?: boolean;
    elevator?: boolean;
    accessibleShuttle?: boolean;
  };
}

// Representasi itinerary / jadwal perjalanan user
export interface Itinerary {
  id: string;
  title: string;
  city: string;
  startDate: string;
  endDate: string;
  destinations?: Destination[]; // daftar destinasi dalam itinerary
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// (Opsional) Data user untuk keperluan settings / profile
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  preferences?: {
    theme?: "light" | "dark";
    language?: string;
  };
}

// Type untuk response API umum
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// Additional types for API client
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Weather {
  id: string;
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: any[];
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  cards?: PaymentCard[];
}

export interface PaymentCard {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  type: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: "expense" | "topup" | "refund";
  amount: number;
  description: string;
  category: string;
  method: string;
  date: string;
  itineraryId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  destinationId: string;
  priority: number;
  reason: string;
  destination?: Destination;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Activity {
  id: string;
  name: string;
  duration: string;
  cost: number;
  type: string;
  location?: string;
  time?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}

// Price Comparison Types
export interface HotelComparisonRequest {
  location: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms?: number;
  budget?: number;
  preferences?: {
    amenities?: string[];
    rating?: number;
    propertyType?: string[];
  };
}

export interface HotelComparisonResult {
  id: string;
  name: string;
  provider: 'Agoda' | 'Booking.com' | 'Mock';
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  amenities: string[];
  roomType: string;
  cancellationPolicy: string;
  breakfastIncluded: boolean;
  distanceFromCenter?: number;
  bookingUrl?: string;
  score: number; // Ranking score
}

export interface TransportationComparisonRequest {
  from: string;
  to: string;
  date?: string;
  passengers?: number;
  vehicleType?: 'car' | 'motorcycle' | 'taxi' | 'bus';
  budget?: number;
  preferences?: {
    maxDuration?: number;
    preferredProviders?: string[];
  };
}

export interface TransportationComparisonResult {
  id: string;
  provider: 'Gojek' | 'Grab' | 'Bluebird' | 'Traveloka' | 'RedBus' | 'Mock';
  type: 'ride-hail' | 'taxi' | 'bus' | 'train' | 'plane';
  price: number;
  currency: string;
  duration: string;
  distance: number;
  vehicleType?: string;
  schedule?: string[];
  bookingUrl?: string;
  score: number; // Ranking score
}

export interface DiningComparisonRequest {
  location: string;
  cuisine?: string;
  priceRange?: 'budget' | 'moderate' | 'premium';
  guests?: number;
  date?: string;
  time?: string;
  budget?: number;
  preferences?: {
    dietaryRestrictions?: string[];
    ambiance?: string[];
    features?: string[];
  };
}

export interface DiningComparisonResult {
  id: string;
  name: string;
  provider: 'Restaurant' | 'Mock';
  cuisine: string;
  priceRange: 'budget' | 'moderate' | 'premium';
  averagePrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  phone?: string;
  website?: string;
  specialties: string[];
  features: string[];
  operatingHours: { [key: string]: string };
  reservationRequired: boolean;
  bookingUrl?: string;
  score: number; // Ranking score
}

// Service Interfaces
export interface PriceComparisonService {
  compareHotels(request: HotelComparisonRequest): Promise<HotelComparisonResult[]>;
  compareTransportation(request: TransportationComparisonRequest): Promise<TransportationComparisonResult[]>;
  compareDining(request: DiningComparisonRequest): Promise<DiningComparisonResult[]>;
}

export interface RankingEngine {
  rankHotels(results: HotelComparisonResult[], userPreferences?: any): HotelComparisonResult[];
  rankTransportation(results: TransportationComparisonResult[], userPreferences?: any): TransportationComparisonResult[];
  rankDining(results: DiningComparisonResult[], userPreferences?: any): DiningComparisonResult[];
}

export interface PriceAggregationService {
  aggregateHotelPrices(request: HotelComparisonRequest): Promise<HotelComparisonResult[]>;
  aggregateTransportationPrices(request: TransportationComparisonRequest): Promise<TransportationComparisonResult[]>;
  aggregateDiningPrices(request: DiningComparisonRequest): Promise<DiningComparisonResult[]>;
}
