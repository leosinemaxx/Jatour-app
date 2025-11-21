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
  createdAt?: string;
  updatedAt?: string;
}

// (Opsional) Data user untuk keperluan settings / profile
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

// Type untuk response API umum
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}
