"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api-client";
import { transportationAPI } from "@/lib/transportation-api";
import { smartItineraryEngine } from "@/lib/ml/smart-itinerary-engine";
import { itineraryGenerator, ItineraryGenerator, ItineraryGeneratorConfig, GeneratorInput, GeneratorOutput } from "@/lib/itinerary-generator";
import { itineraryManagementEngine } from "@/lib/ml/itinerary-management-engine";

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
  rating?: number;
  bestTimeToVisit?: string;
  openingHours?: string;
  tags?: string[];
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

export interface SavedItinerary {
  id: string;
  title: string;
  cities: string[];
  days: number;
  budget: number;
  status: "active" | "planned" | "completed";
  preferences: {
    theme: string;
    style: string;
  };
  createdAt: string;
  daysPlan: {
    day: number;
    title: string;
    activities: {
      name: string;
      duration: string;
      cost: number;
      type: string;
    }[];
  }[];
  originalItinerary: ItineraryItem[];
}

interface SmartItineraryContextValue {
  preferences: Preference;
  itinerary: ItineraryItem[];
  savedItineraries: SavedItinerary[];
  budgetBreakdown: BudgetBreakdown | null;
  loading: boolean;
  generating: boolean;
  // Generator integration
  generator: ItineraryGenerator;
  generatorConfig: ItineraryGeneratorConfig;
  lastGeneratorOutput: GeneratorOutput | null;
  updateGeneratorConfig: (config: Partial<ItineraryGeneratorConfig>) => void;
  generateItineraryWithGenerator: (input?: Partial<GeneratorInput>) => Promise<GeneratorOutput | null>;
  getGeneratorItinerary: (itineraryId: string) => Promise<GeneratorOutput | null>;
  listGeneratorItineraries: () => Promise<string[]>;
  resetGeneratorOutput: () => void;
  getGeneratorHealthStatus: () => Promise<any>;
  // Legacy methods
  updatePreferences: (changes: Partial<Preference>) => void;
  toggleTheme: (theme: string) => void;
  togglePreferredSpot: (spot: string) => void;
  toggleCity: (city: string) => void;
  generateItinerary: () => Promise<void>;
  calculateBudget: () => Promise<void>;
  resetItinerary: () => void;
  setItinerary: (itinerary: ItineraryItem[]) => void;
  saveCurrentItinerary: (title: string) => Promise<void>;
  deleteSavedItinerary: (id: string) => void;
  updateSavedItineraryStatus: (id: string, status: "active" | "planned" | "completed") => void;
  forceReloadFromLocalStorage: () => void;
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

// Browser environment check
const isBrowser = typeof window !== 'undefined';

// LocalStorage helper functions
const localStorageHelpers = {
  get: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  },

  set: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
    }
  },

  remove: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }
};

// Data loading functions
const loadPreferences = (): Preference => {
  const saved = localStorageHelpers.get('jatour-preferences');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultPreferences, ...parsed };
    } catch (error) {
      console.error('Failed to parse preferences from localStorage:', error);
    }
  }
  return defaultPreferences;
};

const loadItinerary = (): ItineraryItem[] => {
  const saved = localStorageHelpers.get('jatour-itinerary');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to parse itinerary from localStorage:', error);
    }
  }
  return [];
};

const loadSavedItineraries = async (): Promise<SavedItinerary[]> => {
  const saved = localStorageHelpers.get('jatour-saved-itineraries');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to parse saved itineraries from localStorage:', error);
    }
  }

  // Fallback to API if available
  try {
    const token = localStorageHelpers.get('jatour_token');
    if (token) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/itineraries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const apiItineraries = await response.json();
        const convertedItineraries = apiItineraries.map((apiItin: any) => ({
          id: apiItin.id,
          title: apiItin.title || `Trip to ${apiItin.cities?.join(', ') || 'Multiple Cities'}`,
          cities: apiItin.cities || [],
          days: apiItin.days || 0,
          budget: apiItin.budget || 0,
          status: apiItin.status || 'planned',
          preferences: {
            theme: apiItin.theme || 'Mixed',
            style: apiItin.accommodationType || 'moderate'
          },
          createdAt: apiItin.createdAt || new Date().toISOString(),
          daysPlan: apiItin.daysPlan || [],
          originalItinerary: apiItin.originalItinerary || []
        }));

        localStorageHelpers.set('jatour-saved-itineraries', JSON.stringify(convertedItineraries));
        return convertedItineraries;
      }
    }
  } catch (error) {
    console.error('Failed to fetch itineraries from API:', error);
  }

  return [];
};

