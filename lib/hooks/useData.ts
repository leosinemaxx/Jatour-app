"use client";

import { useState, useEffect } from "react";
import { 
  Itinerary, 
  Destination, 
  Weather, 
  Wallet, 
  Transaction, 
  Notification,
  Recommendation 
} from "@/app/datatypes";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/contexts/AuthContext";

// Generic data fetching hook
export function useData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFn();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          const error = err as Error;
          setError(error.message || "Failed to fetch data");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
}

// Itineraries hook
export function useItineraries() {
  const { user } = useAuth();
  
  return useData<Itinerary[]>(
    () => api.itinerary.getByUserId(user?.id || ""),
    [user?.id]
  );
}

// Single itinerary hook
export function useItinerary(id: string) {
  return useData<Itinerary>(
    () => api.itinerary.getById(id),
    [id]
  );
}

// Destinations hook
export function useDestinations(filters?: {
  city?: string;
  category?: string;
  featured?: boolean;
}) {
  return useData<Destination[]>(
    () => api.destination.getAll(filters),
    [filters?.city, filters?.category, filters?.featured]
  );
}

// Featured destinations hook
export function useFeaturedDestinations() {
  return useData<Destination[]>(
    () => api.destination.getFeatured(),
    []
  );
}

// Single destination hook
export function useDestination(id: string) {
  return useData<Destination>(
    () => api.destination.getById(id),
    [id]
  );
}

// Weather hook
export function useWeather(city?: string) {
  return useData<Weather | Weather[] | null>(
    () => city ? api.weather.getByCity(city) : api.weather.getAll(),
    [city]
  );
}

// Wallet hook
export function useWallet() {
  const { user } = useAuth();
  
  return useData<Wallet | null>(
    () => api.wallet.getByUserId(user?.id || ""),
    [user?.id]
  );
}

// Transactions hook
export function useTransactions() {
  const { user } = useAuth();
  
  return useData<Transaction[]>(
    () => api.transaction.getByUserId(user?.id || ""),
    [user?.id]
  );
}

// Notifications hook
export function useNotifications() {
  const { user } = useAuth();
  
  return useData<Notification[]>(
    () => api.notification.getByUserId(user?.id || ""),
    [user?.id]
  );
}

// Unread notifications count
export function useUnreadNotifications() {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.read).length || 0;
}

// Recommendations hook
export function useRecommendations() {
  const { user } = useAuth();
  
  return useData<Recommendation[]>(
    () => api.recommendation.getByUserId(user?.id || ""),
    [user?.id]
  );
}

// Categories hook
export function useCategories() {
  return useData(
    () => api.category.getAll(),
    []
  );
}

// Search destinations hook
export function useSearchDestinations(query: string) {
  const [results, setResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchDestinations = async () => {
      try {
        setIsSearching(true);
        const data = await api.destination.search(query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchDestinations, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { results, isSearching };
}

// Upcoming trips hook
export function useUpcomingTrips() {
  const { data: itineraries, ...rest } = useItineraries();
  
  const upcomingTrips = itineraries?.filter(
    (trip) => trip.status === "upcoming"
  ) || [];

  return { data: upcomingTrips, ...rest };
}

// Dashboard stats hook
export function useDashboardStats() {
  const { data: itineraries } = useItineraries();
  const { data: transactions } = useTransactions();
  
  const stats = {
    upcomingTrips: itineraries?.filter(t => t.status === "upcoming").length || 0,
    completedTrips: itineraries?.filter(t => t.status === "completed").length || 0,
    totalSpent: transactions
      ?.filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    savedDestinations: 0, // This would need to be implemented in backend
  };

  return stats;
}

export default {
  useData,
  useItineraries,
  useItinerary,
  useDestinations,
  useFeaturedDestinations,
  useDestination,
  useWeather,
  useWallet,
  useTransactions,
  useNotifications,
  useUnreadNotifications,
  useRecommendations,
  useCategories,
  useSearchDestinations,
  useUpcomingTrips,
  useDashboardStats,
};
