"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Star,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Heart,
  Building2,
  Utensils,
  Car,
  TrendingUp,
  Target,
  Award,
  BarChart3,
  Plane,
  Hotel,
  ChefHat,
  Activity,
  Settings,
  Brain,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { budgetEngine } from "@/lib/ml/intelligent-budget-engine";
import { mlEngine } from "@/lib/ml/ml-engine";
import { itineraryManagementEngine, ItineraryState } from "@/lib/ml/itinerary-management-engine";
import { syncManager } from "@/lib/ml/sync-manager";
import { smartItineraryEngine } from "@/lib/ml/smart-itinerary-engine";
import { itineraryGenerator, ItineraryGeneratorConfig } from "@/lib/itinerary-generator";
import NavbarDash from "@/app/components/navbar-dash";

interface TripRecapData {
  // Trip Overview
  tripOverview: {
    startDate: string;
    endDate: string;
    duration: number;
    travelers: number;
    destinations: string[];
    totalDestinations: number;
  };

  // AI Personalization Insights
  mlInsights: {
    activityLover: number;
    valueSeeker: number;
    spontaneous: number;
    explorer: number;
  };

  // Budget Summary
  budgetSummary: {
    estimatedBudget: number;
    aiOptimized: number;
    savingsPotential: number;
    confidence: number;
  };

  // Smart Budget Breakdown
  budgetBreakdown: {
    accommodation: { allocated: number; recommended: number; savings: number };
    transportation: { allocated: number; recommended: number; savings: number };
    food: { allocated: number; recommended: number; savings: number };
    activities: { allocated: number; recommended: number; savings: number };
    miscellaneous: { allocated: number; recommended: number; savings: number };
  };

  // Accommodation Details
  accommodationDetails: {
    hotelName: string;
    nightlyRate: number;
    totalNights: number;
    totalCost: number;
    type: string;
  };

  // Transportation Details
  transportationDetails: {
    option: string;
    totalCost: number;
    distribution: string;
    type: string;
  };

  // Daily Itinerary Recap
  dailyItinerary: Array<{
    day: number;
    date: string;
    destinations: string[];
    activities: Array<{
      name: string;
      category: string;
      time: string;
      duration: string;
      cost: number;
      rating: number;
    }>;
    dailyCost: number;
  }>;

  // User Configurations Recap
  userConfigurations: {
    totalBudget: number;
    accommodationType: string;
    startDate: string;
    duration: number;
    travelers: number;
  };
}