// Notification helper
const showNotification = (notification: {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}) => {
  if (!isBrowser) return;

  try {
    const globalShowNotification = (window as any).showNotification;
    if (globalShowNotification && typeof globalShowNotification === 'function') {
      globalShowNotification(notification);
      return;
    }

    const event = new CustomEvent('jatour-notification', { detail: notification });
    window.dispatchEvent(event);
  } catch (error) {
    console.warn('Notification system error:', error);
  }
};

// Basic itinerary fallback
const createBasicItinerary = (preferences: Preference): ItineraryItem[] => {
  const basicDestinations = [
    { name: 'Borobudur Temple', city: 'Yogyakarta', category: 'heritage', cost: 75000 },
    { name: 'Ubud Rice Terraces', city: 'Bali', category: 'nature', cost: 50000 },
    { name: 'Mount Bromo', city: 'East Java', category: 'adventure', cost: 100000 }
  ];

  return Array.from({ length: preferences.days }, (_, index) => {
    const day = index + 1;
    const date = new Date(preferences.startDate || Date.now());
    date.setDate(date.getDate() + day - 1);

    return {
      id: `day-${day}`,
      day,
      date: date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      destinations: basicDestinations.slice(0, 2).map((dest, destIndex) => ({
        id: `basic-${day}-${destIndex}`,
        name: dest.name,
        time: destIndex === 0 ? "09:00" : "14:00",
        duration: "3 hours",
        coordinates: { lat: -7.2575, lng: 112.7521 },
        location: dest.city,
        category: dest.category,
        estimatedCost: dest.cost,
      })),
      accommodation: {
        name: `${preferences.cities[day - 1] || preferences.cities[0] || "City"} Hotel`,
        type: preferences.accommodationType,
        cost: preferences.accommodationType === "budget" ? 200000 :
              preferences.accommodationType === "moderate" ? 500000 : 1000000,
      }
    };
  });
};

