// Enhanced Smart Itinerary Context with proper state persistence and notifications
// Fixed data flow and integrated notification system

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { transportationAPI } from "@/lib/transportation-api";

export type AccommodationType = "budget" | "moderate" | "luxury";

export interface Preference {
  budget: number;
  days: number;
  travelers: number;
  interests: string[];
  themes: string[];
  preferredSpots: string[];
  cities: string[];
  startDate: string;
  notes: string;
  accommodationType: AccommodationType;
}

export interface Destination {
  id: string;
  name: string;
  time: string;
  duration: string;
  coordinates?: { lat: number; lng: number };
  location?: string;
  category?: string;
  estimatedCost?: number;
}

export interface ItineraryItem {
  id: string;
  day: number;
  date: string;
  destinations: Destination[];
  accommodation?: {
    name: string;
    type: string;
    cost: number;
  };
  transportation?: {
    type: string;
    cost: number;
    route?: string;
  };
}

export interface BudgetBreakdown {
  accommodation: number;
  transportation: number;
  food: number;
  activities: number;
  miscellaneous: number;
  total: number;
}

interface SmartItineraryContextValue {
  preferences: Preference;
  itinerary: ItineraryItem[];
  budgetBreakdown: BudgetBreakdown | null;
  loading: boolean;
  generating: boolean;
  updatePreferences: (changes: Partial<Preference>) => void;
  toggleTheme: (theme: string) => void;
  togglePreferredSpot: (spot: string) => void;
  toggleCity: (city: string) => void;
  generateItinerary: () => Promise<void>;
  calculateBudget: () => Promise<void>;
  resetItinerary: () => void;
  setItinerary: (itinerary: ItineraryItem[]) => void;
}

const SmartItineraryContext = createContext<SmartItineraryContextValue | null>(null);

const defaultPreferences: Preference = {
  budget: 0,
  days: 3,
  travelers: 2,
  interests: [],
  themes: [],
  preferredSpots: [],
  cities: [],
  startDate: "",
  notes: "",
  accommodationType: "moderate",
};

