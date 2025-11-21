"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
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

export interface ItineraryItem {
  id: string;
  day: number;
  date: string;
  destinations: Array<{
    id: string;
    name: string;
    time: string;
    duration: string;
    coordinates?: { lat: number; lng: number };
  }>;
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

export function SmartItineraryProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preference>(defaultPreferences);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const updatePreferences = (changes: Partial<Preference>) => {
    setPreferences((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  const toggleTheme = (theme: string) => {
    setPreferences((prev) => {
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
    setPreferences((prev) => ({
      ...prev,
      preferredSpots: prev.preferredSpots.includes(spot)
        ? prev.preferredSpots.filter((s) => s !== spot)
        : [...prev.preferredSpots, spot],
    }));
  };

  const toggleCity = (city: string) => {
    setPreferences((prev) => ({
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
      const recommendations = await apiClient.getRecommendations("user-id", {
        budget: preferences.budget,
        days: preferences.days,
        interests: preferences.interests,
        city: preferences.cities[0] || undefined,
        themes: preferences.themes,
        spots: preferences.preferredSpots,
      });

      const destinationIds = recommendations
        .slice(0, preferences.days * 3)
        .map((d: any) => d.id);

      const route = await apiClient.calculateRoute(destinationIds);
      const generated: ItineraryItem[] = [];
      const sourceList = route.length > 0 ? route : recommendations;
      const perDay = Math.max(1, Math.ceil(sourceList.length / preferences.days));

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
          }));

        let transportation;
        if (preferences.cities.length > 1 && day > 1) {
          const fromCity = preferences.cities[day - 2] || preferences.cities[0];
          const toCity = preferences.cities[day - 1] || preferences.cities[0];
          const routes = await transportationAPI.getAllRoutes(fromCity, toCity);
          if (routes.length > 0) {
            transportation = {
              type: routes[0].type,
              cost: routes[0].price,
              route: `${routes[0].from.name} → ${routes[0].to.name}`,
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

      setItinerary(generated);
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
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
              name: `Destination ${day}`,
              time: "09:00",
              duration: "2 hours",
              coordinates: { lat: -7.2575, lng: 112.7521 },
            },
          ],
        });
      }
      setItinerary(fallback);
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

      setBudgetBreakdown({
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
      });
    } catch (error) {
      console.error("Failed to calculate budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetItinerary = () => {
    setItinerary([]);
    setBudgetBreakdown(null);
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