export function SmartItineraryProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<Preference>(defaultPreferences);
  const [itinerary, setItineraryState] = useState<ItineraryItem[]>([]);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hasInitialGeneration, setHasInitialGeneration] = useState(false);

  // Generator integration state
  const [generatorConfig, setGeneratorConfig] = useState<ItineraryGeneratorConfig>(itineraryGenerator.getConfig());
  const [lastGeneratorOutput, setLastGeneratorOutput] = useState<GeneratorOutput | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      // Clear all saved itineraries from localStorage at application start
      localStorageHelpers.remove('jatour-saved-itineraries');

      setPreferencesState(loadPreferences());
      setItineraryState(loadItinerary());
      const saved = await loadSavedItineraries();
      setSavedItineraries(saved);

      // Check if there's already an itinerary to determine if initial generation has happened
      const existingItinerary = loadItinerary();
      setHasInitialGeneration(existingItinerary.length > 0);
    };

    loadData();
  }, []);

  // Auto-save preferences
  useEffect(() => {
    localStorageHelpers.set('jatour-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Auto-save itinerary
  useEffect(() => {
    localStorageHelpers.set('jatour-itinerary', JSON.stringify(itinerary));
  }, [itinerary]);

  // Auto-save saved itineraries
  useEffect(() => {
    localStorageHelpers.set('jatour-saved-itineraries', JSON.stringify(savedItineraries));
  }, [savedItineraries]);

  // Cross-tab synchronization with storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jatour-preferences') {
        try {
          const newPreferences = JSON.parse(e.newValue || '{}');
          setPreferencesState(prev => ({ ...prev, ...newPreferences }));
          console.log('🔄 Preferences synced across tabs:', newPreferences);
        } catch (error) {
          console.error('Failed to sync preferences across tabs:', error);
        }
      } else if (e.key === 'jatour-itinerary') {
        try {
          const newItinerary = JSON.parse(e.newValue || '[]');
          setItineraryState(newItinerary);
          console.log('🔄 Itinerary synced across tabs:', newItinerary.length, 'days');
        } catch (error) {
          console.error('Failed to sync itinerary across tabs:', error);
        }
      } else if (e.key === 'jatour-saved-itineraries') {
        try {
          const newSavedItineraries = JSON.parse(e.newValue || '[]');
          setSavedItineraries(newSavedItineraries);
          console.log('🔄 Saved itineraries synced across tabs:', newSavedItineraries.length, 'trips');
        } catch (error) {
          console.error('Failed to sync saved itineraries across tabs:', error);
        }
      }
    };

    if (isBrowser) {
      window.addEventListener('storage', handleStorageChange);
      console.log('📡 Cross-tab synchronization enabled');
    }

    return () => {
      if (isBrowser) {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  const updatePreferences = useCallback(async (changes: Partial<Preference>) => {
    setPreferencesState(prev => {
      // Validate changes before applying
      const validationErrors: string[] = [];

      // Validate budget
      if (changes.budget !== undefined) {
        const budget = Number(changes.budget);
        if (isNaN(budget) || budget <= 0) {
          validationErrors.push('Budget must be a positive number');
        } else if (budget > 100000000) { // 100 million IDR limit
          validationErrors.push('Budget cannot exceed 100 million IDR');
        }
      }

      // Validate days
      if (changes.days !== undefined) {
        const days = Number(changes.days);
        if (isNaN(days) || days < 1 || days > 30) {
          validationErrors.push('Number of days must be between 1 and 30');
        }
      }

      // Validate travelers
      if (changes.travelers !== undefined) {
        const travelers = Number(changes.travelers);
        if (isNaN(travelers) || travelers < 1 || travelers > 20) {
          validationErrors.push('Number of travelers must be between 1 and 20');
        }
      }

      // Validate start date
      if (changes.startDate) {
        const startDate = new Date(changes.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(startDate.getTime())) {
          validationErrors.push('Invalid date format');
        } else if (startDate < today) {
          validationErrors.push('Start date cannot be in the past');
        }
      }

      // Validate cities array
      if (changes.cities !== undefined) {
        if (!Array.isArray(changes.cities)) {
          validationErrors.push('Cities must be an array');
        } else if (changes.cities.length > 10) {
          validationErrors.push('Cannot select more than 10 cities');
        }
      }

      // Validate themes array
      if (changes.themes !== undefined) {
        if (!Array.isArray(changes.themes)) {
          validationErrors.push('Themes must be an array');
        } else if (changes.themes.length > 5) {
          validationErrors.push('Cannot select more than 5 themes');
        }
      }

      // Validate preferred spots array
      if (changes.preferredSpots !== undefined) {
        if (!Array.isArray(changes.preferredSpots)) {
          validationErrors.push('Preferred spots must be an array');
        } else if (changes.preferredSpots.length > 20) {
          validationErrors.push('Cannot select more than 20 preferred spots');
        }
      }

      // If there are validation errors, show notification and don't update
      if (validationErrors.length > 0) {
        showNotification({
          title: 'Invalid Preferences',
          message: validationErrors.join('. '),
          type: 'error',
          duration: 6000
        });
        return prev;
      }

      // Apply validated changes
      const updated = { ...prev, ...changes };

      // Show success notification for major changes
      if (changes.budget || changes.days || changes.travelers || changes.startDate) {
        showNotification({
          title: 'Preferences Updated',
          message: 'Your travel preferences have been updated successfully',
          type: 'success',
          duration: 3000
        });
      }

      return updated;
    });

    // Regenerate itinerary if preferences change after initial generation
    if (hasInitialGeneration && (changes.days || changes.travelers || changes.cities || changes.themes || changes.interests || changes.preferredSpots || changes.accommodationType)) {
      console.log('🔄 Preferences changed after initial generation, regenerating itinerary...');
      setTimeout(() => {
        generateItinerary();
      }, 100); // Small delay to ensure state updates
    }
  }, [hasInitialGeneration]);

  const toggleTheme = useCallback((theme: string) => {
    setPreferencesState(prev => {
      const nextThemes = prev.themes.includes(theme)
        ? prev.themes.filter(t => t !== theme)
        : [...prev.themes, theme];

      return {
        ...prev,
        themes: nextThemes,
        interests: nextThemes,
      };
    });
  }, []);

  const togglePreferredSpot = useCallback((spot: string) => {
    setPreferencesState(prev => ({
      ...prev,
      preferredSpots: prev.preferredSpots.includes(spot)
        ? prev.preferredSpots.filter(s => s !== spot)
        : [...prev.preferredSpots, spot],
    }));
  }, []);

  const toggleCity = useCallback((city: string) => {
    setPreferencesState(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city],
    }));
  }, []);

  const generateItinerary = useCallback(async () => {
    if (!preferences.days || !preferences.travelers || preferences.days === 0) {
      showNotification({
        title: 'Invalid Preferences',
        message: 'Please complete duration, travelers, and preferences.',
        type: 'error'
      });
      return;
    }

    setGenerating(true);
    setBudgetBreakdown(null);

    try {
      // Try to use the new generator with management engine integration first
      const generatorResult = await generateItineraryWithGenerator();
      if (generatorResult) {
        // Successfully used new generator, no need to continue with legacy method
        return;
      }

      // Fallback to legacy ML engine if generator fails
      const enhancedDestinations = [
        {
          id: 'borobudur',
          name: 'Borobudur Temple',
          location: 'Magelang, Central Java',
          category: 'heritage',
          estimatedCost: 75000,
          duration: 180,
          coordinates: { lat: -7.6079, lng: 110.2038 },
          tags: ['temple', 'buddhist', 'unesco', 'historical'],
          rating: 4.8,
          openingHours: '06:00 - 17:00',
          bestTimeToVisit: 'Weekday morning'
        },
        {
          id: 'ubud-terrace',
          name: 'Ubud Rice Terraces',
          location: 'Ubud, Bali',
          category: 'nature',
          estimatedCost: 0,
          duration: 120,
          coordinates: { lat: -8.5069, lng: 115.2625 },
          tags: ['nature', 'photography', 'scenic', 'relaxing'],
          rating: 4.6,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'Early morning'
        },
        {
          id: 'mount-bromo',
          name: 'Mount Bromo',
          location: 'East Java',
          category: 'adventure',
          estimatedCost: 150000,
          duration: 360,
          coordinates: { lat: -7.9424, lng: 112.9466 },
          tags: ['mountain', 'sunrise', 'hiking', 'volcano'],
          rating: 4.9,
          openingHours: '24 hours',
          bestTimeToVisit: 'Pre-dawn for sunrise'
        },
        {
          id: 'prambanan',
          name: 'Prambanan Temple',
          location: 'Yogyakarta',
          category: 'heritage',
          estimatedCost: 50000,
          duration: 150,
          coordinates: { lat: -7.7520, lng: 110.4898 },
          tags: ['temple', 'hindu', 'architectural', 'historical'],
          rating: 4.7,
          openingHours: '07:00 - 17:30',
          bestTimeToVisit: 'Weekday afternoon'
        },
        {
          id: 'kuta-beach',
          name: 'Kuta Beach',
          location: 'Kuta, Bali',
          category: 'beach',
          estimatedCost: 0,
          duration: 180,
          coordinates: { lat: -8.7222, lng: 115.1692 },
          tags: ['beach', 'surfing', 'sunset', 'relaxing'],
          rating: 4.2,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'Late afternoon for sunset'
        },
        {
          id: 'bali-zoo',
          name: 'Bali Zoo',
          location: 'Singapadu, Bali',
          category: 'family',
          estimatedCost: 180000,
          duration: 240,
          coordinates: { lat: -8.5569, lng: 115.2939 },
          tags: ['zoo', 'family', 'wildlife', 'educational'],
          rating: 4.3,
          openingHours: '09:00 - 17:00',
          bestTimeToVisit: 'Weekday morning'
        },
        {
          id: 'tirta-empul',
          name: 'Tirta Empul Temple',
          location: 'Tampaksiring, Bali',
          category: 'cultural',
          estimatedCost: 50000,
          duration: 120,
          coordinates: { lat: -8.5141, lng: 115.2822 },
          tags: ['temple', 'holy-water', 'cultural', 'ritual'],
          rating: 4.5,
          openingHours: '08:00 - 18:00',
          bestTimeToVisit: 'Early morning'
        },
        {
          id: 'merapi-museum',
          name: 'Merapi Volcano Museum',
          location: 'Yogyakarta',
          category: 'educational',
          estimatedCost: 30000,
          duration: 90,
          coordinates: { lat: -7.6123, lng: 110.4309 },
          tags: ['museum', 'volcano', 'educational', 'interactive'],
          rating: 4.4,
          openingHours: '08:00 - 16:00',
          bestTimeToVisit: 'Weekday morning'
        },
        {
          id: 'raja-ampat',
          name: 'Raja Ampat Islands',
          location: 'West Papua',
          category: 'nature',
          estimatedCost: 500000,
          duration: 480,
          coordinates: { lat: -0.4000, lng: 130.5000 },
          tags: ['islands', 'diving', 'marine-life', 'paradise'],
          rating: 4.9,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'May to September'
        },
        {
          id: 'tanjung-lesung',
          name: 'Tanjung Lesung Beach',
          location: 'Banten',
          category: 'beach',
          estimatedCost: 25000,
          duration: 240,
          coordinates: { lat: -6.0000, lng: 105.9000 },
          tags: ['beach', 'relaxing', 'surf', 'sunset'],
          rating: 4.3,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'Weekend'
        },
        {
          id: 'dieng-plateau',
          name: 'Dieng Plateau',
          location: 'Central Java',
          category: 'nature',
          estimatedCost: 50000,
          duration: 360,
          coordinates: { lat: -7.2000, lng: 109.9000 },
          tags: ['plateau', 'volcano', 'crater', 'cool-climate'],
          rating: 4.5,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'Weekday sunrise'
        },
        {
          id: 'labuan-bajo',
          name: 'Labuan Bajo',
          location: 'Flores, East Nusa Tenggara',
          category: 'adventure',
          estimatedCost: 200000,
          duration: 300,
          coordinates: { lat: -8.4667, lng: 120.0000 },
          tags: ['harbor', 'komodo', 'islands', 'diving'],
          rating: 4.7,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'April to December'
        }
      ];

      // Filter destinations based on preferences
      const filteredDestinations = enhancedDestinations.filter(dest => {
        const cityMatch = preferences.cities.length === 0 ||
          preferences.cities.some(city =>
            dest.location.toLowerCase().includes(city.toLowerCase())
          );

        const themeMatch = preferences.themes.length === 0 ||
          preferences.themes.some(theme =>
            dest.category.toLowerCase().includes(theme.toLowerCase()) ||
            dest.tags.some(tag => theme.toLowerCase().includes(tag.toLowerCase()))
          );

        return cityMatch && themeMatch;
      });

      const mlInput = {
        userId: 'demo-user-001',
        preferences: {
          budget: preferences.budget,
          days: preferences.days,
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType,
          cities: preferences.cities,
          interests: preferences.interests,
          themes: preferences.themes,
          preferredSpots: preferences.preferredSpots,
          startDate: preferences.startDate
        },
        availableDestinations: filteredDestinations,
        constraints: {
          maxDailyTravelTime: 480,
          preferredStartTime: '08:00',
          preferredEndTime: '18:00',
          avoidCrowds: preferences.notes.toLowerCase().includes('crowd'),
          accessibilityRequired: preferences.notes.toLowerCase().includes('accessibility')
        }
      };

      try {
        const mlResult = smartItineraryEngine.createSmartItinerary(mlInput);

        const generated: ItineraryItem[] = mlResult.itinerary.map((day, index) => ({
          id: `day-${day.day}`,
          day: day.day,
          date: day.date,
          destinations: day.destinations.map(dest => ({
            id: dest.id,
            name: dest.name,
            time: dest.scheduledTime,
            duration: `${dest.duration} minutes`,
            coordinates: dest.coordinates,
            location: dest.location,
            category: dest.category,
            estimatedCost: dest.estimatedCost,
            rating: dest.rating,
            bestTimeToVisit: dest.bestTimeToVisit,
            openingHours: dest.openingHours,
            tags: dest.tags,
          })),
          accommodation: {
            name: `${preferences.cities[index % preferences.cities.length] || 'City'} Hotel`,
            type: preferences.accommodationType,
            cost: preferences.accommodationType === "budget" ? 200000 :
                  preferences.accommodationType === "moderate" ? 500000 : 1000000,
          },
          transportation: day.transportation || undefined
        }));

        setItineraryState(generated);
        setHasInitialGeneration(true);

        // Auto-save itinerary
        const autoSaveTitle = `My Trip to ${preferences.cities.join(', ') || 'Multiple Cities'} - ${new Date().toLocaleDateString('id-ID')}`;

        const autoSavedItinerary: SavedItinerary = {
          id: `auto-saved-${Date.now()}`,
          title: autoSaveTitle,
          cities: preferences.cities,
          days: preferences.days,
          budget: preferences.budget,
          status: "planned",
          preferences: {
            theme: preferences.themes.join(', ') || 'Mixed',
            style: preferences.accommodationType
          },
          createdAt: new Date().toISOString(),
          daysPlan: generated.map(day => ({
            day: day.day,
            title: `Day ${day.day} - ${day.destinations[0]?.location?.split(',')[0] || 'Destination'}`,
            activities: day.destinations.map(dest => ({
              name: dest.name,
              duration: dest.duration || '2 hours',
              cost: dest.estimatedCost || 0,
              type: dest.category || 'general'
            }))
          })),
          originalItinerary: generated
        };

        setSavedItineraries(prev => [...prev, autoSavedItinerary]);

        showNotification({
          title: 'AI-Powered Itinerary Generated!',
          message: `Your ${preferences.days}-day smart itinerary is ready! ML Confidence: ${(mlResult.mlInsights.personalizationScore * 100).toFixed(0)}%`,
          type: 'success',
          duration: 8000
        });

      } catch (mlError) {
        console.error("ML generation failed:", mlError);

        showNotification({
          title: 'ML Generation Failed',
          message: 'Falling back to standard itinerary generation.',
          type: 'warning'
        });

        const fallback = createBasicItinerary(preferences);
        setItineraryState(fallback);
      }

    } finally {
      setGenerating(false);
    }
  }, [preferences]);

  const calculateBudget = useCallback(async () => {
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
        accommodationCost = preferences.days * preferences.travelers *
          (preferences.accommodationType === "budget" ? 200000 :
           preferences.accommodationType === "moderate" ? 500000 : 1000000);
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
        total: accommodationCost + transportationCost + foodCost + activitiesCost + miscellaneousCost,
      };

      setBudgetBreakdown(breakdown);

      showNotification({
        title: 'Budget Calculated!',
        message: `Total estimated cost: IDR ${breakdown.total.toLocaleString()}`,
        type: 'success'
      });

    } catch (error) {
      console.error("Budget calculation failed:", error);

      showNotification({
        title: 'Budget Calculation Failed',
        message: 'Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [itinerary, preferences]);

  const resetItinerary = useCallback(() => {
    setItineraryState([]);
    setBudgetBreakdown(null);
    localStorageHelpers.remove('jatour-itinerary');
  }, []);

  const setItinerary = useCallback((newItinerary: ItineraryItem[]) => {
    setItineraryState(newItinerary);
  }, []);

  const saveCurrentItinerary = useCallback(async (title: string) => {
    if (itinerary.length === 0) {
      showNotification({
        title: 'No Itinerary to Save',
        message: 'Generate an itinerary first before saving.',
        type: 'warning'
      });
      return;
    }

    const newSavedItinerary: SavedItinerary = {
      id: `saved-${Date.now()}`,
      title: title.trim() || `My Trip to ${preferences.cities.join(', ') || 'Multiple Cities'}`,
      cities: preferences.cities,
      days: preferences.days,
      budget: preferences.budget,
      status: "planned",
      preferences: {
        theme: preferences.themes.join(', ') || 'Mixed',
        style: preferences.accommodationType
      },
      createdAt: new Date().toISOString(),
      daysPlan: itinerary.map(day => ({
        day: day.day,
        title: `Day ${day.day} - ${day.destinations[0]?.location || 'Destination'}`,
        activities: day.destinations.map(dest => ({
          name: dest.name,
          duration: dest.duration || '2 hours',
          cost: dest.estimatedCost || 0,
          type: dest.category || 'general'
        }))
      })),
      originalItinerary: itinerary
    };

    setSavedItineraries(prev => [...prev, newSavedItinerary]);

    showNotification({
      title: 'Itinerary Saved Successfully!',
      message: `"${newSavedItinerary.title}" has been saved to your plans.`,
      type: 'success'
    });
  }, [itinerary, preferences]);

  const deleteSavedItinerary = useCallback((id: string) => {
    const itineraryToDelete = savedItineraries.find(it => it.id === id);
    if (!itineraryToDelete) return;

    setSavedItineraries(prev => prev.filter(it => it.id !== id));

    showNotification({
      title: 'Itinerary Deleted',
      message: `"${itineraryToDelete.title}" has been removed from your plans.`,
      type: 'info'
    });
  }, [savedItineraries]);

  const updateSavedItineraryStatus = useCallback((id: string, status: "active" | "planned" | "completed") => {
    setSavedItineraries(prev =>
      prev.map(it =>
        it.id === id ? { ...it, status } : it
      )
    );

    const itinerary = savedItineraries.find(it => it.id === id);
    if (itinerary) {
      showNotification({
        title: 'Status Updated',
        message: `"${itinerary.title}" status changed to ${status}.`,
        type: 'success'
      });
    }
  }, [savedItineraries]);

  const forceReloadFromLocalStorage = useCallback(async () => {
    const prefs = loadPreferences();
    const itin = loadItinerary();
    const saved = await loadSavedItineraries();

    setPreferencesState(prefs);
    setItineraryState(itin);
    setSavedItineraries(saved);

    if (isBrowser) {
      const event = new CustomEvent('smart-itinerary-reload', {
        detail: { preferences: prefs, itinerary: itin, savedItineraries: saved, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    }
  }, []);

  // Generator integration methods
  const updateGeneratorConfig = useCallback((config: Partial<ItineraryGeneratorConfig>) => {
    setGeneratorConfig(prev => {
      const updated = { ...prev, ...config };
      itineraryGenerator.updateConfig(updated);
      return updated;
    });
  }, []);

  const generateItineraryWithGenerator = useCallback(async (inputOverrides?: Partial<GeneratorInput>): Promise<GeneratorOutput | null> => {
    setGenerating(true);

    try {
      // Get available destinations (simplified - in real implementation, this would come from a data source)
      const availableDestinations = [
        {
          id: 'borobudur',
          name: 'Borobudur Temple',
          location: 'Magelang, Central Java',
          category: 'heritage',
          estimatedCost: 75000,
          duration: 180,
          coordinates: { lat: -7.6079, lng: 110.2038 },
          tags: ['temple', 'buddhist', 'unesco', 'historical'],
          rating: 4.8,
          openingHours: '06:00 - 17:00',
          bestTimeToVisit: 'Weekday morning'
        },
        {
          id: 'ubud-terrace',
          name: 'Ubud Rice Terraces',
          location: 'Ubud, Bali',
          category: 'nature',
          estimatedCost: 0,
          duration: 120,
          coordinates: { lat: -8.5069, lng: 115.2625 },
          tags: ['nature', 'photography', 'scenic', 'relaxing'],
          rating: 4.6,
          openingHours: 'Open 24 hours',
          bestTimeToVisit: 'Early morning'
        },
        {
          id: 'mount-bromo',
          name: 'Mount Bromo',
          location: 'East Java',
          category: 'adventure',
          estimatedCost: 150000,
          duration: 360,
          coordinates: { lat: -7.9424, lng: 112.9466 },
          tags: ['mountain', 'sunrise', 'hiking', 'volcano'],
          rating: 4.9,
          openingHours: '24 hours',
          bestTimeToVisit: 'Pre-dawn for sunrise'
        }
      ];

      const generatorInput: GeneratorInput = {
        userId: 'context_user',
        sessionId: `session_${Date.now()}`,
        preferences: {
          budget: preferences.budget,
          days: preferences.days,
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType,
          cities: preferences.cities,
          interests: preferences.interests,
          themes: preferences.themes,
          preferredSpots: preferences.preferredSpots,
          startDate: preferences.startDate,
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: [],
            avoidCrowds: preferences.notes.toLowerCase().includes('crowd'),
            accessibilityRequired: preferences.notes.toLowerCase().includes('accessibility')
          }
        },
        availableDestinations,
        config: generatorConfig,
        ...inputOverrides
      };

      // Generate itinerary using the new generator
      const result = await itineraryGenerator.generateItinerary(generatorInput);

      if (result.success) {
        setLastGeneratorOutput(result);

        // Convert generator output to context format for backward compatibility
        const convertedItinerary: ItineraryItem[] = result.itinerary.days.map((day, index) => ({
          id: `day-${day.day}`,
          day: day.day,
          date: day.date,
          destinations: day.destinations.map(dest => ({
            id: dest.id,
            name: dest.name,
            time: dest.scheduledTime,
            duration: `${dest.duration} minutes`,
            coordinates: dest.coordinates,
            location: dest.location,
            category: dest.category,
            estimatedCost: dest.estimatedCost,
            rating: dest.rating,
            bestTimeToVisit: dest.bestTimeToVisit,
            openingHours: dest.openingHours,
            tags: dest.tags,
          })),
          accommodation: day.accommodation ? {
            name: day.accommodation.name,
            type: day.accommodation.type,
            cost: day.accommodation.cost
          } : undefined,
          transportation: day.transportation ? {
            type: day.transportation.type,
            cost: day.transportation.cost,
            route: day.transportation.route
          } : undefined
        }));

        setItineraryState(convertedItinerary);
        setHasInitialGeneration(true);

        // Create management engine state for persistence
        await itineraryManagementEngine.createItineraryFromGenerator(result);

        showNotification({
          title: 'AI-Powered Itinerary Generated!',
          message: `Your ${preferences.days}-day smart itinerary is ready! ML Confidence: ${(result.itinerary.mlInsights.personalizationScore * 100).toFixed(0)}%`,
          type: 'success',
          duration: 8000
        });

        return result;
      } else {
        throw new Error(result.errors?.[0]?.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Generator itinerary creation failed:', error);

      showNotification({
        title: 'Generation Failed',
        message: 'Falling back to standard itinerary generation.',
        type: 'warning'
      });

      // Fallback to existing method
      await generateItinerary();
      return null;
    } finally {
      setGenerating(false);
    }
  }, [preferences, generatorConfig]);

  const getGeneratorItinerary = useCallback(async (itineraryId: string): Promise<GeneratorOutput | null> => {
    try {
      return await itineraryGenerator.getItinerary(itineraryId);
    } catch (error) {
      console.error('Failed to get generator itinerary:', error);
      return null;
    }
  }, []);

  const listGeneratorItineraries = useCallback(async (): Promise<string[]> => {
    try {
      return await itineraryGenerator.listItineraries();
    } catch (error) {
      console.error('Failed to list generator itineraries:', error);
      return [];
    }
  }, []);

  const resetGeneratorOutput = useCallback(() => {
    setLastGeneratorOutput(null);
  }, []);

  const getGeneratorHealthStatus = useCallback(async () => {
    try {
      // Access the persistence manager's health check method through the generator
      // Since it's private, we'll create a simple health check
      const config = itineraryGenerator.getConfig();
      return {
        generatorAvailable: true,
        configValid: true,
        lastConfigUpdate: Date.now(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Failed to get generator health status:', error);
      return {
        generatorAvailable: false,
        configValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const contextValue = useMemo(() => ({
    preferences,
    itinerary,
    savedItineraries,
    budgetBreakdown,
    loading,
    generating,
    // Generator integration
    generator: itineraryGenerator,
    generatorConfig,
    lastGeneratorOutput,
    updateGeneratorConfig,
    generateItineraryWithGenerator,
    getGeneratorItinerary,
    listGeneratorItineraries,
    resetGeneratorOutput,
    getGeneratorHealthStatus,
    // Legacy methods
    updatePreferences,
    toggleTheme,
    togglePreferredSpot,
    toggleCity,
    generateItinerary,
    calculateBudget,
    resetItinerary,
    setItinerary,
    saveCurrentItinerary,
    deleteSavedItinerary,
    updateSavedItineraryStatus,
    forceReloadFromLocalStorage,
  }), [
    preferences,
    itinerary,
    savedItineraries,
    budgetBreakdown,
    loading,
    generating,
    // Generator integration
    generatorConfig,
    lastGeneratorOutput,
    updateGeneratorConfig,
    generateItineraryWithGenerator,
    getGeneratorItinerary,
    listGeneratorItineraries,
    resetGeneratorOutput,
    getGeneratorHealthStatus,
    // Legacy methods
    updatePreferences,
    toggleTheme,
    togglePreferredSpot,
    toggleCity,
    generateItinerary,
    calculateBudget,
    resetItinerary,
    setItinerary,
    saveCurrentItinerary,
    deleteSavedItinerary,
    updateSavedItineraryStatus,
    forceReloadFromLocalStorage,
  ]);

  return (
    <SmartItineraryContext.Provider value={contextValue}>
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