// Load preferences from localStorage
const loadPreferences = (): Preference => {
  try {
    const saved = localStorage.getItem('jatour-preferences');
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
  return defaultPreferences;
};

// Save preferences to localStorage
const savePreferences = (preferences: Preference) => {
  try {
    localStorage.setItem('jatour-preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
};

// Load itinerary from localStorage
const loadItinerary = (): ItineraryItem[] => {
  try {
    const saved = localStorage.getItem('jatour-itinerary');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load itinerary:', error);
  }
  return [];
};

// Save itinerary to localStorage
const saveItinerary = (itinerary: ItineraryItem[]) => {
  try {
    localStorage.setItem('jatour-itinerary', JSON.stringify(itinerary));
  } catch (error) {
    console.error('Failed to save itinerary:', error);
  }
};

// Show notification using global function
const showNotification = (notification: {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}) => {
  if (typeof window !== 'undefined') {
    // Try to use global notification function
    const globalShowNotification = (window as any).showNotification;
    if (globalShowNotification) {
      globalShowNotification(notification);
      return;
    }

    // Fallback: Dispatch custom event
    const event = new CustomEvent('jatour-notification', { detail: notification });
    window.dispatchEvent(event);
  }
};

export function SmartItineraryProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<Preference>(loadPreferences());
  const [itinerary, setItineraryState] = useState<ItineraryItem[]>(loadItinerary());
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Auto-save preferences when they change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Auto-save itinerary when it changes
  useEffect(() => {
    saveItinerary(itinerary);
  }, [itinerary]);

  const updatePreferences = (changes: Partial<Preference>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...changes };
      return updated;
    });
  };

  const toggleTheme = (theme: string) => {
    setPreferencesState((prev) => {
      const nextThemes = prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme];

      return {
        ...prev,
        themes: nextThemes,
        interests: nextThemes,
      };
    });
  };

  const togglePreferredSpot = (spot: string) => {
    setPreferencesState((prev) => ({
      ...prev,
      preferredSpots: prev.preferredSpots.includes(spot)
        ? prev.preferredSpots.filter((s) => s !== spot)
        : [...prev.preferredSpots, spot],
    }));
  };

  const toggleCity = (city: string) => {
    setPreferencesState((prev) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city],
    }));
  };

  const generateItinerary = async () => {
    setGenerating(true);
    setBudgetBreakdown(null);
    
    try {
      // Create rich mock destinations for testing
      const mockDestinations = [
        { 
          id: '1', 
          name: 'Borobudur Temple', 
          category: 'heritage', 
          city: 'Yogyakarta',
          estimatedCost: 75000,
          coordinates: { lat: -7.6079, lng: 110.2038 }
        },
        { 
          id: '2', 
          name: 'Ubud Rice Terraces', 
          category: 'nature', 
          city: 'Bali',
          estimatedCost: 50000,
          coordinates: { lat: -8.5069, lng: 115.2625 }
        },
        { 
          id: '3', 
          name: 'Mount Bromo', 
          category: 'mountain', 
          city: 'East Java',
          estimatedCost: 100000,
          coordinates: { lat: -7.9424, lng: 112.9466 }
        },
        { 
          id: '4', 
          name: 'Prambanan Temple', 
          category: 'heritage', 
          city: 'Yogyakarta',
          estimatedCost: 65000,
          coordinates: { lat: -7.7520, lng: 110.4898 }
        },
        { 
          id: '5', 
          name: 'Kuta Beach', 
          category: 'beach', 
          city: 'Bali',
          estimatedCost: 0,
          coordinates: { lat: -8.7222, lng: 115.1692 }
        },
        { 
          id: '6', 
          name: 'Bali Zoo', 
          category: 'family', 
          city: 'Bali',
          estimatedCost: 150000,
          coordinates: { lat: -8.5569, lng: 115.2939 }
        }
      ];

      // Filter destinations based on preferences
      let filteredDestinations = mockDestinations;
      
      // Filter by cities
      if (preferences.cities.length > 0) {
        filteredDestinations = filteredDestinations.filter(dest => 
          preferences.cities.some(city => 
            dest.city.toLowerCase().includes(city.toLowerCase()) ||
            city.toLowerCase().includes(dest.city.toLowerCase())
          )
        );
      }

      // Filter by themes
      if (preferences.themes.length > 0) {
        filteredDestinations = filteredDestinations.filter(dest =>
          preferences.themes.some(theme => 
            dest.category.toLowerCase().includes(theme.toLowerCase())
          )
        );
      }

      // If no filtered results, use all mock data
      if (filteredDestinations.length === 0) {
        filteredDestinations = mockDestinations;
      }

      const sourceList = filteredDestinations;
      const perDay = Math.max(1, Math.ceil(sourceList.length / preferences.days));

      const generated: ItineraryItem[] = [];

      for (let day = 1; day <= preferences.days; day++) {
        const date = new Date(preferences.startDate || Date.now());
        date.setDate(date.getDate() + day - 1);

        const dayDestinations = sourceList
          .slice((day - 1) * perDay, day * perDay)
          .map((dest: any, index: number) => ({
            id: dest.id ?? `dest-${day}-${index}`,
            name: dest.name ?? `Destination ${day}-${index + 1}`,
            time: index === 0 ? "09:00" : `${9 + index * 2}:00`,
            duration: "2 hours",
            coordinates: dest.coordinates || { lat: -7.2575, lng: 112.7521 },
            location: dest.city || preferences.cities[day - 1] || preferences.cities[0] || "Unknown",
            category: dest.category || 'general',
            estimatedCost: dest.estimatedCost || 100000,
          }));

        // Transportation between cities
        let transportation;
        if (preferences.cities.length > 1 && day > 1) {
          const fromCity = preferences.cities[day - 2] || preferences.cities[0];
          const toCity = preferences.cities[day - 1] || preferences.cities[0];
          try {
            const routes = await transportationAPI.getAllRoutes(fromCity, toCity);
            if (routes.length > 0) {
              transportation = {
                type: routes[0].type,
                cost: routes[0].price,
                route: `${routes[0].from.name} → ${routes[0].to.name}`,
              };
            }
          } catch (transportError) {
            console.log('Using default transportation for', fromCity, 'to', toCity);
            transportation = {
              type: 'Private car',
              cost: 500000,
              route: `${fromCity} → ${toCity}`,
            };
          }
        }

        generated.push({
          id: `day-${day}`,
          day,
          date: date.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          destinations: dayDestinations.length ? dayDestinations : [
            {
              id: `fallback-${day}`,
              name: `Destination ${day}`,
              time: "09:00",
              duration: "2 hours",
              coordinates: { lat: -7.2575, lng: 112.7521 },
              location: preferences.cities[day - 1] || preferences.cities[0] || "Unknown",
              category: 'general',
              estimatedCost: 100000,
            },
          ],
          accommodation: {
            name: `${preferences.cities[day - 1] || preferences.cities[0] || "City"} Hotel`,
            type: preferences.accommodationType,
            cost:
              preferences.accommodationType === "budget"
                ? 200000
                : preferences.accommodationType === "moderate"
                ? 500000
                : 1000000,
          },
          transportation,
        });
      }

      setItineraryState(generated);

      // Show success notification
      showNotification({
        title: '🎉 Itinerary Generated Successfully!',
        message: `Your ${preferences.days}-day itinerary to ${preferences.cities.join(', ') || 'multiple cities'} is ready!`,
        type: 'success',
        duration: 5000
      });

    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      
      // Show error notification
      showNotification({
        title: '❌ Failed to Generate Itinerary',
        message: 'Please check your preferences and try again.',
        type: 'error',
        duration: 5000
      });

      // Create fallback itinerary
      const fallback: ItineraryItem[] = [];
      for (let day = 1; day <= preferences.days; day++) {
        const date = new Date(preferences.startDate || Date.now());
        date.setDate(date.getDate() + day - 1);
        fallback.push({
          id: `day-${day}`,
          day,
          date: date.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          destinations: [
            {
              id: `fallback-${day}`,
              name: `Sample Destination ${day}`,
              time: "09:00",
              duration: "2 hours",
              coordinates: { lat: -7.2575, lng: 112.7521 },
              location: preferences.cities[day - 1] || preferences.cities[0] || "Unknown",
              category: 'general',
              estimatedCost: 100000,
            },
          ],
          accommodation: {
            name: `${preferences.cities[day - 1] || preferences.cities[0] || "City"} Hotel`,
            type: preferences.accommodationType,
            cost:
              preferences.accommodationType === "budget"
                ? 200000
                : preferences.accommodationType === "moderate"
                ? 500000
                : 1000000,
          },
        });
      }
      setItineraryState(fallback);
    } finally {
      setGenerating(false);
    }
  };

  const calculateBudget = async () => {
    setLoading(true);
    try {
      let accommodationCost = 0;
      let transportationCost = 0;

      itinerary.forEach((day) => {
        if (day.accommodation) {
          accommodationCost += day.accommodation.cost * preferences.travelers;
        }
        if (day.transportation) {
          transportationCost += day.transportation.cost * preferences.travelers;
        }
      });

      if (accommodationCost === 0) {
        accommodationCost =
          preferences.days *
          preferences.travelers *
          (preferences.accommodationType === "budget"
            ? 200000
            : preferences.accommodationType === "moderate"
            ? 500000
            : 1000000);
      }

      if (transportationCost === 0) {
        transportationCost = preferences.days * 150000 * preferences.travelers;
      }

      const foodCost = preferences.days * 200000 * preferences.travelers;
      const activitiesCost = preferences.days * 300000 * preferences.travelers;
      const miscellaneousCost = preferences.days * 100000 * preferences.travelers;

      const breakdown = {
        accommodation: accommodationCost,
        transportation: transportationCost,
        food: foodCost,
        activities: activitiesCost,
        miscellaneous: miscellaneousCost,
        total:
          accommodationCost +
          transportationCost +
          foodCost +
          activitiesCost +
          miscellaneousCost,
      };

      setBudgetBreakdown(breakdown);

      // Show success notification
      showNotification({
        title: '💰 Budget Calculated!',
        message: `Total estimated cost: IDR ${breakdown.total.toLocaleString()}`,
        type: 'success',
        duration: 4000
      });

    } catch (error) {
      console.error("Failed to calculate budget:", error);
      
      // Show error notification
      showNotification({
        title: '❌ Budget Calculation Failed',
        message: 'Please try again.',
        type: 'error',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const resetItinerary = () => {
    setItineraryState([]);
    setBudgetBreakdown(null);
    try {
      localStorage.removeItem('jatour-itinerary');
    } catch (error) {
      console.error('Failed to clear itinerary:', error);
    }
  };

  // Expose setItinerary for direct updates
  const setItinerary = (newItinerary: ItineraryItem[]) => {
    setItineraryState(newItinerary);
  };

  const value: SmartItineraryContextValue = {
    preferences,
    itinerary,
    budgetBreakdown,
    loading,
    generating,
    updatePreferences,
    toggleTheme,
    togglePreferredSpot,
    toggleCity,
    generateItinerary,
    calculateBudget,
    resetItinerary,
    setItinerary,
  };

  return (
    <SmartItineraryContext.Provider value={value}>
      {children}
    </SmartItineraryContext.Provider>
  );
}

export function useSmartItinerary() {
  const context = useContext(SmartItineraryContext);
  if (!context) {
    throw new Error("useSmartItinerary must be used within SmartItineraryProvider");
  }
  return context;
}
