// app/datatypes.ts

// Representasi satu destinasi wisata
export interface Destination {
  id: string;
  name: string;
  city: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  priceRange?: string; // e.g., "$$", "budget", etc.
  category?: string; // e.g., "Nature", "Museum", "Beach"
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
