"use client";

import { useState, useEffect } from "react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";

// Force dynamic rendering to avoid SSR issues with client-side components
export const dynamic = 'force-dynamic';
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, DollarSign, Lightbulb, Zap, Award, Target, Eye, RefreshCw, BarChart3, Users, Calendar, MapPin, AlertTriangle, Star, Building, Car, Shield, User, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { budgetEngine, SmartBudgetRecommendation } from "@/lib/ml/intelligent-budget-engine";
import { mlEngine } from "@/lib/ml/ml-engine";
import { useAccommodations } from "@/lib/hooks/useAccommodations";
import { useDestinations } from "@/lib/hooks/useDestinations";
import { useRealTimeExpenses } from "@/lib/hooks/useRealTimeExpenses";
import { usePriceComparison } from "@/lib/hooks/usePriceComparison";
import { useDealMatching } from "@/lib/hooks/useDealMatching";
import { useItineraryOptimization } from "@/lib/hooks/useItineraryOptimization";
import { useGoalTracking } from "@/lib/hooks/useGoalTracking";
import { useBudgetAlignedPlanning } from "@/lib/hooks/useBudgetAlignedPlanning";
import { useAdvancedAnalytics } from "@/lib/hooks/useAdvancedAnalytics";
import NavbarDash from "@/app/components/navbar-dash";