export default function InsightPage() {
  const router = useRouter();
  const { preferences, itinerary, generateItinerary, generating } = useSmartItinerary();
  const [recapData, setRecapData] = useState<TripRecapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [itineraryState, setItineraryState] = useState<ItineraryState | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'conflict' | 'error'>('pending');
  const [generatingEastJava, setGeneratingEastJava] = useState(false);
  const [eastJavaItinerary, setEastJavaItinerary] = useState<any>(null);
  const [eastJavaRecapReady, setEastJavaRecapReady] = useState(false);
  const [noDestinations, setNoDestinations] = useState(false);

  // Generator configuration state
  const [generatorConfig, setGeneratorConfig] = useState({
    // Activity Density
    densityLevel: 'moderate' as 'relaxed' | 'moderate' | 'intense',
    maxActivitiesPerDay: 4,
    preferredActivityTypes: [] as string[],
    avoidOverScheduling: true,
    includeFreeTime: true,
    freeTimePercentage: 30,
    // Cost Distribution
    budgetAllocationStrategy: 'equal' as 'equal' | 'front-loaded' | 'back-loaded' | 'peak-day',
    costVariabilityTolerance: 0.2,
    emergencyFundPercentage: 10,
    currency: 'IDR'
  });

  useEffect(() => {
    console.log('🔄 Insight page itinerary effect triggered:', {
      itineraryLength: itinerary.length,
      hasPreferences: !!preferences,
      preferredSpots: preferences.preferredSpots,
      preferences: preferences
    });

    const initializeItinerary = async () => {
      // Check if user has saved destinations
      if (preferences.preferredSpots.length === 0) {
        console.log('❌ No destinations found in preferences');
        setNoDestinations(true);
        return;
      }

      setNoDestinations(false);

      try {
        // Try to load existing itinerary from engine first
        const userId = 'demo-user-001';
        const existingItineraryId = `itinerary_${userId}_${preferences.startDate || 'default'}_${preferences.days || 3}`;
        const existingState = await itineraryManagementEngine.getItinerary(existingItineraryId);

        if (existingState && existingState.itinerary) {
          console.log('✅ Found existing itinerary in engine, using it...');
          setItineraryState(existingState);
          setSyncStatus(existingState.syncStatus);
          // Use new generator for recap from engine result
          const recapData = await generateTripRecap();
          if (recapData) {
            setRecapData(recapData);
          } else {
            generateRecapDataFromEngine(existingState.itinerary);
          }
        } else if (itinerary.length === 0) {
          // If no itinerary exists, generate one using the new generator for recap
          console.log('📋 No existing itinerary found, generating recap with new generator...');
          const recapData = await generateTripRecap();
          if (recapData) {
            setRecapData(recapData);
          } else {
            await handleGenerateItineraryWithEngine();
          }
        } else {
          console.log('✅ Using existing context itinerary, generating recap with new generator...');
          const recapData = await generateTripRecap();
          if (recapData) {
            setRecapData(recapData);
          } else {
            generateRecapData();
          }
        }
      } catch (error) {
        console.error('Failed to initialize itinerary:', error);
        setEngineError(error instanceof Error ? error.message : 'Failed to initialize itinerary');
        // Fallback to new generator, then old logic
        try {
          const recapData = await generateTripRecap();
          if (recapData) {
            setRecapData(recapData);
          } else if (itinerary.length > 0) {
            generateRecapData();
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          if (itinerary.length > 0) {
            generateRecapData();
          }
        }
      }
    };

    initializeItinerary();
  }, [itinerary, preferences.startDate, preferences.days, preferences.preferredSpots]);

  // Additional effect to ensure itinerary is generated when preferences change
  useEffect(() => {
    if (preferences.days && preferences.travelers && itinerary.length === 0) {
      console.log('🎯 Preferences updated and no itinerary exists, triggering generation...');
      handleGenerateItinerary();
    }
  }, [preferences.days, preferences.travelers]);

  // Enhanced synchronization with localStorage and Smart Budget data
  useEffect(() => {
    const handleStorageChange = async () => {
      console.log('🔄 localStorage change detected, regenerating recap data');
      if (itinerary.length > 0) {
        // Small delay to ensure localStorage is fully updated
        setTimeout(async () => {
          const recapData = await generateTripRecap();
          if (recapData) {
            setRecapData(recapData);
          } else {
            generateRecapData();
          }
        }, 100);
      }
    };

    // Immediate check for Smart Budget selections on mount
    const checkBudgetSelections = async () => {
      const accommodationSelection = getAccommodationSelection();
      const transportationSelection = getTransportationSelection();

      console.log('🔍 Checking Smart Budget selections on mount:', {
        accommodation: accommodationSelection,
        transportation: transportationSelection,
        hasItinerary: itinerary.length > 0
      });

      if ((accommodationSelection || transportationSelection) && itinerary.length > 0) {
        console.log('✅ Found Smart Budget selections, regenerating recap data');
        const recapData = await generateTripRecap();
        if (recapData) {
          setRecapData(recapData);
        } else {
          generateRecapData();
        }
      }
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Check for existing selections immediately
    checkBudgetSelections();

    // Also listen for custom events from Smart Budget page
    const handleSmartBudgetUpdate = (event: CustomEvent) => {
      console.log('🎯 Smart Budget update event received:', event.detail);
      if (itinerary.length > 0) {
        generateTripRecap().then(recapData => {
          if (recapData) {
            setRecapData(recapData);
          } else {
            generateRecapData();
          }
        }).catch(error => {
          console.error('Failed to regenerate recap on smart budget update:', error);
          generateRecapData(); // Fallback
        });
      }
    };

    // Add custom event listener
    window.addEventListener('smart-budget-update', handleSmartBudgetUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('smart-budget-update', handleSmartBudgetUpdate as EventListener);
    };
  }, [itinerary]);

  // Force refresh data when preferences change
  useEffect(() => {
    if (itinerary.length > 0) {
      console.log('🔄 Preferences changed, regenerating recap data');
      generateTripRecap().then(recapData => {
        if (recapData) {
          setRecapData(recapData);
        } else {
          generateRecapData();
        }
      }).catch(error => {
        console.error('Failed to regenerate recap on preferences change:', error);
        generateRecapData(); // Fallback
      });
    }
  }, [preferences]);

  // SyncManager event listeners for cross-tab synchronization
  useEffect(() => {
    const handleItinerarySyncUpdate = (event: CustomEvent) => {
      console.log('🔄 Itinerary sync update received:', event.detail);
      if (event.detail.itineraryId) {
        loadItineraryFromEngine(event.detail.itineraryId);
      }
    };

    const handleSmartBudgetUpdate = (event: CustomEvent) => {
      console.log('🎯 Smart Budget update via sync:', event.detail);
      if (itineraryState?.id) {
        updateItineraryWithBudgetChange();
      }
    };

    window.addEventListener('itinerary-sync-update', handleItinerarySyncUpdate as EventListener);
    window.addEventListener('smart-budget-update', handleSmartBudgetUpdate as EventListener);

    return () => {
      window.removeEventListener('itinerary-sync-update', handleItinerarySyncUpdate as EventListener);
      window.removeEventListener('smart-budget-update', handleSmartBudgetUpdate as EventListener);
    };
  }, [itineraryState]);

  const handleGenerateItinerary = async () => {
    if (!preferences.startDate || !preferences.days || !preferences.travelers) {
      alert("Mohon lengkapi tanggal, durasi, dan jumlah traveler terlebih dahulu");
      return;
    }

    console.log('🔄 Manual itinerary generation triggered with preferences:', {
      days: preferences.days,
      travelers: preferences.travelers,
      budget: preferences.budget,
      cities: preferences.cities
    });

    setLoading(true);
    try {
      await generateItinerary();

      // Force reload after generation to ensure data is fresh
      setTimeout(async () => {
        console.log('🔄 Forcing reload after generation...');
        const recapData = await generateTripRecap();
        if (recapData) {
          setRecapData(recapData);
        } else {
          generateRecapData();
        }
      }, 500);

    } catch (error) {
      console.error('Gagal membuat itinerary:', error);
      alert("Gagal membuat itinerary. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Force regeneration function
  const handleForceRegenerate = () => {
    console.log('🔄 Force regeneration triggered');
    console.log('🎯 Current preferences:', {
      days: preferences.days,
      travelers: preferences.travelers,
      budget: preferences.budget,
      cities: preferences.cities,
      accommodationType: preferences.accommodationType
    });
    console.log('📊 Current itinerary:', itinerary);
    
    // Clear existing itinerary first
    const context = useSmartItinerary();
    context.resetItinerary();
    
    // Then generate new one
    setTimeout(() => {
      handleGenerateItinerary();
    }, 100);
  };

  // Helper functions to get selections from localStorage
  const getAccommodationSelection = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem('smart-budget-accommodation');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load accommodation selection:', error);
      return null;
    }
  };

  const getTransportationSelection = () => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem('smart-budget-transportation');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load transportation selection:', error);
      return null;
    }
  };

  // Load itinerary from ItineraryManagementEngine
  const loadItineraryFromEngine = async (itineraryId: string) => {
    try {
      setLoading(true);
      setEngineError(null);
      const state = await itineraryManagementEngine.getItinerary(itineraryId);
      if (state) {
        setItineraryState(state);
        setSyncStatus(state.syncStatus);
        if (state.itinerary) {
          // Use new generator for recap
          const recapData = await generateTripRecap();
          if (recapData) {
            setRecapData(recapData);
          } else {
            generateRecapDataFromEngine(state.itinerary);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load itinerary from engine:', error);
      setEngineError(error instanceof Error ? error.message : 'Failed to load itinerary');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Update itinerary with budget changes
  const updateItineraryWithBudgetChange = async () => {
    if (!itineraryState?.id) return;

    try {
      setLoading(true);
      setEngineError(null);

      const accommodationSelection = getAccommodationSelection();
      const transportationSelection = getTransportationSelection();

      let budgetUpdate = {};
      if (accommodationSelection?.hotel) {
        budgetUpdate = { ...budgetUpdate, accommodation: accommodationSelection.hotel };
      }
      if (transportationSelection?.transportation) {
        budgetUpdate = { ...budgetUpdate, transportation: transportationSelection.transportation };
      }

      if (Object.keys(budgetUpdate).length > 0) {
        const updatedState = await itineraryManagementEngine.updateItinerary(
          itineraryState.id,
          {
            type: 'budget_change',
            data: budgetUpdate,
            timestamp: Date.now(),
            source: 'user'
          }
        );

        if (updatedState) {
          setItineraryState(updatedState);
          setSyncStatus(updatedState.syncStatus);
          if (updatedState.itinerary) {
            // Use new generator for recap
            const recapData = await generateTripRecap();
            if (recapData) {
              setRecapData(recapData);
            } else {
              generateRecapDataFromEngine(updatedState.itinerary);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to update itinerary with budget change:', error);
      setEngineError(error instanceof Error ? error.message : 'Failed to update budget');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const generateRecapData = () => {
    if (itinerary.length === 0) return;

    console.log('📋 Generating recap data with itinerary:', {
      itineraryLength: itinerary.length,
      preferences: preferences
    });

    const totalDays = itinerary.length;
    const totalDestinations = itinerary.reduce((sum, day) => sum + day.destinations.length, 0);

    // Use preferences as primary source with itinerary as enhancement
    const primaryDuration = preferences.days || totalDays || 1;
    const primaryTravelers = preferences.travelers || 1;
    const primaryTotalDestinations = preferences.preferredSpots.length || totalDestinations || 0;

    // Get smart-budget selections from localStorage
    const accommodationSelection = getAccommodationSelection();
    const transportationSelection = getTransportationSelection();

    // Get ML insights from smart-budget
    const userProfile = mlEngine.getUserProfile('demo-user-001');
    const mlInsights = userProfile?.mlInsights || {
      priceSensitivity: 0.6,
      activityPreference: 0.7,
      riskTolerance: 0.5,
      spontaneityScore: 0.4,
      socialPreference: 0.6
    };

    // Calculate budget analysis
    const destinations = preferences.preferredSpots.map(spot => ({
      id: spot.toLowerCase().replace(/\s+/g, '-'),
      name: spot,
      location: preferences.cities[0] || 'Multiple Cities',
      category: 'attraction',
      estimatedCost: Math.floor(preferences.budget * 0.15 / preferences.preferredSpots.length),
      duration: 3
    }));

    const budgetInput = {
      userId: 'demo-user-001',
      preferences: {
        budget: preferences.budget,
        days: preferences.days,
        travelers: preferences.travelers,
        accommodationType: preferences.accommodationType,
        cities: preferences.cities,
        interests: preferences.interests || []
      },
      destinations: destinations
    };

    const budgetAnalysis = budgetEngine.calculateSmartBudget(budgetInput);

    // Calculate total costs
    let totalEstimatedCost = 0;
    itinerary.forEach(day => {
      // Accommodation cost
      if (accommodationSelection?.hotel) {
        totalEstimatedCost += accommodationSelection.hotel.pricePerNight;
      } else if (day.accommodation) {
        totalEstimatedCost += day.accommodation.cost * preferences.travelers;
      }

      // Transportation cost
      if (transportationSelection?.transportation) {
        totalEstimatedCost += transportationSelection.transportation.price / primaryDuration; // Spread across days
      } else if (day.transportation) {
        totalEstimatedCost += day.transportation.cost * primaryTravelers;
      }

      // Activity costs
      day.destinations.forEach(dest => {
        totalEstimatedCost += (dest.estimatedCost || 0) * primaryTravelers;
      });
    });

    // Add food and miscellaneous
    const foodCost = primaryDuration * 200000 * primaryTravelers;
    const miscCost = primaryDuration * 100000 * primaryTravelers;
    totalEstimatedCost += foodCost + miscCost;

    // Trip Overview
    const startDate = new Date(preferences.startDate || Date.now());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + primaryDuration - 1);

    const tripOverview = {
      startDate: startDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      endDate: endDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      duration: primaryDuration,
      travelers: primaryTravelers,
      destinations: preferences.cities,
      totalDestinations: primaryTotalDestinations
    };

    // AI Personalization Insights
    const aiInsights = {
      activityLover: Math.round(mlInsights.activityPreference * 100),
      valueSeeker: Math.round(mlInsights.priceSensitivity * 100),
      spontaneous: Math.round(mlInsights.spontaneityScore * 100),
      explorer: Math.round(mlInsights.riskTolerance * 100)
    };

    // Budget Summary
    const budgetSummary = {
      estimatedBudget: preferences.budget,
      aiOptimized: budgetAnalysis.totalBudget,
      savingsPotential: Math.round(((preferences.budget - budgetAnalysis.totalBudget) / preferences.budget) * 100),
      confidence: Math.round(budgetAnalysis.confidence * 100)
    };

    // Smart Budget Breakdown
    const budgetBreakdown = budgetAnalysis.categoryBreakdown;

    // Accommodation Details
    const accommodationDetails = accommodationSelection?.hotel ? {
      hotelName: accommodationSelection.hotel.name,
      nightlyRate: accommodationSelection.hotel.pricePerNight,
      totalNights: primaryDuration,
      totalCost: accommodationSelection.hotel.pricePerNight * primaryDuration,
      type: accommodationSelection.hotel.category
    } : {
      hotelName: preferences.accommodationType,
      nightlyRate: 0,
      totalNights: primaryDuration,
      totalCost: itinerary.reduce((sum, day) => sum + (day.accommodation?.cost || 0) * primaryTravelers, 0),
      type: preferences.accommodationType
    };

    // Transportation Details
    const transportationDetails = transportationSelection?.transportation ? {
      option: transportationSelection.transportation.type,
      totalCost: transportationSelection.transportation.price,
      distribution: `One-time ${transportationSelection.transportation.type.toLowerCase()}`,
      type: transportationSelection.transportation.type
    } : {
      option: 'Multiple Options',
      totalCost: itinerary.reduce((sum, day) => sum + (day.transportation?.cost || 0) * primaryTravelers, 0),
      distribution: 'Daily transportation',
      type: 'Mixed'
    };

    // Daily Itinerary Recap
    const dailyItinerary = itinerary.map((day, index) => {
      const dayDate = new Date(preferences.startDate || Date.now());
      dayDate.setDate(dayDate.getDate() + index);

      let dailyCost = day.destinations.reduce((sum, dest) => sum + (dest.estimatedCost || 0) * primaryTravelers, 0);

      // Add accommodation (daily portion)
      if (accommodationSelection?.hotel) {
        dailyCost += accommodationSelection.hotel.pricePerNight;
      } else if (day.accommodation) {
        dailyCost += day.accommodation.cost * primaryTravelers;
      }

      // Add transportation (daily portion)
      if (transportationSelection?.transportation) {
        dailyCost += transportationSelection.transportation.price / primaryDuration;
      } else if (day.transportation) {
        dailyCost += day.transportation.cost * primaryTravelers;
      }

      return {
        day: day.day,
        date: dayDate.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        destinations: day.destinations.map(dest => dest.location?.split(',')[0]).filter(city => city !== undefined) as string[],
        activities: day.destinations.map(dest => ({
          name: dest.name,
          category: dest.category || 'general',
          time: dest.time || 'TBA',
          duration: dest.duration || '2 hours',
          cost: dest.estimatedCost || 0,
          rating: dest.rating || 4.0
        })),
        dailyCost: dailyCost
      };
    });

    // User Configurations Recap
    const userConfigurations = {
      totalBudget: preferences.budget,
      accommodationType: preferences.accommodationType,
      startDate: preferences.startDate || '',
      duration: primaryDuration,
      travelers: primaryTravelers
    };

    const recap: TripRecapData = {
      tripOverview,
      mlInsights: aiInsights,
      budgetSummary,
      budgetBreakdown,
      accommodationDetails,
      transportationDetails,
      dailyItinerary,
      userConfigurations
    };

    setRecapData(recap);
    console.log('📋 Trip Recap Generated:', recap);
  };

  // Generate recap data from ItineraryManagementEngine result
  const generateRecapDataFromEngine = (engineResult: any) => {
    if (!engineResult?.itinerary || engineResult.itinerary.length === 0) return;

    console.log('📋 Generating recap data from engine result:', {
      itineraryLength: engineResult.itinerary.length,
      preferences: preferences
    });

    const totalDays = engineResult.itinerary.length;
    const totalDestinations = engineResult.itinerary.reduce((sum: number, day: any) => sum + day.destinations.length, 0);

    // Use preferences as primary source with itinerary as enhancement
    const primaryDuration = preferences.days || totalDays || 1;
    const primaryTravelers = preferences.travelers || 1;
    const primaryTotalDestinations = preferences.preferredSpots.length || totalDestinations || 0;

    // Get smart-budget selections from localStorage
    const accommodationSelection = getAccommodationSelection();
    const transportationSelection = getTransportationSelection();

    // Get ML insights from smart-budget
    const userProfile = mlEngine.getUserProfile('demo-user-001');
    const mlInsights = userProfile?.mlInsights || {
      priceSensitivity: 0.6,
      activityPreference: 0.7,
      riskTolerance: 0.5,
      spontaneityScore: 0.4,
      socialPreference: 0.6
    };

    // Calculate budget analysis using engine data
    const budgetAnalysis = engineResult.budgetBreakdown || {
      totalBudget: preferences.budget,
      categoryBreakdown: {
        accommodation: { allocated: 0, recommended: preferences.budget * 0.4, savings: 0 },
        transportation: { allocated: 0, recommended: preferences.budget * 0.2, savings: 0 },
        food: { allocated: 0, recommended: preferences.budget * 0.2, savings: 0 },
        activities: { allocated: 0, recommended: preferences.budget * 0.15, savings: 0 },
        miscellaneous: { allocated: 0, recommended: preferences.budget * 0.05, savings: 0 }
      },
      confidence: 0.85
    };

    // Calculate total costs from engine result
    let totalEstimatedCost = 0;
    engineResult.itinerary.forEach((day: any) => {
      // Accommodation cost
      if (accommodationSelection?.hotel) {
        totalEstimatedCost += accommodationSelection.hotel.pricePerNight;
      } else if (day.accommodation) {
        totalEstimatedCost += day.accommodation.cost * primaryTravelers;
      }

      // Transportation cost
      if (transportationSelection?.transportation) {
        totalEstimatedCost += transportationSelection.transportation.price / primaryDuration;
      } else if (day.transportation) {
        totalEstimatedCost += day.transportation.cost * primaryTravelers;
      }

      // Activity costs
      day.destinations.forEach((dest: any) => {
        totalEstimatedCost += (dest.estimatedCost || 0) * primaryTravelers;
      });
    });

    // Add food and miscellaneous
    const foodCost = primaryDuration * 200000 * primaryTravelers;
    const miscCost = primaryDuration * 100000 * primaryTravelers;
    totalEstimatedCost += foodCost + miscCost;

    // Trip Overview
    const startDate = new Date(preferences.startDate || Date.now());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + primaryDuration - 1);

    const tripOverview = {
      startDate: startDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      endDate: endDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      duration: primaryDuration,
      travelers: primaryTravelers,
      destinations: preferences.cities,
      totalDestinations: primaryTotalDestinations
    };

    // AI Personalization Insights
    const aiInsights = {
      activityLover: Math.round(mlInsights.activityPreference * 100),
      valueSeeker: Math.round(mlInsights.priceSensitivity * 100),
      spontaneous: Math.round(mlInsights.spontaneityScore * 100),
      explorer: Math.round(mlInsights.riskTolerance * 100)
    };

    // Budget Summary
    const budgetSummary = {
      estimatedBudget: preferences.budget,
      aiOptimized: budgetAnalysis.totalBudget,
      savingsPotential: Math.round(((preferences.budget - budgetAnalysis.totalBudget) / preferences.budget) * 100),
      confidence: Math.round(budgetAnalysis.confidence * 100)
    };

    // Smart Budget Breakdown
    const budgetBreakdown = budgetAnalysis.categoryBreakdown;

    // Accommodation Details
    const accommodationDetails = accommodationSelection?.hotel ? {
      hotelName: accommodationSelection.hotel.name,
      nightlyRate: accommodationSelection.hotel.pricePerNight,
      totalNights: primaryDuration,
      totalCost: accommodationSelection.hotel.pricePerNight * primaryDuration,
      type: accommodationSelection.hotel.category
    } : {
      hotelName: preferences.accommodationType,
      nightlyRate: 0,
      totalNights: primaryDuration,
      totalCost: engineResult.itinerary.reduce((sum: number, day: any) => sum + (day.accommodation?.cost || 0) * primaryTravelers, 0),
      type: preferences.accommodationType
    };

    // Transportation Details
    const transportationDetails = transportationSelection?.transportation ? {
      option: transportationSelection.transportation.type,
      totalCost: transportationSelection.transportation.price,
      distribution: `One-time ${transportationSelection.transportation.type.toLowerCase()}`,
      type: transportationSelection.transportation.type
    } : {
      option: 'Multiple Options',
      totalCost: engineResult.itinerary.reduce((sum: number, day: any) => sum + (day.transportation?.cost || 0) * primaryTravelers, 0),
      distribution: 'Daily transportation',
      type: 'Mixed'
    };

    // Daily Itinerary Recap from engine
    const dailyItinerary = engineResult.itinerary.map((day: any, index: number) => {
      const dayDate = new Date(preferences.startDate || Date.now());
      dayDate.setDate(dayDate.getDate() + index);

      let dailyCost = day.destinations.reduce((sum: number, dest: any) => sum + (dest.estimatedCost || 0) * primaryTravelers, 0);

      // Add accommodation (daily portion)
      if (accommodationSelection?.hotel) {
        dailyCost += accommodationSelection.hotel.pricePerNight;
      } else if (day.accommodation) {
        dailyCost += day.accommodation.cost * primaryTravelers;
      }

      // Add transportation (daily portion)
      if (transportationSelection?.transportation) {
        dailyCost += transportationSelection.transportation.price / primaryDuration;
      } else if (day.transportation) {
        dailyCost += day.transportation.cost * primaryTravelers;
      }

      return {
        day: day.day,
        date: dayDate.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        destinations: day.destinations.map((dest: any) => dest.location?.split(',')[0]).filter((city: string) => city !== undefined) as string[],
        activities: day.destinations.map((dest: any) => ({
          name: dest.name,
          category: dest.category || 'general',
          time: dest.scheduledTime || 'TBA',
          duration: dest.duration ? `${dest.duration} minutes` : '2 hours',
          cost: dest.estimatedCost || 0,
          rating: dest.rating || 4.0
        })),
        dailyCost: dailyCost
      };
    });

    // User Configurations Recap
    const userConfigurations = {
      totalBudget: preferences.budget,
      accommodationType: preferences.accommodationType,
      startDate: preferences.startDate || '',
      duration: primaryDuration,
      travelers: primaryTravelers
    };

    const recap: TripRecapData = {
      tripOverview,
      mlInsights: aiInsights,
      budgetSummary,
      budgetBreakdown,
      accommodationDetails,
      transportationDetails,
      dailyItinerary,
      userConfigurations
    };

    setRecapData(recap);
    console.log('📋 Trip Recap Generated from Engine:', recap);
  };

  // Generate recap data from East Java itinerary result
  const generateRecapDataFromEastJava = (eastJavaResult: any, userPreferences: any): TripRecapData => {
    const totalDays = eastJavaResult.itinerary.length;
    const totalDestinations = eastJavaResult.itinerary.reduce((sum: number, day: any) => sum + day.destinations.length, 0);

    // Use preferences as primary source
    const primaryDuration = userPreferences.days || totalDays || 1;
    const primaryTravelers = userPreferences.travelers || 1;

    // Get ML insights
    const userProfile = mlEngine.getUserProfile('demo-user-001');
    const mlInsights = userProfile?.mlInsights || {
      priceSensitivity: 0.6,
      activityPreference: 0.7,
      riskTolerance: 0.5,
      spontaneityScore: 0.4,
      socialPreference: 0.6
    };

    // Trip Overview
    const startDate = new Date(userPreferences.startDate || Date.now());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + primaryDuration - 1);

    const tripOverview = {
      startDate: startDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      endDate: endDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      duration: primaryDuration,
      travelers: primaryTravelers,
      destinations: ['Surabaya', 'Malang', 'Batu', 'Probolinggo', 'Lumajang', 'Blitar'], // East Java cities
      totalDestinations: totalDestinations
    };

    // AI Personalization Insights
    const aiInsights = {
      activityLover: Math.round(mlInsights.activityPreference * 100),
      valueSeeker: Math.round(mlInsights.priceSensitivity * 100),
      spontaneous: Math.round(mlInsights.spontaneityScore * 100),
      explorer: Math.round(mlInsights.riskTolerance * 100)
    };

    // Budget Summary
    const budgetSummary = {
      estimatedBudget: userPreferences.budget,
      aiOptimized: eastJavaResult.totalCost,
      savingsPotential: Math.round(((userPreferences.budget - eastJavaResult.totalCost) / userPreferences.budget) * 100),
      confidence: Math.round(eastJavaResult.mlInsights.personalizationScore * 100)
    };

    // Smart Budget Breakdown
    const budgetBreakdown = eastJavaResult.budgetBreakdown.categoryBreakdown;

    // Accommodation Details (use default since not specified in East Java result)
    const accommodationDetails = {
      hotelName: userPreferences.accommodationType,
      nightlyRate: Math.round(eastJavaResult.totalCost * 0.4 / primaryDuration),
      totalNights: primaryDuration,
      totalCost: Math.round(eastJavaResult.totalCost * 0.4),
      type: userPreferences.accommodationType
    };

    // Transportation Details
    const transportationDetails = {
      option: 'East Java Routes',
      totalCost: Math.round(eastJavaResult.totalCost * 0.2),
      distribution: 'Inter-city travel',
      type: 'Mixed'
    };

    // Daily Itinerary Recap from East Java result
    const dailyItinerary = eastJavaResult.itinerary.map((day: any, index: number) => {
      const dayDate = new Date(userPreferences.startDate || Date.now());
      dayDate.setDate(dayDate.getDate() + index);

      return {
        day: day.day,
        date: dayDate.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        destinations: day.destinations.map((dest: any) => dest.location?.split(',')[0]).filter((city: string) => city !== undefined) as string[],
        activities: day.destinations.map((dest: any) => ({
          name: dest.name,
          category: dest.category || 'general',
          time: dest.scheduledTime || 'TBA',
          duration: dest.duration ? `${dest.duration} minutes` : '2 hours',
          cost: dest.estimatedCost || 0,
          rating: dest.rating || 4.0
        })),
        dailyCost: day.totalCost
      };
    });

    // User Configurations Recap
    const userConfigurations = {
      totalBudget: userPreferences.budget,
      accommodationType: userPreferences.accommodationType,
      startDate: userPreferences.startDate || '',
      duration: primaryDuration,
      travelers: primaryTravelers
    };

    const recap: TripRecapData = {
      tripOverview,
      mlInsights: aiInsights,
      budgetSummary,
      budgetBreakdown,
      accommodationDetails,
      transportationDetails,
      dailyItinerary,
      userConfigurations
    };

    return recap;
  };

  // Generate trip recap using the new configurable itinerary generator
  const generateTripRecap = async (): Promise<TripRecapData | null> => {
    try {
      console.log('🔄 [DEBUG] Generating trip recap with new itinerary generator...');
      console.log('🔄 [DEBUG] Current preferences:', {
        budget: preferences.budget,
        days: preferences.days,
        travelers: preferences.travelers,
        cities: preferences.cities,
        preferredSpots: preferences.preferredSpots,
        accommodationType: preferences.accommodationType
      });

      // Prepare destinations from preferences
      const destinations = preferences.preferredSpots.map(spot => ({
        id: spot.toLowerCase().replace(/\s+/g, '-'),
        name: spot,
        location: preferences.cities[0] || 'Multiple Cities',
        category: 'attraction',
        estimatedCost: Math.floor(preferences.budget * 0.15 / preferences.preferredSpots.length),
        duration: 180, // 3 hours default
        tags: ['user-selected'],
        rating: 4.0,
        coordinates: { lat: -6.2088, lng: 106.8456 } // Default Jakarta coordinates
      }));

      console.log('🔄 [DEBUG] Prepared destinations:', destinations);

      // Prepare generator input
      const generatorInput = {
        userId: 'demo-user-001',
        sessionId: `recap_${Date.now()}`,
        preferences: {
          budget: preferences.budget,
          days: Math.min(preferences.days || 3, 3), // Limit to 3 days for recap
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType as 'budget' | 'moderate' | 'luxury',
          cities: preferences.cities,
          interests: preferences.interests || [],
          themes: preferences.themes || [],
          preferredSpots: preferences.preferredSpots,
          startDate: preferences.startDate || new Date().toISOString().split('T')[0],
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: preferences.preferredSpots.slice(0, 3), // Top 3 must-visit
            avoidCrowds: false,
            accessibilityRequired: false
          }
        },
        availableDestinations: destinations,
        config: {
          ...itineraryGenerator.getConfig(),
          ...generatorConfig,
          dayStructure: {
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            maxDailyActivities: 4,
            activityBufferTime: 30,
            includeBreaks: true,
            breakDuration: 30
          }
        }
      };

      console.log('🔄 [DEBUG] Generator input prepared:', {
        userId: generatorInput.userId,
        sessionId: generatorInput.sessionId,
        days: generatorInput.preferences.days,
        destinationsCount: generatorInput.availableDestinations.length,
        config: generatorInput.config
      });

      // Generate itinerary using the new generator
      console.log('🔄 [DEBUG] Calling itineraryGenerator.generateItinerary...');
      const result = await itineraryGenerator.generateItinerary(generatorInput);
      console.log('🔄 [DEBUG] Generator result received:', {
        success: result.success,
        hasItinerary: !!result.itinerary,
        hasErrors: !!result.errors,
        errors: result.errors
      });

      if (!result.success || !result.itinerary) {
        console.error('❌ [DEBUG] Itinerary generator failed:', result.errors);
        return null;
      }

      console.log('✅ [DEBUG] Itinerary generator succeeded, building recap data...');
      console.log('✅ [DEBUG] Generated itinerary structure:', {
        days: result.itinerary.days.length,
        totalCost: result.itinerary.summary.totalCost,
        confidence: result.itinerary.summary.confidence
      });

      // Build TripRecapData from generator output
      const totalDays = result.itinerary.days.length;
      const totalDestinations = result.itinerary.days.reduce((sum, day) => sum + day.destinations.length, 0);

      // Trip Overview
      const startDate = new Date(preferences.startDate || Date.now());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + totalDays - 1);

      const tripOverview = {
        startDate: startDate.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        endDate: endDate.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        duration: totalDays,
        travelers: preferences.travelers,
        destinations: preferences.cities,
        totalDestinations: totalDestinations
      };

      // AI Personalization Insights (from ML insights)
      const mlInsights = {
        activityLover: Math.round(result.itinerary.mlInsights.personalizationScore * 20),
        valueSeeker: Math.round((1 - result.itinerary.mlInsights.personalizationScore) * 100),
        spontaneous: Math.round(result.itinerary.mlInsights.predictedUserSatisfaction * 100),
        explorer: Math.round(result.itinerary.optimization.timeOptimization)
      };

      // Budget Summary
      const budgetSummary = {
        estimatedBudget: preferences.budget,
        aiOptimized: result.itinerary.summary.totalCost,
        savingsPotential: Math.round(((preferences.budget - result.itinerary.summary.totalCost) / preferences.budget) * 100),
        confidence: Math.round(result.itinerary.summary.confidence * 100)
      };

      // Smart Budget Breakdown
      const budgetBreakdown = result.itinerary.budgetBreakdown.categoryBreakdown;

      // Accommodation Details (simplified)
      const accommodationDetails = {
        hotelName: preferences.accommodationType,
        nightlyRate: Math.round(result.itinerary.budgetBreakdown.categoryBreakdown.accommodation.recommended / totalDays),
        totalNights: totalDays,
        totalCost: result.itinerary.budgetBreakdown.categoryBreakdown.accommodation.recommended,
        type: preferences.accommodationType
      };

      // Transportation Details (simplified)
      const transportationDetails = {
        option: 'Optimized Routes',
        totalCost: result.itinerary.budgetBreakdown.categoryBreakdown.transportation.recommended,
        distribution: 'Daily optimized transport',
        type: 'Mixed'
      };

      // Daily Itinerary Recap from generator output
      const dailyItinerary = result.itinerary.days.map((day) => ({
        day: day.day,
        date: day.date,
        destinations: day.destinations.map(dest => dest.location?.split(',')[0]).filter(city => city !== undefined) as string[],
        activities: day.destinations.map(dest => ({
          name: dest.name,
          category: dest.category,
          time: dest.scheduledTime,
          duration: `${dest.duration} minutes`,
          cost: dest.estimatedCost,
          rating: dest.rating
        })),
        dailyCost: day.totalCost
      }));

      // User Configurations Recap
      const userConfigurations = {
        totalBudget: preferences.budget,
        accommodationType: preferences.accommodationType,
        startDate: preferences.startDate || '',
        duration: totalDays,
        travelers: preferences.travelers
      };

      const recap: TripRecapData = {
        tripOverview,
        mlInsights,
        budgetSummary,
        budgetBreakdown,
        accommodationDetails,
        transportationDetails,
        dailyItinerary,
        userConfigurations
      };

      console.log('📋 Trip Recap Generated with new generator:', recap);
      return recap;

    } catch (error) {
      console.error('❌ Failed to generate trip recap with new generator:', error);
      return null;
    }
  };

  const handleSaveAndContinue = async () => {
    console.log('🔄 [DEBUG] handleSaveAndContinue called');
    if (!recapData) {
      console.warn('❌ [DEBUG] No recap data available');
      return;
    }

    console.log('✅ [DEBUG] Recap data available:', {
      hasTripOverview: !!recapData.tripOverview,
      hasBudgetSummary: !!recapData.budgetSummary,
      hasDailyItinerary: !!recapData.dailyItinerary,
      dailyItineraryLength: recapData.dailyItinerary?.length
    });

    try {
      // Generate itinerary using the new generator if not already generated
      let generatorResult = null;
      if (!itineraryState) {
        console.log('🔄 [DEBUG] No existing itinerary state, generating new one for plan page...');
        generatorResult = await generateTripRecap();
        if (!generatorResult) {
          console.error('❌ [DEBUG] Failed to generate itinerary for plan page');
          return;
        }
        console.log('✅ [DEBUG] Generator result received for plan page:', {
          days: generatorResult.dailyItinerary.length,
          totalCost: generatorResult.budgetSummary.aiOptimized
        });
      } else {
        console.log('✅ [DEBUG] Using existing itinerary state');
      }

      console.log('🔄 [DEBUG] Transforming data for plan page...');

      // Transform generator output to match PlanData format
      const transformedItineraryState: ItineraryState = {
        id: itineraryState?.id || `itinerary_${Date.now()}`,
        userId: 'demo-user-001',
        version: itineraryState?.version || 1,
        lastModified: Date.now(),
        itinerary: generatorResult ? {
          // Transform GeneratorOutput.itinerary to SmartItineraryResult format
          itinerary: generatorResult.dailyItinerary.map(day => ({
            day: day.day,
            date: day.date,
            destinations: day.activities.map(activity => ({
              id: activity.name.toLowerCase().replace(/\s+/g, '-'),
              name: activity.name,
              category: activity.category,
              location: day.destinations[0] || 'Multiple Cities',
              coordinates: { lat: -6.2088, lng: 106.8456 }, // Default coordinates
              scheduledTime: activity.time,
              duration: activity.duration === '2 hours' ? 120 : 180, // Convert to minutes
              estimatedCost: activity.cost,
              rating: activity.rating,
              tags: [activity.category.toLowerCase()],
              mlScore: 0.8,
              predictedSatisfaction: activity.rating / 5
            })),
            totalCost: day.dailyCost,
            totalTime: day.activities.reduce((sum, act) => sum + (act.duration === '2 hours' ? 120 : 180), 0),
            mlConfidence: 0.85,
            optimizationReasons: ['Optimized by AI generator']
          })),
          totalCost: generatorResult.budgetSummary.aiOptimized,
          totalDuration: generatorResult.tripOverview.duration * 480, // Estimate 8 hours per day
          budgetBreakdown: {
            totalBudget: generatorResult.budgetSummary.estimatedBudget,
            categoryBreakdown: generatorResult.budgetBreakdown,
            optimizations: [],
            confidence: generatorResult.budgetSummary.confidence / 100,
            reasoning: ['AI-optimized budget breakdown']
          },
          mlInsights: {
            personalizationScore: generatorResult.mlInsights.activityLover / 100,
            predictedUserSatisfaction: generatorResult.mlInsights.spontaneous / 100,
            riskFactors: [],
            recommendations: []
          },
          optimization: {
            timeOptimization: 15,
            costOptimization: generatorResult.budgetSummary.savingsPotential,
            satisfactionOptimization: 20,
            reasoning: ['AI-powered optimization']
          },
          costVariability: {
            seasonalAdjustments: [],
            demandFactors: [],
            currencyRates: [],
            appliedDiscounts: [],
            realTimeUpdates: []
          }
        } : (itineraryState?.itinerary || null),
        input: {
          userId: 'demo-user-001',
          preferences: preferences,
          availableDestinations: preferences.preferredSpots.map(spot => ({
            id: spot.toLowerCase().replace(/\s+/g, '-'),
            name: spot,
            location: preferences.cities[0] || 'Multiple Cities',
            category: 'attraction',
            estimatedCost: Math.floor(preferences.budget * 0.15 / preferences.preferredSpots.length),
            duration: 180,
            coordinates: { lat: -6.2088, lng: 106.8456 },
            tags: ['user-selected'],
            rating: 4.0
          })),
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: preferences.preferredSpots.slice(0, 3),
            avoidCrowds: false,
            accessibilityRequired: false
          }
        },
        syncStatus: 'synced' as const,
        validationStatus: 'valid' as const,
        errorLog: []
      };

      console.log('🔄 [DEBUG] Transformed itinerary state:', {
        id: transformedItineraryState.id,
        hasItinerary: !!transformedItineraryState.itinerary,
        itineraryDays: transformedItineraryState.itinerary?.itinerary?.length,
        totalCost: transformedItineraryState.itinerary?.totalCost
      });

      // Prepare data for plan page with transformed itinerary state
      const planData = {
        recapData,
        itineraryState: transformedItineraryState,
        engineGenerated: true,
        syncStatus: 'synced' as const,
        lastModified: Date.now()
      };

      console.log('🔄 [DEBUG] Plan data prepared:', {
        hasRecapData: !!planData.recapData,
        hasItineraryState: !!planData.itineraryState,
        engineGenerated: planData.engineGenerated,
        syncStatus: planData.syncStatus
      });

      // Store in localStorage for plan page access
      console.log('💾 [DEBUG] Storing plan data in localStorage...');
      localStorage.setItem('jatour-plan-data', JSON.stringify(planData));
      console.log('✅ [DEBUG] Plan data stored in localStorage');

      // Verify storage
      const stored = localStorage.getItem('jatour-plan-data');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('✅ [DEBUG] localStorage verification successful:', {
          hasRecapData: !!parsed.recapData,
          hasItineraryState: !!parsed.itineraryState,
          dataSize: stored.length
        });
      } else {
        console.error('❌ [DEBUG] localStorage storage failed');
      }

      // Emit event for cross-tab sync
      console.log('📡 [DEBUG] Emitting cross-tab sync event...');
      window.dispatchEvent(new CustomEvent('itinerary-plan-ready', {
        detail: planData
      }));

      console.log('📋 [DEBUG] Data preparation complete, navigating to plan page...');
      router.push("/dashboard/plan");
    } catch (error) {
      console.error('❌ [DEBUG] Failed to prepare data for plan page:', error);
      alert("Failed to prepare itinerary data. Please try again.");
    }
  };

  const handleGenerateEastJavaItinerary = async () => {
    if (!preferences.startDate || !preferences.days || !preferences.travelers) {
      alert("Mohon lengkapi tanggal, durasi, dan jumlah traveler terlebih dahulu");
      return;
    }

    setGeneratingEastJava(true);
    setEngineError(null);

    try {
      // Prepare East Java input with user preferences
      const eastJavaInput = {
        userId: 'demo-user-001',
        preferences: {
          budget: preferences.budget,
          days: preferences.days,
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType,
          cities: [
            'Surabaya', 'Malang', 'Batu', 'Probolinggo', 'Lumajang', 'Blitar',
            'Kediri', 'Madiun', 'Nganjuk', 'Jember', 'Bojonegoro', 'Pacitan'
          ], // East Java cities
          interests: preferences.interests || [],
          themes: preferences.themes || [],
          preferredSpots: preferences.preferredSpots || [],
          startDate: preferences.startDate
        },
        availableDestinations: [], // Will be populated by engine
        constraints: {
          maxDailyTravelTime: 480,
          preferredStartTime: '08:00',
          preferredEndTime: '18:00',
          avoidCrowds: preferences.notes?.toLowerCase().includes('crowd') || false,
          accessibilityRequired: preferences.notes?.toLowerCase().includes('accessibility') || false
        }
      };

      console.log('🔄 Generating East Java itinerary with preferences:', eastJavaInput);

      // Generate East Java itinerary
      const eastJavaResult = await smartItineraryEngine.createEastJavaItinerary(eastJavaInput);

      setEastJavaItinerary(eastJavaResult);

      // Create recap data from East Java result
      const eastJavaRecapData = generateRecapDataFromEastJava(eastJavaResult, preferences);

      // Set the recap data to display on the page
      setRecapData(eastJavaRecapData);

      // Mark East Java recap as ready for navigation
      setEastJavaRecapReady(true);

      console.log('📋 East Java itinerary generated and recap displayed:', eastJavaRecapData);

    } catch (error) {
      console.error('Failed to generate East Java itinerary:', error);
      setEngineError(error instanceof Error ? error.message : 'Failed to generate East Java itinerary');
      alert("Gagal membuat itinerary East Java. Silakan coba lagi.");
    } finally {
      setGeneratingEastJava(false);
    }
  };

  const handleNavigateToEastJavaPlan = () => {
    if (!eastJavaItinerary || !recapData) {
      console.warn('No East Java itinerary or recap data available');
      return;
    }

    // Prepare East Java input for plan data
    const eastJavaInput = {
      userId: 'demo-user-001',
      preferences: {
        budget: preferences.budget,
        days: preferences.days,
        travelers: preferences.travelers,
        accommodationType: preferences.accommodationType,
        cities: [
          'Surabaya', 'Malang', 'Batu', 'Probolinggo', 'Lumajang', 'Blitar',
          'Kediri', 'Madiun', 'Nganjuk', 'Jember', 'Bojonegoro', 'Pacitan'
        ], // East Java cities
        interests: preferences.interests || [],
        themes: preferences.themes || [],
        preferredSpots: preferences.preferredSpots || [],
        startDate: preferences.startDate
      },
      availableDestinations: [], // Will be populated by engine
      constraints: {
        maxDailyTravelTime: 480,
        preferredStartTime: '08:00',
        preferredEndTime: '18:00',
        avoidCrowds: preferences.notes?.toLowerCase().includes('crowd') || false,
        accessibilityRequired: preferences.notes?.toLowerCase().includes('accessibility') || false
      }
    };

    // Prepare data for plan page
    const planData = {
      recapData,
      itineraryState: {
        id: `east-java-${Date.now()}`,
        itinerary: eastJavaItinerary,
        input: eastJavaInput,
        syncStatus: 'synced',
        lastModified: Date.now(),
        version: 1
      },
      engineGenerated: true,
      syncStatus: 'synced',
      lastModified: Date.now(),
      title: "Generated Itinerary: Your AI-Powered East Java Travel Plan"
    };

    // Store in localStorage for plan page access
    localStorage.setItem('jatour-plan-data', JSON.stringify(planData));

    // Emit event for cross-tab sync
    window.dispatchEvent(new CustomEvent('itinerary-plan-ready', {
      detail: planData
    }));

    console.log('📋 East Java plan data prepared, navigating to plan page:', planData);
    router.push("/dashboard/plan");
  };

  // Generate itinerary using ItineraryManagementEngine
  const handleGenerateItineraryWithEngine = async () => {
    if (!preferences.startDate || !preferences.days || !preferences.travelers) {
      alert("Mohon lengkapi tanggal, durasi, dan jumlah traveler terlebih dahulu");
      return;
    }

    console.log('🔄 Generating itinerary with engine:', {
      days: preferences.days,
      travelers: preferences.travelers,
      budget: preferences.budget,
      cities: preferences.cities
    });

    setLoading(true);
    setEngineError(null);

    try {
      // Prepare input for ItineraryManagementEngine
      const engineInput = {
        userId: 'demo-user-001',
        preferences: {
          budget: preferences.budget,
          days: preferences.days,
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType,
          cities: preferences.cities,
          interests: preferences.interests || [],
          themes: preferences.themes || [],
          preferredSpots: preferences.preferredSpots || [],
          startDate: preferences.startDate
        },
        availableDestinations: [], // Will be populated by engine based on preferences
        constraints: {
          maxDailyTravelTime: 480,
          preferredStartTime: '08:00',
          preferredEndTime: '18:00',
          avoidCrowds: preferences.notes?.toLowerCase().includes('crowd') || false,
          accessibilityRequired: preferences.notes?.toLowerCase().includes('accessibility') || false
        }
      };

      const itineraryState = await itineraryManagementEngine.createItinerary(engineInput);

      if (itineraryState.itinerary) {
        setItineraryState(itineraryState);
        setSyncStatus(itineraryState.syncStatus);

        // Use new generator for recap instead of old logic
        const recapData = await generateTripRecap();
        if (recapData) {
          setRecapData(recapData);
        } else {
          generateRecapDataFromEngine(itineraryState.itinerary);
        }

        // Also update the context itinerary for compatibility
        const contextItinerary = itineraryState.itinerary.itinerary.map((day: any, index: number) => ({
          id: `day-${day.day}`,
          day: day.day,
          date: day.date,
          destinations: day.destinations.map((dest: any) => ({
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
          accommodation: day.accommodation,
          transportation: day.transportation
        }));

        // Update context
        const context = useSmartItinerary();
        context.setItinerary(contextItinerary);

        console.log('✅ Itinerary generated successfully with engine');
      } else {
        throw new Error('Failed to generate itinerary');
      }

    } catch (error) {
      console.error('Failed to generate itinerary with engine:', error);
      setEngineError(error instanceof Error ? error.message : 'Failed to generate itinerary');

      // Fallback to context generation
      console.log('🔄 Falling back to context itinerary generation...');
      await handleGenerateItinerary();
    } finally {
      setLoading(false);
    }
  };

  const handleEditPreferences = () => {
    router.push("/dashboard/preferences/themes");
  };

  const formatCurrency = (amount: number) => {
    return `IDR ${amount.toLocaleString('id-ID')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'heritage': return <MapPin className="h-4 w-4" />;
      case 'nature': return <Heart className="h-4 w-4" />;
      case 'adventure': return <Star className="h-4 w-4" />;
      case 'beach': return <Building2 className="h-4 w-4" />;
      case 'cultural': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mempersiapkan Preview Itinerary</h2>
            <p className="text-gray-600 mb-4">Sedang menganalisis preferensi dan membuat itinerary dengan AI engine...</p>

            {/* Sync Status Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced' ? 'bg-green-500' :
                syncStatus === 'pending' ? 'bg-yellow-500 animate-pulse' :
                syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm text-gray-500">
                Sync: {syncStatus === 'synced' ? 'Synced' :
                       syncStatus === 'pending' ? 'Syncing...' :
                       syncStatus === 'error' ? 'Sync Error' : 'Unknown'}
              </span>
            </div>

            {/* Engine Error Display */}
            {engineError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Engine Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{engineError}</p>
                <p className="text-red-500 text-xs mt-2">Falling back to standard generation...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (noDestinations) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Recap</h2>
            <p className="text-gray-600 mb-6">No destinations found. Please add spots in /dashboard/preferences/spots and refresh.</p>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/dashboard/preferences/spots")}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2"
              >
                Go to Spots Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recapData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Recap</h2>
            <p className="text-gray-600 mb-6">Silakan generate itinerary terlebih dahulu untuk melihat recap perjalanan.</p>

            {/* Debug Info */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <p className="text-sm text-gray-600">Hari: {preferences.days} | Traveler: {preferences.travelers} | Budget: IDR {preferences.budget?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Itinerary Length: {itinerary.length} | Cities: {preferences.cities.join(', ')}</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGenerateItinerary}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2"
              >
                Generate Itinerary
              </Button>

              <Button
                onClick={handleForceRegenerate}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2"
              >
                Force Regenerate Itinerary
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-purple-600 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Trip Recap</h1>
              <p className="text-gray-600">Rekap lengkap perjalanan Anda dengan semua informasi budget dari Smart Budget</p>
            </div>
          </div>

          {/* Engine Status and Sync Indicator */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">AI Engine Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced' ? 'bg-green-500' :
                syncStatus === 'pending' ? 'bg-yellow-500 animate-pulse' :
                syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm text-gray-600">
                Sync: {syncStatus === 'synced' ? 'Synced' :
                       syncStatus === 'pending' ? 'Syncing...' :
                       syncStatus === 'error' ? 'Sync Error' : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* 1. Trip Overview */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <MapPin className="h-6 w-6" />
              Trip Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{recapData.tripOverview.duration}</div>
                <div className="text-sm text-purple-600">Duration (Days)</div>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{recapData.tripOverview.travelers}</div>
                <div className="text-sm text-blue-600">Travelers</div>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{recapData.tripOverview.totalDestinations}</div>
                <div className="text-sm text-green-600">Total Destinations</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-900">{recapData.tripOverview.startDate}</div>
                <div className="text-sm text-orange-600">to {recapData.tripOverview.endDate}</div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Destinations:</h4>
              <div className="flex flex-wrap gap-2">
                {recapData.tripOverview.destinations.map((dest, index) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                    {dest}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. AI Personalization Insights */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="h-6 w-6" />
              AI Personalization Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{recapData.mlInsights.activityLover}%</div>
                <div className="text-sm text-blue-800">Activity Lover</div>
                <Progress value={recapData.mlInsights.activityLover} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{recapData.mlInsights.valueSeeker}%</div>
                <div className="text-sm text-green-800">Value Seeker</div>
                <Progress value={recapData.mlInsights.valueSeeker} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{recapData.mlInsights.spontaneous}%</div>
                <div className="text-sm text-purple-800">Spontaneous</div>
                <Progress value={recapData.mlInsights.spontaneous} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{recapData.mlInsights.explorer}%</div>
                <div className="text-sm text-orange-800">Explorer</div>
                <Progress value={recapData.mlInsights.explorer} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2.5. Generator Configuration Options */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Settings className="h-6 w-6" />
              Recap Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Density
                  </label>
                  <select
                    value={generatorConfig.densityLevel}
                    onChange={(e) => setGeneratorConfig(prev => ({
                      ...prev,
                      densityLevel: e.target.value as 'relaxed' | 'moderate' | 'intense'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="relaxed">Relaxed (2-3 activities/day)</option>
                    <option value="moderate">Moderate (3-4 activities/day)</option>
                    <option value="intense">Intense (4-5 activities/day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Activities Per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={generatorConfig.maxActivitiesPerDay}
                    onChange={(e) => setGeneratorConfig(prev => ({
                      ...prev,
                      maxActivitiesPerDay: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Distribution Strategy
                  </label>
                  <select
                    value={generatorConfig.budgetAllocationStrategy}
                    onChange={(e) => setGeneratorConfig(prev => ({
                      ...prev,
                      budgetAllocationStrategy: e.target.value as 'equal' | 'front-loaded' | 'back-loaded' | 'peak-day'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="equal">Equal Distribution</option>
                    <option value="front-loaded">Front-loaded (more spending early)</option>
                    <option value="back-loaded">Back-loaded (more spending later)</option>
                    <option value="peak-day">Peak Day Focus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Time Percentage
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={generatorConfig.freeTimePercentage}
                    onChange={(e) => setGeneratorConfig(prev => ({
                      ...prev,
                      freeTimePercentage: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage of day allocated for free time</p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 3. Budget Summary */}
        <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-6 w-6" />
              Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">{formatCurrency(recapData.budgetSummary.estimatedBudget)}</div>
                <div className="text-sm text-blue-600">Estimated Budget</div>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-900">{formatCurrency(recapData.budgetSummary.aiOptimized)}</div>
                <div className="text-sm text-green-600">AI Optimized Total</div>
              </div>
              <div className="text-center">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-900">{recapData.budgetSummary.savingsPotential}%</div>
                <div className="text-sm text-purple-600">Savings Potential</div>
              </div>
              <div className="text-center">
                <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-900">{recapData.budgetSummary.confidence}%</div>
                <div className="text-sm text-orange-600">Confidence Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Smart Budget Breakdown */}
        <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <BarChart3 className="h-6 w-6" />
              Smart Budget Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Accommodation</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(recapData.budgetBreakdown.accommodation.recommended)}</div>
                    {recapData.budgetBreakdown.accommodation.savings > 0 && (
                      <div className="text-sm text-green-600">Save {formatCurrency(recapData.budgetBreakdown.accommodation.savings)}</div>
                    )}
                  </div>
                </div>
                <Progress value={(recapData.budgetBreakdown.accommodation.recommended / recapData.budgetSummary.aiOptimized) * 100} className="h-2" />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Transportation</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(recapData.budgetBreakdown.transportation.recommended)}</div>
                    {recapData.budgetBreakdown.transportation.savings > 0 && (
                      <div className="text-sm text-green-600">Save {formatCurrency(recapData.budgetBreakdown.transportation.savings)}</div>
                    )}
                  </div>
                </div>
                <Progress value={(recapData.budgetBreakdown.transportation.recommended / recapData.budgetSummary.aiOptimized) * 100} className="h-2" />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Food & Dining</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(recapData.budgetBreakdown.food.recommended)}</div>
                    {recapData.budgetBreakdown.food.savings > 0 && (
                      <div className="text-sm text-green-600">Save {formatCurrency(recapData.budgetBreakdown.food.savings)}</div>
                    )}
                  </div>
                </div>
                <Progress value={(recapData.budgetBreakdown.food.recommended / recapData.budgetSummary.aiOptimized) * 100} className="h-2" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Activities</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(recapData.budgetBreakdown.activities.recommended)}</div>
                    {recapData.budgetBreakdown.activities.savings > 0 && (
                      <div className="text-sm text-green-600">Save {formatCurrency(recapData.budgetBreakdown.activities.savings)}</div>
                    )}
                  </div>
                </div>
                <Progress value={(recapData.budgetBreakdown.activities.recommended / recapData.budgetSummary.aiOptimized) * 100} className="h-2" />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Miscellaneous</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(recapData.budgetBreakdown.miscellaneous.recommended)}</div>
                    {recapData.budgetBreakdown.miscellaneous.savings > 0 && (
                      <div className="text-sm text-green-600">Save {formatCurrency(recapData.budgetBreakdown.miscellaneous.savings)}</div>
                    )}
                  </div>
                </div>
                <Progress value={(recapData.budgetBreakdown.miscellaneous.recommended / recapData.budgetSummary.aiOptimized) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Accommodation Details */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Hotel className="h-6 w-6" />
              Accommodation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">{recapData.accommodationDetails.hotelName}</div>
                <div className="text-sm text-blue-600">Selected Hotel</div>
              </div>
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-900">{formatCurrency(recapData.accommodationDetails.nightlyRate)}</div>
                <div className="text-sm text-green-600">Nightly Rate</div>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-900">{recapData.accommodationDetails.totalNights}</div>
                <div className="text-sm text-purple-600">Total Nights</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-900">{formatCurrency(recapData.accommodationDetails.totalCost)}</div>
                <div className="text-sm text-orange-600">Total Cost</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {recapData.accommodationDetails.type} Category
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 6. Transportation Details */}
        <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Plane className="h-6 w-6" />
              Transportation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Car className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-900">{recapData.transportationDetails.option}</div>
                <div className="text-sm text-green-600">Selected Option</div>
              </div>
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">{formatCurrency(recapData.transportationDetails.totalCost)}</div>
                <div className="text-sm text-blue-600">Total Cost</div>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-purple-900">{recapData.transportationDetails.distribution}</div>
                <div className="text-sm text-purple-600">Distribution</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {recapData.transportationDetails.type}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Continue to Next Step Button */}
        <div className="mb-6 text-center">
          <Button
            onClick={handleSaveAndContinue}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-10 py-5 text-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <CheckCircle className="h-6 w-6" />
            <span className="tracking-wide">Continue to Next Step</span>
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>

        {/* 7. Daily Itinerary Recap */}
        <Card className="mb-8 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Clock className="h-6 w-6" />
              Daily Itinerary Recap
            </CardTitle>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {recapData.tripOverview.duration} days, {recapData.tripOverview.totalDestinations} destinations
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  className="text-indigo-600 border-indigo-200"
                >
                  {showFullDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recapData.dailyItinerary.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Day {day.day} - {day.date}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {day.destinations.length} destinations • Estimated: {formatCurrency(day.dailyCost)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {day.destinations.map((city, cityIndex) => (
                        <Badge key={cityIndex} variant="secondary" className="bg-indigo-50 text-indigo-700">
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFullDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {getCategoryIcon(activity.category)}
                              <div>
                                <div className="font-medium">{activity.name}</div>
                                <div className="text-sm text-gray-600">{activity.category}</div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div>{activity.time}</div>
                              <div className="text-gray-600">{activity.duration}</div>
                              <div className="font-medium">IDR {activity.cost.toLocaleString()}</div>
                              <div className="text-yellow-600">⭐ {activity.rating}</div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 8. User Configurations Recap */}
        <Card className="mb-8 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Settings className="h-6 w-6" />
              User Configurations Recap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-900">{formatCurrency(recapData.userConfigurations.totalBudget)}</div>
                <div className="text-sm text-green-600">Total Budget</div>
              </div>
              <div className="text-center">
                <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">{recapData.userConfigurations.accommodationType}</div>
                <div className="text-sm text-blue-600">Accommodation Type</div>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-900">{recapData.userConfigurations.startDate ? new Date(recapData.userConfigurations.startDate).toLocaleDateString("id-ID", { month: "short", day: "numeric" }) : "TBA"}</div>
                <div className="text-sm text-purple-600">Start Date</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-900">{recapData.userConfigurations.duration}</div>
                <div className="text-sm text-orange-600">Duration (Days)</div>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-red-900">{recapData.userConfigurations.travelers}</div>
                <div className="text-sm text-red-600">Travelers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="space-y-6">
          {/* East Java Itinerary Button */}
          <div className="text-center">
            <Button
              onClick={eastJavaRecapReady ? handleNavigateToEastJavaPlan : handleGenerateEastJavaItinerary}
              disabled={generatingEastJava}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-5 text-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-3 mb-4"
            >
              {generatingEastJava ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : eastJavaRecapReady ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <Sparkles className="h-6 w-6" />
              )}
              <span className="tracking-wide">
                {generatingEastJava ? 'GENERATING EAST JAVA ITINERARY...' : eastJavaRecapReady ? 'CONTINUE TO EAST JAVA PLAN' : 'GENERATE EAST JAVA ITINERARY'}
              </span>
              <ArrowRight className="h-6 w-6" />
            </Button>
            <p className="text-sm text-gray-600 mb-6">
              {eastJavaRecapReady
                ? 'Your East Java itinerary recap is ready! Click to continue to the detailed plan.'
                : 'Generate a customized East Java itinerary using AI-powered algorithms with your preferences'
              }
            </p>
          </div>


          {/* Secondary Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => router.push("/dashboard/preferences/smart-budget")}
              className="bg-gray-500 text-white px-6 py-3 hover:bg-gray-600 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Smart Budget
            </Button>

            <Button
              onClick={handleEditPreferences}
              className="bg-gray-300 text-gray-700 px-6 py-3 hover:bg-gray-400 flex items-center gap-2"
            >
              Edit Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