// Dynamic import for DealMapComponent to avoid SSR issues with react-leaflet
const DealMapComponent = dynamicImport(
  () => import("@/components/maps/DealMapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
);

interface MLInsights {
  priceSensitivity: number;
  activityPreference: number;
  riskTolerance: number;
  spontaneityScore: number;
  socialPreference: number;
}

interface HotelOption {
  id: string;
  name: string;
  category: 'budget' | 'moderate' | 'luxury';
  pricePerNight: number;
  amenities: string[];
  rating: number;
  image?: string;
  location: string;
}

interface TransportationOption {
  id: string;
  type: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  carbonOffset?: number;
  pros?: string[];
  cons?: string[];
  bestFor?: string;
}

interface AccommodationSelection {
  hotel: HotelOption | null;
  transportation: TransportationOption | null;
  totalCost: number;
}

export default function SmartBudgetPage() {
  const router = useRouter();
  const { preferences, updatePreferences } = useSmartItinerary();
  const [formData, setFormData] = useState({
    budget: preferences.budget,
    accommodationType: preferences.accommodationType
  });
  const [mlInsights, setMlInsights] = useState<MLInsights | null>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<SmartBudgetRecommendation | null>(null);
  const [accommodationSelection, setAccommodationSelection] = useState<AccommodationSelection>({
    hotel: null,
    transportation: null,
    totalCost: 0
  });
  const [showAccommodationOptions, setShowAccommodationOptions] = useState(false);
  const [showTransportationOptions, setShowTransportationOptions] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use real accommodation data from database
  const { accommodations, loading: accommodationsLoading } = useAccommodations(
    preferences.cities[0],
    formData.accommodationType
  );

  // Real-time expense tracking integration
  const {
    expenses,
    analytics,
    burnRate,
    isConnected,
    lastUpdate,
    spendingVelocity,
    refreshBurnRate
  } = useRealTimeExpenses('cmi8s2zdr001pdglth74vgyyu', 'demo-budget-001'); // TODO: Use actual user/budget IDs

  // Price comparison integration
  const {
    comparisonData,
    loading: priceLoading,
    error: priceError,
    getBestDeals,
    getSavingsPotential,
    refetch: refetchPrices
  } = usePriceComparison(
    preferences.cities[0] || 'Malang',
    formData.budget,
    formData.accommodationType,
    preferences.travelers
  );

  // Deal matching and maps integration
  const {
    deals,
    notifications,
    loading: dealsLoading,
    error: dealsError,
    lastFetch,
    refreshDeals,
    getTopDeals,
    getFlashDeals,
    getExpiringSoonDeals,
    getTotalSavings,
    getDealsWithCoordinates,
    getUnreadNotifications,
    markNotificationAsRead
  } = useDealMatching(
    'cmi8s2zdr001pdglth74vgyyu',
    preferences.cities[0] || 'Malang',
    formData.budget
  );

  // AI Itinerary optimization integration
  const {
    suggestions: itinerarySuggestions,
    routeOptimization,
    loading: itineraryLoading,
    error: itineraryError,
    regenerateSuggestions,
    getVisualizationData
  } = useItineraryOptimization(
    'cmi8s2zdr001pdglth74vgyyu',
    preferences.cities,
    preferences.days || 3,
    formData.budget,
    preferences.interests || []
  );

  // Goal tracking integration
  const {
    goals,
    activeGoal,
    recommendations: goalRecommendations,
    isConnected: goalsConnected,
    loading: goalsLoading,
    error: goalsError,
    createGoal,
    updateProgress,
    subscribeToGoal,
    getGoalRecommendations,
    getGoalProgressPercentage,
    getGoalBudgetEfficiency,
    getGoalAdaptationSuggestions
  } = useGoalTracking('cmi8s2zdr001pdglth74vgyyu');

  // BaaP (Budget-Aligned Planning) integration
  const {
    optimizedItinerary,
    tacticalSuggestions,
    adherenceGuarantee,
    loading: baapLoading,
    error: baapError,
    optimizeBudgetItinerary,
    getBudgetStatus,
    getTopTacticalSuggestions,
    getSuggestionsByType,
    getSuggestionsByCategory,
    getTotalPotentialSavings,
    applyTacticalSuggestion
  } = useBudgetAlignedPlanning('cmi8s2zdr001pdglth74vgyyu', formData.budget, 'demo-itinerary-001');

  // Advanced Analytics integration
  const {
    insights: analyticsInsights,
    predictiveInsights,
    personalizationProfile,
    loading: analyticsLoading,
    error: analyticsError,
    generateSpendingInsights,
    getTopInsights,
    getInsightsByType,
    getInsightsByTimeHorizon,
    getPersonalizedRecommendations,
    getSpendingEfficiency
  } = useAdvancedAnalytics('cmi8s2zdr001pdglth74vgyyu', formData.budget);

  useEffect(() => {
    setFormData({
      budget: preferences.budget,
      accommodationType: preferences.accommodationType
    });
    
    // Generate dynamic insights when preferences change
    if (preferences.days && preferences.travelers && preferences.cities.length > 0) {
      generateDynamicInsights();
    }
  }, [preferences]);

  // Generate ML-powered insights when budget changes
  useEffect(() => {
    if (formData.budget > 0) {
      generateBudgetAnalysis();
    }
  }, [formData.budget, formData.accommodationType]);

  const generateDynamicInsights = async () => {
    try {
      // Get user profile from ML engine
      const userProfile = mlEngine.getUserProfile('cmi8s2zdr001pdglth74vgyyu');
      const insights = userProfile?.mlInsights || {
        priceSensitivity: 0.6,
        activityPreference: 0.7,
        riskTolerance: 0.5,
        spontaneityScore: 0.4,
        socialPreference: 0.6
      };

      setMlInsights(insights);
    } catch (error) {
      console.error('Failed to generate ML insights:', error);
      // Fallback to basic insights
      setMlInsights({
        priceSensitivity: 0.6,
        activityPreference: 0.7,
        riskTolerance: 0.5,
        spontaneityScore: 0.4,
        socialPreference: 0.6
      });
    }
  };

  const generateBudgetAnalysis = async () => {
    if (!formData.budget || !preferences.days || !preferences.travelers) return;

    setLoading(true);
    
    try {
      const input = {
        userId: 'cmi8s2zdr001pdglth74vgyyu',
        preferences: {
          budget: formData.budget,
          days: preferences.days,
          travelers: preferences.travelers,
          accommodationType: formData.accommodationType,
          cities: preferences.cities,
          interests: preferences.interests || []
        },
        destinations: preferences.preferredSpots.map(spot => ({
          id: spot.toLowerCase().replace(/\s+/g, '-'),
          name: spot,
          location: preferences.cities[0] || 'Multiple Cities',
          category: 'attraction',
          estimatedCost: Math.floor(formData.budget * 0.15 / preferences.preferredSpots.length),
          duration: 3
        }))
      };

      const analysis = budgetEngine.calculateSmartBudget(input);
      setBudgetAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    updatePreferences(updatedData);
  };

  const handleContinue = () => {
    if (!formData.budget) {
      alert("Mohon atur budget perjalanan");
      return;
    }
    router.push("/dashboard/preferences/optimization");
  };

  const handleRefreshInsights = () => {
    if (formData.budget > 0) {
      generateBudgetAnalysis();
    }
  };

  // Use real hotel options from database
  const getHotelOptions = (): HotelOption[] => {
    if (accommodationsLoading) {
      return []; // Return empty while loading
    }

    // Convert real accommodation data to HotelOption format
    return accommodations.map((acc) => {
      // Parse amenities from JSON string or comma-separated list with robust validation
      let amenities: string[] = [];
      try {
        if (acc.amenities) {
          if (Array.isArray(acc.amenities)) {
            // Already an array
            amenities = acc.amenities;
          } else if (typeof acc.amenities === 'string') {
            try {
              // Try to parse as JSON first
              const parsed = JSON.parse(acc.amenities);
              if (Array.isArray(parsed)) {
                amenities = parsed;
              } else {
                // If not an array, split by comma
                amenities = acc.amenities.split(',').map(a => a.trim()).filter(a => a);
              }
            } catch (e) {
              // Fall back to splitting by comma
              amenities = acc.amenities.split(',').map(a => a.trim()).filter(a => a);
            }
          }
        }
      } catch (error) {
        console.warn('Error parsing amenities for accommodation:', acc.id, error);
        amenities = []; // Fallback to empty array
      }

      // Ensure amenities is always an array
      if (!Array.isArray(amenities)) {
        amenities = [];
      }

      // Extract price from priceRange if available, otherwise estimate
      let pricePerNight = 0;
      if (acc.priceRange) {
        // Extract numeric value from "IDR 150,000" format
        const priceMatch = acc.priceRange.match(/IDR\s*([0-9,]+)/);
        if (priceMatch) {
          pricePerNight = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        }
      }

      // Fallback to estimation if no price found
      if (!pricePerNight) {
        const basePrices = {
          budget: 150000,
          moderate: 350000,
          luxury: 800000
        };
        
        const cityMultiplier = preferences.cities.length > 0 ? 
          preferences.cities[0] === 'Jakarta' ? 1.3 :
          preferences.cities[0] === 'Bali' ? 1.2 : 1.0 : 1.0;

        pricePerNight = Math.round(basePrices[acc.category] * cityMultiplier);
      }

      return {
        id: acc.id,
        name: acc.name,
        category: acc.category,
        pricePerNight: pricePerNight,
        amenities: amenities.slice(0, 5), // Show top 5 amenities
        rating: acc.rating || 4.0,
        location: acc.city,
        image: acc.image
      };
    });
  };

  // Generate transportation options with enhanced details
  const generateTransportationOptions = (): TransportationOption[] => {
    const baseTravelers = preferences.travelers || 2;
    
    return [
      {
        id: 'public-transit',
        type: '🚍 Public Transit',
        description: 'Efficient city transportation with buses, trains, and metro. Most budget-friendly option.',
        price: Math.round(50000 * baseTravelers),
        duration: '15-45 min',
        rating: 4.2,
        carbonOffset: 0.9,
        pros: ['Budget-friendly', 'Eco-friendly', 'Extensive coverage'],
        cons: ['May require transfers', 'Fixed schedules', 'Crowded during peak hours'],
        bestFor: 'City exploration on a budget'
      },
      {
        id: 'ride-sharing',
        type: '🚗 Ride Sharing',
        description: 'Convenient door-to-door service with apps like Gojek, Grab, or similar.',
        price: Math.round(150000 * baseTravelers),
        duration: '10-25 min',
        rating: 4.5,
        carbonOffset: 0.6,
        pros: ['Door-to-door service', 'Real-time tracking', 'Multiple vehicle options'],
        cons: ['Price varies by demand', 'Traffic dependent', 'Requires smartphone'],
        bestFor: 'Convenience and flexibility'
      },
      {
        id: 'taxi',
        type: '🚕 Taxi',
        description: 'Traditional taxi service with professional drivers. Reliable and comfortable.',
        price: Math.round(180000 * baseTravelers),
        duration: '10-30 min',
        rating: 4.3,
        carbonOffset: 0.5,
        pros: ['Readily available', 'Professional drivers', 'Fixed rates in some cities'],
        cons: ['More expensive than ride-sharing', 'Cash payment often required'],
        bestFor: 'Reliability and professional service'
      },
      {
        id: 'private-car',
        type: '🚙 Private Car Rental',
        description: 'Full control over your transportation with rented car. Perfect for exploring multiple destinations.',
        price: Math.round(300000 * baseTravelers),
        duration: 'On your schedule',
        rating: 4.7,
        carbonOffset: 0.3,
        pros: ['Complete flexibility', 'Visit remote locations', 'Privacy and comfort'],
        cons: ['Requires driving license', 'Parking fees', 'Fuel costs'],
        bestFor: 'Flexibility and off-the-beaten-path exploration'
      },
      {
        id: 'motorcycle',
        type: '🏍 Motorcycle Rental',
        description: 'Budget-friendly and agile transportation. Perfect for navigating traffic and narrow streets.',
        price: Math.round(75000 * baseTravelers),
        duration: '5-20 min',
        rating: 4.1,
        carbonOffset: 0.8,
        pros: ['Cheapest option', 'Easy parking', 'Fast in traffic'],
        cons: ['Weather dependent', 'Safety concerns', 'Limited luggage space'],
        bestFor: 'Budget travel and traffic navigation'
      },
      {
        id: 'private-driver',
        type: '👨‍✈️ Private Driver',
        description: 'Hire a professional driver for the day. Relax while someone else handles the navigation.',
        price: Math.round(250000 * baseTravelers),
        duration: 'Full day service',
        rating: 4.6,
        carbonOffset: 0.4,
        pros: ['No driving stress', 'Local knowledge', 'Flexible itinerary'],
        cons: ['Most expensive option', 'Requires advance booking', 'Limited to driver availability'],
        bestFor: 'Stress-free travel with local expertise'
      }
    ];
  };

  // Handle hotel selection
  const handleHotelSelect = (hotel: HotelOption) => {
    const newSelection = {
      ...accommodationSelection,
      hotel,
      totalCost: hotel.pricePerNight * (preferences.days || 1) + (accommodationSelection.transportation?.price || 0)
    };
    
    setAccommodationSelection(newSelection);
    setShowAccommodationOptions(false);
    
    // Save to localStorage for insight page integration
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart-budget-accommodation', JSON.stringify(newSelection));
      console.log('💾 Saved accommodation selection to localStorage:', newSelection);
      
      // Dispatch custom event to notify other pages
      const event = new CustomEvent('smart-budget-update', {
        detail: {
          type: 'accommodation',
          selection: newSelection,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
      console.log('🎯 Dispatched smart-budget-update event for accommodation:', newSelection);
    }
    
    // Check budget
    if (newSelection.totalCost > formData.budget) {
      setBudgetWarning(true);
    } else {
      setBudgetWarning(false);
    }
  };

  // Handle transportation selection
  const handleTransportationSelect = (transportation: TransportationOption) => {
    const newSelection = {
      ...accommodationSelection,
      transportation,
      totalCost: (accommodationSelection.hotel?.pricePerNight ? accommodationSelection.hotel.pricePerNight * (preferences.days || 1) : 0) + transportation.price
    };
    
    setAccommodationSelection(newSelection);
    setShowTransportationOptions(false);
    
    // Save to localStorage for insight page integration
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart-budget-transportation', JSON.stringify(newSelection));
      console.log('💾 Saved transportation selection to localStorage:', newSelection);
      
      // Dispatch custom event to notify other pages
      const event = new CustomEvent('smart-budget-update', {
        detail: {
          type: 'transportation',
          selection: newSelection,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
      console.log('🎯 Dispatched smart-budget-update event for transportation:', newSelection);
    }
    
    // Check budget
    if (newSelection.totalCost > formData.budget) {
      setBudgetWarning(true);
    } else {
      setBudgetWarning(false);
    }
  };

  // Handle accommodation type change
  const handleAccommodationTypeChange = (type: string) => {
    const updatedData = { ...formData, accommodationType: type as any };
    setFormData(updatedData);
    updatePreferences(updatedData);
    
    // Clear previous selection when type changes
    setAccommodationSelection({
      hotel: null,
      transportation: null,
      totalCost: 0
    });
    setBudgetWarning(false);
  };

  // Calculate updated budget breakdown with real expense data
  const getUpdatedBudgetBreakdown = () => {
    if (!budgetAnalysis) {
      return null;
    }

    let updatedBreakdown = { ...budgetAnalysis.categoryBreakdown };

    // Include accommodation selections if available
    if (accommodationSelection.hotel && accommodationSelection.transportation) {
      const hotelCost = accommodationSelection.hotel.pricePerNight * (preferences.days || 1);
      const transportationCost = accommodationSelection.transportation.price;

      updatedBreakdown = {
        ...updatedBreakdown,
        accommodation: {
          ...updatedBreakdown.accommodation,
          recommended: hotelCost,
          savings: Math.max(0, updatedBreakdown.accommodation.allocated - hotelCost)
        },
        transportation: {
          ...updatedBreakdown.transportation,
          recommended: transportationCost,
          savings: Math.max(0, updatedBreakdown.transportation.allocated - transportationCost)
        }
      };
    }

    // Adjust for actual expenses if available
    if (analytics && expenses.length > 0) {
      const totalSpent = analytics.totalSpent || 0;
      const remainingBudget = formData.budget - totalSpent;

      // Recalculate allocations based on remaining budget
      const totalAllocated = Object.values(updatedBreakdown).reduce((sum, cat: any) => sum + cat.allocated, 0);
      const adjustmentFactor = Math.max(0, remainingBudget / (formData.budget - totalAllocated));

      // Adjust each category based on remaining budget
      (Object.keys(updatedBreakdown) as Array<keyof typeof updatedBreakdown>).forEach(category => {
        const cat = updatedBreakdown[category];
        cat.allocated = Math.max(0, cat.allocated * adjustmentFactor);
        cat.recommended = Math.min(cat.recommended, cat.allocated);
        cat.savings = Math.max(0, cat.allocated - cat.recommended);
      });
    }

    return updatedBreakdown;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Budget</h1>
          <p className="text-gray-600">Atur budget & optimasi cerdas berbasis AI</p>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span>Advanced Analytics Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Real-time Expense Status */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600">Live Expenses</div>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  IDR {analytics?.totalSpent?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {expenses.length} transactions • {spendingVelocity !== null ? `${spendingVelocity > 0 ? '+' : ''}${spendingVelocity.toFixed(1)}%` : 'N/A'} velocity
                </div>
              </div>

              {/* Burn Rate Analytics */}
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="text-sm font-medium text-gray-600 mb-2">Burn Rate</div>
                <div className="text-2xl font-bold text-orange-600">
                  IDR {burnRate?.currentBurnRate?.toLocaleString() || '0'}/day
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Risk: {burnRate?.riskLevel || 'Unknown'} • {burnRate?.remainingDays || 0} days left
                </div>
              </div>

              {/* Deal Intelligence */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-gray-600 mb-2">Deal Intelligence</div>
                <div className="text-2xl font-bold text-purple-600">
                  {deals.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Active deals • IDR {getTotalSavings().toLocaleString()} savings potential
                </div>
              </div>

              {/* Goal Progress */}
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-gray-600 mb-2">Goal Progress</div>
                <div className="text-2xl font-bold text-green-600">
                  {activeGoal ? `${Math.round(getGoalProgressPercentage(activeGoal))}%` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {activeGoal?.type.replace('_', ' ') || 'No active goal'} • {goalsConnected ? 'Connected' : 'Offline'}
                </div>
              </div>
            </div>

            {/* Advanced Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Budget Adherence */}
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">Budget Adherence</div>
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {adherenceGuarantee}%
                </div>
                <Progress value={adherenceGuarantee} className="h-2 mb-2" />
                <div className="text-xs text-gray-500">
                  95% guarantee • {getTotalPotentialSavings().toLocaleString()} IDR optimization potential
                </div>
              </div>

              {/* Price Comparison Insights */}
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <div className="text-sm font-medium text-gray-600 mb-3">Price Intelligence</div>
                <div className="space-y-2">
                  {comparisonData && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Best deal found</span>
                        <span className="font-medium text-cyan-600">
                          {getSavingsPotential() > 0 ? `${Math.round(getSavingsPotential() * 100)}% savings` : 'Analyzing...'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Markets compared</span>
                        <span className="font-medium">3 platforms</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Real-time pricing • Location-based optimization
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AI Optimization Score */}
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <div className="text-sm font-medium text-gray-600 mb-3">AI Optimization Score</div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {Math.round((
                    (analytics ? 0.2 : 0) +
                    (burnRate ? 0.2 : 0) +
                    (deals.length > 0 ? 0.2 : 0) +
                    (activeGoal ? 0.2 : 0) +
                    (adherenceGuarantee >= 90 ? 0.2 : 0)
                  ) * 100)}%
                </div>
                <div className="text-xs text-gray-500">
                  Integrated systems • Real-time updates • Predictive analytics
                </div>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">Expense Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${goalsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">Goal Management</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${deals.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-gray-600">Deal Engine</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${adherenceGuarantee > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-600">BaaP Engine</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Real-Time Expense Tracking */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-red-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Live Expense Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Spent</span>
                  <span className="font-medium text-red-600">
                    IDR {analytics?.totalSpent?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Daily Average</span>
                  <span className="font-medium">
                    IDR {analytics?.dailyAverage?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Recent Expenses</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
                {lastUpdate && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-orange-800">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Burn Rate Analysis</span>
                </div>
                <Button
                  onClick={refreshBurnRate}
                  disabled={!burnRate}
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600 px-2 py-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {burnRate ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Burn Rate</span>
                    <span className="font-medium text-orange-600">
                      IDR {burnRate.currentBurnRate.toLocaleString()}/day
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Projected Rate</span>
                    <span className="font-medium">
                      IDR {burnRate.projectedBurnRate.toLocaleString()}/day
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining Budget</span>
                    <span className="font-medium">
                      IDR {burnRate.remainingBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Risk Level</span>
                    <Badge
                      variant="secondary"
                      className={`${
                        burnRate.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        burnRate.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                        burnRate.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {burnRate.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                  <div className="text-sm text-gray-500">Loading burn rate...</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Target className="h-5 w-5" />
                <span>Spending Velocity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {spendingVelocity !== null ? `${spendingVelocity > 0 ? '+' : ''}${spendingVelocity.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Weekly Trend</div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Velocity Status</span>
                  <span className={`font-medium ${
                    spendingVelocity === null ? 'text-gray-500' :
                    spendingVelocity > 10 ? 'text-red-600' :
                    spendingVelocity > 5 ? 'text-orange-600' :
                    spendingVelocity < -5 ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {spendingVelocity === null ? 'No Data' :
                     spendingVelocity > 10 ? 'Accelerating 🚀' :
                     spendingVelocity > 5 ? 'Increasing 📈' :
                     spendingVelocity < -5 ? 'Decreasing 📉' :
                     'Stable 📊'}
                  </span>
                </div>
                {burnRate?.recommendations && burnRate.recommendations.length > 0 && (
                  <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-800">
                    💡 {burnRate.recommendations[0]}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-blue-800">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Personalization Insights</span>
                </div>
                <Button
                  onClick={generateDynamicInsights}
                  disabled={loading}
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-600 px-2 py-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {mlInsights ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(mlInsights.activityPreference * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Activity Lover</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(mlInsights.priceSensitivity * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Value Seeker</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(mlInsights.spontaneityScore * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Spontaneous</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(mlInsights.riskTolerance * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Explorer</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center col-span-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                    <div className="text-sm text-gray-500">Generating insights...</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-green-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Budget Optimization</span>
                </div>
                <Button
                  onClick={generateBudgetAnalysis}
                  disabled={loading || !formData.budget}
                  size="sm"
                  className="bg-green-500 text-white hover:bg-green-600 px-2 py-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetAnalysis ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Estimated Budget</span>
                    <span className="font-medium">
                      IDR {formData.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>AI Optimized</span>
                    <span className="font-medium text-green-600">
                      IDR {budgetAnalysis.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Savings Potential</span>
                    <span className="font-medium text-green-600">
                      {Math.round(((formData.budget - budgetAnalysis.totalBudget) / formData.budget) * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Confidence: {(budgetAnalysis.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-center py-4">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent mx-auto mb-2"></div>
                      <div className="text-sm text-gray-500">Analyzing budget...</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Set your budget to see AI optimization
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Budget Breakdown */}
        {budgetAnalysis && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Smart Budget Breakdown</span>
                {analytics && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Adjusted for Real Expenses
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const updatedBreakdown = getUpdatedBudgetBreakdown();
                if (!updatedBreakdown) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Accommodation</span>
                        <span>IDR {updatedBreakdown.accommodation.recommended.toLocaleString()}</span>
                      </div>
                      <Progress value={(updatedBreakdown.accommodation.recommended / budgetAnalysis.totalBudget) * 100} className="h-2" />
                      {updatedBreakdown.accommodation.savings > 0 && (
                        <div className="text-xs text-green-600">
                          Save IDR {updatedBreakdown.accommodation.savings.toLocaleString()} vs. standard
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-medium">
                        <span>Transportation</span>
                        <span>IDR {updatedBreakdown.transportation.recommended.toLocaleString()}</span>
                      </div>
                      <Progress value={(updatedBreakdown.transportation.recommended / budgetAnalysis.totalBudget) * 100} className="h-2" />
                      {updatedBreakdown.transportation.savings > 0 && (
                        <div className="text-xs text-green-600">
                          Save IDR {updatedBreakdown.transportation.savings.toLocaleString()} vs. standard
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-medium">
                        <span>Food & Dining</span>
                        <span>IDR {updatedBreakdown.food.recommended.toLocaleString()}</span>
                      </div>
                      <Progress value={(updatedBreakdown.food.recommended / budgetAnalysis.totalBudget) * 100} className="h-2" />
                      {updatedBreakdown.food.savings > 0 && (
                        <div className="text-xs text-green-600">
                          Save IDR {updatedBreakdown.food.savings.toLocaleString()} vs. standard
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Activities</span>
                        <span>IDR {updatedBreakdown.activities.recommended.toLocaleString()}</span>
                      </div>
                      <Progress value={(updatedBreakdown.activities.recommended / budgetAnalysis.totalBudget) * 100} className="h-2" />
                      {updatedBreakdown.activities.savings > 0 && (
                        <div className="text-xs text-green-600">
                          Save IDR {updatedBreakdown.activities.savings.toLocaleString()} vs. standard
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-medium">
                        <span>Miscellaneous</span>
                        <span>IDR {updatedBreakdown.miscellaneous.recommended.toLocaleString()}</span>
                      </div>
                      <Progress value={(updatedBreakdown.miscellaneous.recommended / budgetAnalysis.totalBudget) * 100} className="h-2" />
                      {updatedBreakdown.miscellaneous.savings > 0 && (
                        <div className="text-xs text-green-600">
                          Save IDR {updatedBreakdown.miscellaneous.savings.toLocaleString()} vs. standard
                        </div>
                      )}

                      {/* Real Expenses Summary */}
                      {analytics && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-2">Real Expenses Tracked</div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Total Spent</span>
                            <span>IDR {analytics.totalSpent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Remaining Budget</span>
                            <span>IDR {(formData.budget - analytics.totalSpent).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Smart Recommendations */}
        {budgetAnalysis && budgetAnalysis.optimizations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Smart Recommendations ({budgetAnalysis.optimizations.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetAnalysis.optimizations.slice(0, 3).map((optimization, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-yellow-50">
                    {optimization.type === 'allocation' && <Zap className="h-5 w-5 text-yellow-600 mt-1" />}
                    {optimization.type === 'timing' && <Calendar className="h-5 w-5 text-yellow-600 mt-1" />}
                    {optimization.type === 'location' && <MapPin className="h-5 w-5 text-yellow-600 mt-1" />}
                    {optimization.type === 'activity' && <Users className="h-5 w-5 text-yellow-600 mt-1" />}
                    <div className="flex-1">
                      <div className="font-medium">{optimization.description}</div>
                      <div className="text-sm text-gray-600">{optimization.category} optimization</div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        optimization.impact === 'high' ? 'bg-red-100 text-red-800' :
                        optimization.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      Save IDR {optimization.potentialSavings.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Expenses & Burn Rate Alerts */}
        {expenses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <span>Recent Expenses ({expenses.length})</span>
                {isConnected && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Live Updates
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Burn Rate Alerts */}
                {burnRate && burnRate.riskLevel !== 'low' && (
                  <div className={`p-4 rounded-lg border ${
                    burnRate.riskLevel === 'critical' ? 'bg-red-50 border-red-200' :
                    burnRate.riskLevel === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        burnRate.riskLevel === 'critical' ? 'text-red-600' :
                        burnRate.riskLevel === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <span className={`font-medium ${
                        burnRate.riskLevel === 'critical' ? 'text-red-800' :
                        burnRate.riskLevel === 'high' ? 'text-orange-800' :
                        'text-yellow-800'
                      }`}>
                        {burnRate.riskLevel === 'critical' ? 'Critical Burn Rate Alert' :
                         burnRate.riskLevel === 'high' ? 'High Burn Rate Warning' :
                         'Moderate Burn Rate Notice'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      Your current spending rate may exhaust your budget by {burnRate.projectedEndDate.toLocaleDateString()}.
                    </div>
                    {burnRate.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="text-sm text-gray-600">• {rec}</div>
                    ))}
                  </div>
                )}

                {/* Recent Expenses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenses.slice(0, 6).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        <div className="text-sm text-gray-600">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          IDR {expense.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {expenses.length > 6 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All Expenses ({expenses.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Comparison & Best Deals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Cross-Platform Price Comparison</span>
              </div>
              <Button
                onClick={refetchPrices}
                disabled={priceLoading}
                size="sm"
                className="bg-green-500 text-white hover:bg-green-600 px-2 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Comparing prices across platforms...</div>
              </div>
            ) : priceError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600 mb-2">Failed to load price comparisons</div>
                <Button onClick={refetchPrices} size="sm" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : comparisonData ? (
              <div className="space-y-6">
                {/* Savings Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-800">Potential Savings</span>
                    <Badge className="bg-green-100 text-green-800">
                      IDR {getSavingsPotential().toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-sm text-green-600">
                    Best deals found across {comparisonData.location} for your budget and preferences
                  </div>
                </div>

                {/* Best Deals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Best Hotel */}
                  {(() => {
                    const bestDeals = getBestDeals();
                    return (
                      <>
                        <div className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Best Hotel Deal</span>
                          </div>
                          {bestDeals?.hotel ? (
                            <div className="space-y-2">
                              <div className="font-medium">{bestDeals.hotel.provider}</div>
                              <div className="text-sm text-gray-600">{bestDeals.hotel.description}</div>
                              <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm">{bestDeals.hotel.rating}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-blue-600">
                                    IDR {bestDeals.hotel.price.toLocaleString()}
                                  </div>
                                  {bestDeals.hotel.originalPrice && (
                                    <div className="text-xs text-gray-500 line-through">
                                      IDR {bestDeals.hotel.originalPrice.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                {bestDeals.hotel.discount && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Save {bestDeals.hotel.discount.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No hotel deals found</div>
                          )}
                        </div>

                        {/* Best Transportation */}
                        <div className="border rounded-lg p-4 bg-green-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Car className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Best Transport Deal</span>
                          </div>
                          {bestDeals?.transportation ? (
                            <div className="space-y-2">
                              <div className="font-medium">{bestDeals.transportation.provider}</div>
                              <div className="text-sm text-gray-600">{bestDeals.transportation.description}</div>
                              <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm">{bestDeals.transportation.rating}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-green-600">
                                    IDR {bestDeals.transportation.price.toLocaleString()}
                                  </div>
                                  {bestDeals.transportation.originalPrice && (
                                    <div className="text-xs text-gray-500 line-through">
                                      IDR {bestDeals.transportation.originalPrice.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                {bestDeals.transportation.discount && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Save {bestDeals.transportation.discount.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No transport deals found</div>
                          )}
                        </div>

                        {/* Best Dining */}
                        <div className="border rounded-lg p-4 bg-orange-50">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-orange-600">🍽️</span>
                            <span className="font-medium text-orange-800">Best Dining Deal</span>
                          </div>
                          {bestDeals?.dining ? (
                            <div className="space-y-2">
                              <div className="font-medium">{bestDeals.dining.provider}</div>
                              <div className="text-sm text-gray-600">{bestDeals.dining.description}</div>
                              <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm">{bestDeals.dining.rating}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-orange-600">
                                    IDR {bestDeals.dining.price.toLocaleString()}
                                  </div>
                                  {bestDeals.dining.originalPrice && (
                                    <div className="text-xs text-gray-500 line-through">
                                      IDR {bestDeals.dining.originalPrice.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                {bestDeals.dining.discount && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Save {bestDeals.dining.discount.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No dining deals found</div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Location-Based Insights */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Location-Based Optimization</span>
                  </div>
                  <div className="text-sm text-purple-600">
                    Deals optimized for {comparisonData.location} using geospatial analysis and relevance scoring.
                    Best options selected based on your budget, preferences, and location proximity.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Set your budget and location to see price comparisons</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Matching & Notifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span>Smart Deal Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={refreshDeals}
                  disabled={dealsLoading}
                  size="sm"
                  className="bg-purple-500 text-white hover:bg-purple-600 px-2 py-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                {getUnreadNotifications().length > 0 && (
                  <Badge variant="destructive" className="bg-red-500">
                    {getUnreadNotifications().length} alerts
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Finding personalized deals...</div>
              </div>
            ) : dealsError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600 mb-2">Failed to load deals</div>
                <Button onClick={refreshDeals} size="sm" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Deal Alerts */}
                {getUnreadNotifications().length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-purple-800">Deal Alerts</h4>
                    {getUnreadNotifications().slice(0, 3).map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-lg border ${
                        notification.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                        notification.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{notification.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {notification.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Save IDR {notification.metadata.potentialSavings.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => markNotificationAsRead(notification.id)}
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deal Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{deals.length}</div>
                    <div className="text-xs text-gray-600">Total Deals</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      IDR {getTotalSavings().toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Potential Savings</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{getFlashDeals().length}</div>
                    <div className="text-xs text-gray-600">Flash Deals</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{getExpiringSoonDeals().length}</div>
                    <div className="text-xs text-gray-600">Expiring Soon</div>
                  </div>
                </div>

                {/* Top Deals */}
                <div>
                  <h4 className="font-medium text-purple-800 mb-3">Top Matching Deals</h4>
                  <div className="space-y-3">
                    {getTopDeals(4).map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{deal.title}</div>
                          <div className="text-xs text-gray-600">{deal.merchantName} • {deal.category}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {deal.discountPercentage}% OFF
                            </Badge>
                            {deal.rating && (
                              <span className="text-xs text-gray-500">⭐ {deal.rating}</span>
                            )}
                            <span className="text-xs text-green-600">
                              Relevance: {deal.relevanceScore}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            IDR {deal.discountedPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 line-through">
                            IDR {deal.originalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deal Map */}
                {getDealsWithCoordinates().length > 0 && (
                  <div>
                    <h4 className="font-medium text-purple-800 mb-3">Deal Locations Map</h4>
                    <div className="h-64 rounded-lg overflow-hidden border">
                      <DealMapComponent
                        deals={deals}
                        center={[-7.2575, 112.7521]} // Surabaya center
                        zoom={12}
                        onDealClick={(deal) => {
                          console.log('Deal clicked:', deal);
                          // Could open deal details modal
                        }}
                        showClusters={true}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {getDealsWithCoordinates().length} deals with location data • Click markers for details
                    </div>
                  </div>
                )}

                {lastFetch && (
                  <div className="text-xs text-gray-500 text-center">
                    Last updated: {lastFetch.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Itinerary Optimization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                <span>AI Itinerary Optimization</span>
              </div>
              <Button
                onClick={regenerateSuggestions}
                disabled={itineraryLoading}
                size="sm"
                className="bg-indigo-500 text-white hover:bg-indigo-600 px-2 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itineraryLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">AI is optimizing your itinerary...</div>
              </div>
            ) : itineraryError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600 mb-2">Failed to generate itinerary suggestions</div>
                <Button onClick={regenerateSuggestions} size="sm" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : itinerarySuggestions.length > 0 ? (
              <div className="space-y-6">
                {/* Route Optimization Summary */}
                {routeOptimization && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium text-indigo-800">Route Optimization Results</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-indigo-600">
                          {routeOptimization.timeSaved} min
                        </div>
                        <div className="text-gray-600">Time Saved</div>
                      </div>
                      <div>
                        <div className="font-medium text-indigo-600">
                          {routeOptimization.distanceSaved.toFixed(1)} km
                        </div>
                        <div className="text-gray-600">Distance Saved</div>
                      </div>
                      <div>
                        <div className="font-medium text-indigo-600">
                          {routeOptimization.efficiency.toFixed(1)}%
                        </div>
                        <div className="text-gray-600">Efficiency</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Itinerary Suggestions */}
                <div>
                  <h4 className="font-medium text-indigo-800 mb-4">AI-Generated Itinerary Options</h4>
                  <div className="space-y-4">
                    {itinerarySuggestions.map((suggestion, index) => (
                      <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                                {suggestion.optimizationScore}% Optimized
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {suggestion.destinations.length} destinations • {suggestion.totalDuration} days •
                              IDR {suggestion.totalCost.toLocaleString()} total
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Select This Route
                          </Button>
                        </div>

                        {/* Daily Breakdown */}
                        <div className="space-y-2">
                          {suggestion.dailyBreakdown.slice(0, 3).map((day) => (
                            <div key={day.day} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-indigo-600">Day {day.day}:</span>
                                <span>{day.destinations.map(d => d.name).join(' → ')}</span>
                              </div>
                              <div className="text-gray-600">
                                IDR {day.estimatedCost.toLocaleString()} • {day.travelTime}min travel
                              </div>
                            </div>
                          ))}
                          {suggestion.dailyBreakdown.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{suggestion.dailyBreakdown.length - 3} more days...
                            </div>
                          )}
                        </div>

                        {/* AI Reasoning */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-medium text-gray-700 mb-1">AI Optimization Strategy:</div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {suggestion.reasoning.map((reason, idx) => (
                              <li key={idx}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visualization Preview */}
                {(() => {
                  const vizData = getVisualizationData();
                  return vizData ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">Itinerary Analytics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-indigo-600">
                            IDR {vizData.costAnalysis.itineraryCost.toLocaleString()}
                          </div>
                          <div className="text-gray-600">Itinerary Cost</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">
                            {vizData.costAnalysis.costEfficiency.toFixed(1)}%
                          </div>
                          <div className="text-gray-600">Budget Efficiency</div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">
                  Set your trip preferences to see AI-generated itinerary optimizations
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Tracking & Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <span>Goal Tracking & Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${goalsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {goalsConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Loading goals...</div>
              </div>
            ) : goalsError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600 mb-2">Failed to load goals</div>
                <Button onClick={() => window.location.reload()} size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Goal Display */}
                {activeGoal ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-emerald-800">{activeGoal.title}</h4>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            {Math.round(getGoalProgressPercentage(activeGoal))}% Complete
                          </Badge>
                        </div>
                        <div className="text-sm text-emerald-600">{activeGoal.description}</div>
                      </div>
                      <Button
                        onClick={() => subscribeToGoal(activeGoal.id)}
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-300"
                      >
                        Track Progress
                      </Button>
                    </div>

                    {/* Progress Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600">
                          IDR {activeGoal.progress.currentBudget.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Spent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600">
                          {activeGoal.progress.activitiesCompleted}
                        </div>
                        <div className="text-xs text-gray-600">Activities</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600">
                          {activeGoal.progress.averageRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">Avg Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600">
                          {Math.round(getGoalBudgetEfficiency(activeGoal))}%
                        </div>
                        <div className="text-xs text-gray-600">Efficiency</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>{Math.round(getGoalProgressPercentage(activeGoal))}%</span>
                      </div>
                      <Progress value={getGoalProgressPercentage(activeGoal)} className="h-2" />
                    </div>

                    {/* Adaptation Suggestions */}
                    {getGoalAdaptationSuggestions(activeGoal).length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="text-sm font-medium text-yellow-800 mb-2">💡 Smart Suggestions:</div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {getGoalAdaptationSuggestions(activeGoal).map((suggestion, idx) => (
                            <li key={idx}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm text-gray-500 mb-4">No active goals set</div>
                    <Button
                      onClick={getGoalRecommendations}
                      className="bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      Get Goal Recommendations
                    </Button>
                  </div>
                )}

                {/* Goal Recommendations */}
                {goalRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-emerald-800 mb-3">Recommended Goals</h4>
                    <div className="space-y-3">
                      {goalRecommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{rec.title}</h5>
                              <div className="text-sm text-gray-600">{rec.description}</div>
                            </div>
                            <Button
                              onClick={() => createGoal(rec.type)}
                              size="sm"
                              className="bg-emerald-500 text-white hover:bg-emerald-600"
                            >
                              Set Goal
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Budget: IDR {rec.estimatedBudget.toLocaleString()}</span>
                            <span>Rating: {rec.expectedRating.toFixed(1)}⭐</span>
                            <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {rec.reasoning[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goal History */}
                {goals.length > 1 && (
                  <div>
                    <h4 className="font-medium text-emerald-800 mb-3">Goal History</h4>
                    <div className="space-y-2">
                      {goals.filter(g => g.id !== activeGoal?.id).slice(0, 3).map((goal) => (
                        <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{goal.title}</div>
                            <div className="text-xs text-gray-600">
                              {Math.round(getGoalProgressPercentage(goal))}% complete •
                              Status: {goal.status}
                            </div>
                          </div>
                          <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                            {goal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BaaP - Budget-Aligned Planning */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Budget-Aligned Planning (BaaP)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${
                  adherenceGuarantee >= 95 ? 'bg-green-100 text-green-800' :
                  adherenceGuarantee >= 90 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {adherenceGuarantee}% Guarantee
                </Badge>
                <Button
                  onClick={() => optimizeBudgetItinerary(
                    {
                      totalBudget: formData.budget,
                      flexibilityLevel: 'moderate',
                      categoryLimits: {
                        accommodation: formData.budget * 0.4,
                        transportation: formData.budget * 0.2,
                        food: formData.budget * 0.2,
                        activities: formData.budget * 0.15,
                        miscellaneous: formData.budget * 0.05
                      }
                    },
                    {
                      priorityCategories: preferences.interests || ['activities'],
                      costOptimizationGoals: ['maximize_value'],
                      preferredTransportation: ['public_transport', 'ride_sharing']
                    },
                    {
                      primary: 'cost_minimization',
                      constraints: {
                        avoidHighCostOptions: true,
                        preferLocalExperiences: true
                      }
                    }
                  )}
                  disabled={baapLoading}
                  size="sm"
                  className="bg-green-500 text-white hover:bg-green-600 px-2 py-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {baapLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Optimizing budget alignment...</div>
              </div>
            ) : baapError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600 mb-2">Failed to optimize budget planning</div>
                <Button onClick={() => window.location.reload()} size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            ) : optimizedItinerary ? (
              <div className="space-y-6">
                {/* Adherence Guarantee Display */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        adherenceGuarantee >= 95 ? 'bg-green-100' :
                        adherenceGuarantee >= 90 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Shield className={`h-6 w-6 ${
                          adherenceGuarantee >= 95 ? 'text-green-600' :
                          adherenceGuarantee >= 90 ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">95% Budget Adherence Guarantee</h3>
                        <p className="text-sm text-gray-600">AI-powered budget optimization with tactical suggestions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${
                        adherenceGuarantee >= 95 ? 'text-green-600' :
                        adherenceGuarantee >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {adherenceGuarantee}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence Level</div>
                    </div>
                  </div>

                  {/* Budget Status */}
                  {(() => {
                    const budgetStatus = getBudgetStatus();
                    return budgetStatus ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-green-600">
                            IDR {budgetStatus.savings.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Potential Savings</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-blue-600">
                            {budgetStatus.savingsPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Savings Rate</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-purple-600">
                            {budgetStatus.budgetUtilization.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Budget Used</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className={`text-lg font-bold ${
                            budgetStatus.riskLevel === 'low' ? 'text-green-600' :
                            budgetStatus.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {budgetStatus.riskLevel.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600">Risk Level</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Tactical Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-green-800">Tactical Suggestions</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {getTotalPotentialSavings().toLocaleString()} IDR savings potential
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {getTopTacticalSuggestions(5).map((suggestion) => (
                      <div key={suggestion.id} className={`p-4 rounded-lg border ${
                        suggestion.priority === 'critical' ? 'bg-red-50 border-red-200' :
                        suggestion.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                        suggestion.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge variant="secondary" className={`text-xs ${
                                suggestion.implementationEffort === 'easy' ? 'bg-green-100 text-green-800' :
                                suggestion.implementationEffort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {suggestion.implementationEffort}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                          </div>
                          <Button
                            onClick={() => applyTacticalSuggestion(suggestion.id)}
                            size="sm"
                            className="bg-green-500 text-white hover:bg-green-600"
                          >
                            Apply
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4">
                            <span>💰 Save IDR {suggestion.potentialSavings.toLocaleString()}</span>
                            <span>⏱️ {suggestion.timeToImplement}</span>
                            <span>🎯 {Math.round(suggestion.successProbability * 100)}% success</span>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {suggestion.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tacticalSuggestions.length > 5 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" size="sm">
                        View All {tacticalSuggestions.length} Suggestions
                      </Button>
                    </div>
                  )}
                </div>

                {/* Optimization Insights */}
                {optimizedItinerary.mlInsights && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">AI Optimization Insights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(optimizedItinerary.mlInsights.budgetAlignmentScore * 100)}%
                        </div>
                        <div className="text-gray-600">Budget Alignment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.round(optimizedItinerary.mlInsights.valueForMoneyScore * 100)}%
                        </div>
                        <div className="text-gray-600">Value for Money</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {optimizedItinerary.optimizationDetails.appliedOptimizations.length}
                        </div>
                        <div className="text-gray-600">Optimizations Applied</div>
                      </div>
                    </div>

                    {optimizedItinerary.mlInsights.riskAssessment.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm font-medium text-yellow-800 mb-2">⚠️ Risk Considerations:</div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {optimizedItinerary.mlInsights.riskAssessment.map((risk, idx) => (
                            <li key={idx}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500 mb-4">
                  Optimize your budget with AI-powered planning and 95% adherence guarantee
                </div>
                <Button
                  onClick={() => optimizeBudgetItinerary(
                    {
                      totalBudget: formData.budget,
                      flexibilityLevel: 'moderate'
                    },
                    {
                      priorityCategories: ['activities'],
                      costOptimizationGoals: ['maximize_value'],
                      preferredTransportation: ['public_transport']
                    },
                    {
                      primary: 'cost_minimization',
                      constraints: { avoidHighCostOptions: true }
                    }
                  )}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  Start Budget Optimization
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Analytics & Personalization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Advanced Analytics & Personalization</span>
              </div>
              <Button
                onClick={() => generateSpendingInsights('month', 'previous_period')}
                disabled={analyticsLoading}
                size="sm"
                className="bg-purple-500 text-white hover:bg-purple-600 px-2 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Analyzing spending patterns...</div>
              </div>
            ) : analyticsError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600 mb-2">Failed to generate advanced analytics</div>
                <Button onClick={() => generateSpendingInsights('month', 'previous_period')} size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personalization Profile */}
                {personalizationProfile && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-purple-600" />
                      <h4 className="font-medium text-purple-800">Your Travel Personality</h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-600 capitalize">
                          {personalizationProfile.spendingPersonality.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-600">Spending Style</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-600 capitalize">
                          {personalizationProfile.activityLevel} Activity
                        </div>
                        <div className="text-xs text-gray-600">Energy Level</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-600 capitalize">
                          {personalizationProfile.planningStyle} Planning
                        </div>
                        <div className="text-xs text-gray-600">Planning Style</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Preferred Categories:</div>
                      <div className="flex flex-wrap gap-1">
                        {personalizationProfile.preferredCategories.map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-1">Personalized Recommendations:</div>
                      <ul className="space-y-1">
                        {getPersonalizedRecommendations().slice(0, 2).map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Spending Efficiency Score */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-green-800">Spending Efficiency Score</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(getSpendingEfficiency())}%
                    </div>
                  </div>
                  <Progress value={getSpendingEfficiency()} className="h-2 mb-2" />
                  <div className="text-xs text-gray-600">
                    How well your spending aligns with your travel personality and preferences
                  </div>
                </div>

                {/* Predictive Insights */}
                {predictiveInsights.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-purple-800">Predictive Insights</h4>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {predictiveInsights.length} insights
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {getTopInsights(4).map((insight, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          insight.impact === 'high' ? 'bg-red-50 border-red-200' :
                          insight.impact === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900">{insight.title}</h5>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {insight.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary" className={`text-xs ${
                                  insight.timeHorizon === 'immediate' ? 'bg-red-100 text-red-800' :
                                  insight.timeHorizon === 'short_term' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {insight.timeHorizon.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {Math.round(insight.confidence * 100)}% confidence
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {insight.impact} impact
                              </div>
                            </div>
                          </div>

                          {insight.recommendation && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-sm font-medium text-gray-700">💡 Recommendation:</div>
                              <div className="text-sm text-gray-600 mt-1">{insight.recommendation}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {predictiveInsights.length > 4 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" size="sm">
                          View All {predictiveInsights.length} Insights
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Spending Trends & Comparisons */}
                {analyticsInsights && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Spending Analysis</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Trend Analysis */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Spending Trend</div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            analyticsInsights.trends.spendingTrend === 'increasing' ? 'bg-red-100 text-red-800' :
                            analyticsInsights.trends.spendingTrend === 'decreasing' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {analyticsInsights.trends.spendingTrend.toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-600">
                            {analyticsInsights.trends.trendPercentage > 0 ? '+' : ''}
                            {analyticsInsights.trends.trendPercentage.toFixed(1)}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          {Object.entries(analyticsInsights.trends.categoryTrends).map(([category, trend]) => (
                            <div key={category} className="flex justify-between text-xs">
                              <span className="capitalize">{category}:</span>
                              <span className={`font-medium ${
                                trend === 'increasing' ? 'text-red-600' :
                                trend === 'decreasing' ? 'text-green-600' :
                                'text-blue-600'
                              }`}>
                                {trend}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Savings Opportunities */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Savings Opportunities</div>
                        <div className="space-y-2">
                          {analyticsInsights.savingsTips.slice(0, 3).map((tip, index) => (
                            <div key={index} className="text-xs">
                              <div className="font-medium text-green-600">
                                Save IDR {tip.potentialSavings.toLocaleString()} in {tip.category}
                              </div>
                              <div className="text-gray-600">{tip.tip}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Integration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Payment Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Payment Methods Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🇮🇩</div>
                  <div className="font-medium text-gray-900">QRIS</div>
                  <div className="text-sm text-gray-600">Unified QR</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🏦</div>
                  <div className="font-medium text-gray-900">BCA</div>
                  <div className="text-sm text-gray-600">Bank Central Asia</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🏦</div>
                  <div className="font-medium text-gray-900">Mandiri</div>
                  <div className="text-sm text-gray-600">Bank Mandiri</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🟢</div>
                  <div className="font-medium text-gray-900">GoPay</div>
                  <div className="text-sm text-gray-600">Gojek Wallet</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🟣</div>
                  <div className="font-medium text-gray-900">OVO</div>
                  <div className="text-sm text-gray-600">OVO Wallet</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🔵</div>
                  <div className="font-medium text-gray-900">DANA</div>
                  <div className="text-sm text-gray-600">DANA Wallet</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-medium text-gray-900">Tunai</div>
                  <div className="text-sm text-gray-600">Cash Payment</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">💳</div>
                  <div className="font-medium text-gray-900">Credit Card</div>
                  <div className="text-sm text-gray-600">Visa/Mastercard</div>
                  <div className="text-xs text-green-600 mt-1">✓ Available</div>
                </div>
              </div>

              {/* Payment Planning Integration */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Smart Payment Planning</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Payment Schedule Recommendations</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium">Accommodation Pre-payment</div>
                          <div className="text-sm text-gray-600">Save 15-20% with advance booking</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">IDR {Math.round(formData.budget * 0.4).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">40% of budget</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium">Activity Bookings</div>
                          <div className="text-sm text-gray-600">Secure popular experiences</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">IDR {Math.round(formData.budget * 0.15).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">15% of budget</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium">Daily Expenses Buffer</div>
                          <div className="text-sm text-gray-600">Keep flexible for incidentals</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">IDR {Math.round(formData.budget * 0.45).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">45% of budget</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Payment Method Benefits</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="font-medium text-green-800">QRIS - Instant & Secure</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Unified QR code accepted by all major e-wallets. Instant confirmation, no fees.
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="font-medium text-blue-800">Bank Transfer - Reliable</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Direct bank transfers with BCA and Mandiri. Secure, traceable payments.
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div className="font-medium text-purple-800">E-Wallets - Convenient</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          GoPay, OVO, DANA integration. Quick payments with cashback rewards.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Security & Features */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Payment Security & Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Fraud protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Instant confirmations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>24/7 support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Multi-currency support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Refund protection</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Accommodation Selection Card */}
          <Card className="md:col-span-1">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Building className="h-5 w-5" />
                <span>Akomodasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipe Akomodasi
                </label>
                <select
                  value={formData.accommodationType}
                  onChange={(e) => handleAccommodationTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="budget">Budget</option>
                  <option value="moderate">Moderate</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Hotel Selection Button */}
              <div className="space-y-2">
                <Button
                  onClick={() => setShowAccommodationOptions(!showAccommodationOptions)}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 text-left"
                  disabled={!formData.accommodationType}
                >
                  <div className="flex justify-between items-center">
                    <span>{accommodationSelection.hotel ? accommodationSelection.hotel.name : 'Pilih Hotel'}</span>
                    <span>▼</span>
                  </div>
                  {accommodationSelection.hotel?.pricePerNight && (
                    <div className="text-xs text-gray-500 mt-1">
                      IDR {accommodationSelection.hotel.pricePerNight.toLocaleString()} / malam
                    </div>
                  )}
                </Button>
                
                {/* Test Button for Debugging */}
                <Button
                  onClick={async () => {
                    console.log('🔧 Testing API call directly...');
                    setShowAccommodationOptions(true);
                    
                    // Test the API directly
                    const city = preferences.cities[0] || 'Malang';
                    const category = formData.accommodationType;
                    
                    try {
                      console.log('🔍 Testing API with parameters:', { city, category });
                      const response = await fetch(`/api/accommodations/city/${city}/category/${category}`);
                      const data = await response.json();
                      
                      console.log('📊 API Response:', {
                        status: response.status,
                        dataLength: Array.isArray(data) ? data.length : 'Not an array',
                        data: data
                      });
                      
                      if (response.ok && Array.isArray(data)) {
                        console.log('✅ API working! Found', data.length, 'accommodations');
                        // Update the accommodations state
                        // Note: This is just for testing, won't persist
                      } else {
                        console.log('❌ API not working properly');
                      }
                    } catch (error) {
                      console.error('🚨 API Test Error:', error);
                    }
                  }}
                  className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 text-xs"
                  disabled={!formData.accommodationType}
                >
                  🔧 Test API Call (Debug)
                </Button>
              </div>

              {/* Selected Hotel Info */}
              {accommodationSelection.hotel && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-medium">✓ Terpilih:</span>
                    <span className="font-medium text-gray-900">{accommodationSelection.hotel.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>Harga: IDR {accommodationSelection.hotel.pricePerNight.toLocaleString()} / malam</div>
                    <div>Rating: {accommodationSelection.hotel.rating}/5.0</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transportation Selection Card */}
          <Card className="md:col-span-1">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Car className="h-5 w-5" />
                <span>Transportasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transportation Selection Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pilih Transportasi
                </label>
                <Button
                  onClick={() => setShowTransportationOptions(!showTransportationOptions)}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 text-left"
                  disabled={!formData.accommodationType}
                >
                  <div className="flex justify-between items-center">
                    <span>{accommodationSelection.transportation ? accommodationSelection.transportation.type : 'Pilih Transportasi'}</span>
                    <span>▼</span>
                  </div>
                  {accommodationSelection.transportation && (
                    <div className="text-xs text-gray-500 mt-1">
                      IDR {accommodationSelection.transportation.price.toLocaleString()}
                    </div>
                  )}
                </Button>
              </div>

              {/* Selected Transportation Info */}
              {accommodationSelection.transportation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-medium">✓ Terpilih:</span>
                    <span className="font-medium text-gray-900">{accommodationSelection.transportation.type}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>Harga: IDR {accommodationSelection.transportation.price.toLocaleString()}</div>
                    <div>Rating: {accommodationSelection.transportation.rating}/5.0</div>
                    {accommodationSelection.transportation.duration && (
                      <div>Estimasi: {accommodationSelection.transportation.duration}</div>
                    )}
                  </div>
                  {accommodationSelection.transportation.carbonOffset && (
                    <div className="text-xs text-green-600 mt-1">
                      🌱 {Math.round(accommodationSelection.transportation.carbonOffset * 100)}% ramah lingkungan
                    </div>
                  )}
                </div>
              )}

              {/* Budget Impact */}
              {accommodationSelection.hotel && accommodationSelection.transportation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-xs text-yellow-800 font-medium mb-1">Total Akomodasi + Transportasi:</div>
                  <div className="text-sm font-bold text-gray-900">
                    IDR {(accommodationSelection.hotel.pricePerNight * (preferences.days || 1) + accommodationSelection.transportation.price).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Configuration Card */}
          <Card className="md:col-span-1">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <DollarSign className="h-5 w-5" />
                <span>Konfigurasi Budget</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total Budget (IDR)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Accommodation Type
                </label>
                <select
                  value={formData.accommodationType}
                  onChange={(e) => handleAccommodationTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="budget">Budget</option>
                  <option value="moderate">Moderate</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Hotel Selection Button */}
              <div className="space-y-2">
                <Button
                  onClick={() => setShowAccommodationOptions(!showAccommodationOptions)}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 text-left"
                  disabled={!formData.accommodationType}
                >
                  <div className="flex justify-between items-center">
                    <span>{accommodationSelection.hotel ? accommodationSelection.hotel.name : 'Pilih Hotel'}</span>
                    <span>▼</span>
                  </div>
                  {accommodationSelection.hotel?.pricePerNight && (
                    <div className="text-xs text-gray-500 mt-1">
                      IDR {accommodationSelection.hotel.pricePerNight.toLocaleString()} / malam
                    </div>
                  )}
                </Button>
                
                {/* Test Button for Debugging */}
                <Button
                  onClick={async () => {
                    console.log('🔧 Testing API call directly...');
                    setShowAccommodationOptions(true);
                    
                    // Test the API directly
                    const city = preferences.cities[0] || 'Malang';
                    const category = formData.accommodationType;
                    
                    try {
                      console.log('🔍 Testing API with parameters:', { city, category });
                      const response = await fetch(`/api/accommodations/city/${city}/category/${category}`);
                      const data = await response.json();
                      
                      console.log('📊 API Response:', {
                        status: response.status,
                        dataLength: Array.isArray(data) ? data.length : 'Not an array',
                        data: data
                      });
                      
                      if (response.ok && Array.isArray(data)) {
                        console.log('✅ API working! Found', data.length, 'accommodations');
                        // Update the accommodations state
                        // Note: This is just for testing, won't persist
                      } else {
                        console.log('❌ API not working properly');
                      }
                    } catch (error) {
                      console.error('🚨 API Test Error:', error);
                    }
                  }}
                  className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 text-xs"
                  disabled={!formData.accommodationType}
                >
                  🔧 Test API Call (Debug)
                </Button>
              </div>

              {/* Transportation Selection Button */}
              <div>
                <Button
                  onClick={() => setShowTransportationOptions(!showTransportationOptions)}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 text-left"
                  disabled={!formData.accommodationType}
                >
                  <div className="flex justify-between items-center">
                    <span>{accommodationSelection.transportation ? accommodationSelection.transportation.type : 'Pilih Transportasi'}</span>
                    <span>▼</span>
                  </div>
                  {accommodationSelection.transportation && (
                    <div className="text-xs text-gray-500 mt-1">
                      IDR {accommodationSelection.transportation.price.toLocaleString()}
                    </div>
                  )}
                </Button>
              </div>

              {/* Budget Warning */}
              {budgetWarning && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Budget Melebihi!</span>
                  </div>
                  <div className="text-sm text-red-600">
                    Total biaya ({accommodationSelection.totalCost.toLocaleString()}) melebihi budget Anda ({formData.budget.toLocaleString()}).
                    <br/>Silakan tambahkan budget atau pilih opsi yang lebih hemat.
                  </div>
                  <Button
                    onClick={() => {
                      setBudgetWarning(false);
                      setShowAccommodationOptions(false);
                      setShowTransportationOptions(false);
                    }}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
                  >
                    Tutup
                  </Button>
                </div>
              )}

              {/* Hotel Options Modal */}
              {showAccommodationOptions && (
                <Card className="absolute z-50 top-full left-0 right-0 max-h-60 border border-gray-300 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-sm">Pilih Hotel ({formData.accommodationType})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-48 overflow-y-auto">
                    {/* Debug Info */}
                    <div className="text-xs text-gray-500 mb-2">
                      Debug: {accommodations.length} accommodations loaded, {accommodationsLoading ? 'loading' : 'ready'}
                      {accommodations.length === 0 && !accommodationsLoading && ' - No data available'}
                    </div>
                    
                    {accommodationsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                        <div className="text-sm text-gray-500">Loading accommodations...</div>
                      </div>
                    ) : accommodations.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-500">No accommodations found for {formData.accommodationType} in {preferences.cities[0] || 'selected city'}</div>
                      </div>
                    ) : (
                      getHotelOptions().map((hotel: any) => (
                        <div
                          key={hotel.id}
                          onClick={() => handleHotelSelect(hotel)}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            accommodationSelection.hotel?.id === hotel.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{hotel.name}</div>
                              <div className="text-sm text-gray-600">
                                {hotel.location}
                                {hotel._source && hotel._source !== 'direct' && (
                                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-1 rounded">
                                    {hotel._source === 'nearby_city' && '📍 Nearby City'}
                                    {hotel._source === 'nearby_city_any_category' && '📍 Nearby City'}
                                    {hotel._source === 'other_cities_same_category' && '📍 Other City'}
                                    {hotel._source === 'any_accommodation' && '📍 Alternative'}
                                  </span>
                                )}
                              </div>
                              {/* Show original city if different */}
                              {hotel._original_city && hotel._original_city !== hotel.city && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Asli: {hotel._original_city} → Rekomendasi: {hotel.city}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                IDR {hotel.pricePerNight.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">per malam</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{hotel.rating}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {hotel.amenities.slice(0, 3).map((amenity: string) => (
                                <span key={amenity} className="bg-gray-100 px-1 rounded text-xs">
                                  {amenity}
                                </span>
                              ))}
                              {hotel.amenities.length > 3 && (
                                <span className="text-gray-500 text-xs">
                                  +{hotel.amenities.length - 3} lagi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Transportation Options Modal */}
              {showTransportationOptions && (
                <Card className="absolute z-50 top-full left-0 right-0 max-h-60 border border-gray-300 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-sm">Pilih Transportasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-48 overflow-y-auto">
                    {generateTransportationOptions().map((transport) => (
                      <div
                        key={transport.id}
                        onClick={() => handleTransportationSelect(transport)}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                          accommodationSelection.transportation?.id === transport.id ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-2xl">{transport.type.split(' ')[0]}</div>
                              <div className="font-semibold text-gray-900">{transport.type.split(' ').slice(1).join(' ')}</div>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">{transport.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-lg">
                              IDR {transport.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{transport.duration}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="font-medium">{transport.rating}</span>
                            <span className="text-gray-500 text-sm">/5.0</span>
                          </div>
                          {transport.carbonOffset && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-green-600 font-medium">
                                🌱 {Math.round(transport.carbonOffset * 100)}% ramah lingkungan
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Best For Badge */}
                        {transport.bestFor && (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Cocok untuk: {transport.bestFor}
                            </span>
                          </div>
                        )}

                        {/* Pros and Cons */}
                        <div className="space-y-2">
                          {transport.pros && transport.pros.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-green-600 mb-1">✓ Kelebihan:</div>
                              <div className="text-xs text-gray-600">
                                {transport.pros.slice(0, 2).map((pro, index) => (
                                  <span key={index}>
                                    {pro}
                                    {index < transport.pros!.length - 1 && ', '}
                                  </span>
                                ))}
                                {transport.pros.length > 2 && (
                                  <span className="text-gray-500"> +{transport.pros.length - 2} lainnya</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {transport.cons && transport.cons.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-red-600 mb-1">⚠ Pertimbangan:</div>
                              <div className="text-xs text-gray-600">
                                {transport.cons.slice(0, 2).map((con, index) => (
                                  <span key={index}>
                                    {con}
                                    {index < transport.cons!.length - 1 && ', '}
                                  </span>
                                ))}
                                {transport.cons.length > 2 && (
                                  <span className="text-gray-500"> +{transport.cons.length - 2} lainnya</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ML Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-medium">Priority Weights</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost Optimization</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Time Efficiency</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Satisfaction</span>
                    <span className="text-sm font-medium">50%</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Recommendations */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-pink-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-600" />
              <span>Personalized Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Based on Your Profile */}
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-indigo-600" />
                  <div className="text-sm font-medium text-indigo-800">For Your Profile</div>
                </div>
                <div className="space-y-2">
                  {personalizationProfile && (
                    <>
                      <div className="text-sm">
                        <span className="font-medium">Next Step:</span> Try our{' '}
                        <button
                          onClick={() => router.push('/dashboard/preferences/optimization')}
                          className="text-indigo-600 hover:underline"
                        >
                          ML Optimization
                        </button>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Explore:</span>{' '}
                        <button
                          onClick={() => router.push('/dashboard/deal-map')}
                          className="text-indigo-600 hover:underline"
                        >
                          Deal Map
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Based on Your Budget */}
              <div className="bg-white p-4 rounded-lg border border-pink-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-pink-600" />
                  <div className="text-sm font-medium text-pink-800">Budget Insights</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Budget Status:</span>{' '}
                    <span className={`font-medium ${
                      (analytics?.totalSpent || 0) / formData.budget > 0.8 ? 'text-red-600' :
                      (analytics?.totalSpent || 0) / formData.budget > 0.6 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {((analytics?.totalSpent || 0) / formData.budget * 100).toFixed(0)}% Used
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Efficiency:</span>{' '}
                    <span className="text-pink-600 font-medium">
                      {Math.round(getSpendingEfficiency())}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Based on Your Goals */}
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium text-green-800">Goal Progress</div>
                </div>
                <div className="space-y-2">
                  {activeGoal ? (
                    <>
                      <div className="text-sm">
                        <span className="font-medium">Current Goal:</span>{' '}
                        <span className="text-green-600">{activeGoal.title}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Progress:</span>{' '}
                        <span className="text-green-600 font-medium">
                          {Math.round(getGoalProgressPercentage(activeGoal))}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Set a goal to get personalized tracking
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Navigation */}
        <div className="space-y-6">
          {/* Main Action Button - Centered and Prominent */}
          <div className="text-center">
            <Button
              onClick={() => router.push("/dashboard/preferences/insight")}
              disabled={!formData.budget}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-10 py-5 text-xl font-bold hover:shadow-2xl transform hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/20"
            >
              <Eye className="h-6 w-6 mr-3" />
              <span className="tracking-wide">PREVIEW ITINERARY SEKARANG</span>
            </Button>
            {!formData.budget && (
              <p className="text-red-500 text-sm mt-2 italic">*Harap atur budget terlebih dahulu</p>
            )}
          </div>

          {/* Quick Navigation Grid */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-center text-gray-800">Continue Your Planning Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => router.push("/dashboard/preferences/logistics")}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Logistics</span>
                </Button>

                <Button
                  onClick={() => router.push("/dashboard/preferences/optimization")}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Zap className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">ML Optimization</span>
                </Button>

                <Button
                  onClick={() => router.push("/dashboard/preferences/insight")}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Insights</span>
                </Button>

                <Button
                  onClick={() => router.push("/dashboard/deal-map")}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300"
                >
                  <MapPin className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium">Deal Map</span>
                </Button>
              </div>

              {/* Additional Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Button
                  onClick={() => router.push("/dashboard/price-comparison")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 hover:bg-cyan-50 hover:border-cyan-300"
                >
                  <TrendingUp className="h-4 w-4 text-cyan-600" />
                  <span className="text-sm">Compare Prices</span>
                </Button>

                <Button
                  onClick={() => router.push("/dashboard/spending-insights")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-300"
                >
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm">Spending Insights</span>
                </Button>

                <Button
                  onClick={() => router.push("/dashboard/plan")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 hover:bg-pink-50 hover:border-pink-300"
                >
                  <Calendar className="h-4 w-4 text-pink-600" />
                  <span className="text-sm">View Full Plan</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary & Next Steps */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Planning Progress Summary</h3>
                <div className="flex justify-center items-center gap-8 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((formData.budget ? 25 : 0) +
                                 (accommodationSelection.hotel ? 25 : 0) +
                                 (accommodationSelection.transportation ? 25 : 0) +
                                 (activeGoal ? 25 : 0))}%
                    </div>
                    <div className="text-sm text-gray-600">Setup Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {adherenceGuarantee}%
                    </div>
                    <div className="text-sm text-gray-600">Budget Guarantee</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {deals.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Deals</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  Your smart budget is optimized with AI-powered insights and real-time tracking
                </div>

                <Button
                  onClick={() => router.push("/dashboard/smart/planning")}
                  className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-3 font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Award className="h-5 w-5 mr-2" />
                  Access Unified Planning Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
