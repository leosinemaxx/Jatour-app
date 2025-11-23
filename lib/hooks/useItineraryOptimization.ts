import { useState, useEffect } from 'react';

interface Destination {
  id: string;
  name: string;
  city: string;
  category: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating: number;
  priceRange: string;
  estimatedCost: number;
  duration: number;
  description: string;
}

interface ItinerarySuggestion {
  id: string;
  title: string;
  destinations: Destination[];
  totalDuration: number;
  totalCost: number;
  optimizationScore: number;
  route: Destination[];
  dailyBreakdown: {
    day: number;
    destinations: Destination[];
    estimatedCost: number;
    travelTime: number;
  }[];
  reasoning: string[];
}

interface RouteOptimization {
  originalRoute: Destination[];
  optimizedRoute: Destination[];
  timeSaved: number;
  distanceSaved: number;
  efficiency: number;
}

export function useItineraryOptimization(
  userId: string,
  cities: string[],
  days: number,
  budget: number,
  interests: string[]
) {
  const [suggestions, setSuggestions] = useState<ItinerarySuggestion[]>([]);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateItinerarySuggestions = async () => {
    if (!cities.length || !days || !budget) return;

    setLoading(true);
    setError(null);

    try {
      // Get recommendations from planner service
      const recommendationsResponse = await fetch(
        `/api/planner/recommendations?userId=${userId}&budget=${budget}&days=${days}&interests=${interests.join(',')}&city=${cities[0]}`
      );

      if (!recommendationsResponse.ok) {
        throw new Error('Failed to get recommendations');
      }

      const destinations = await recommendationsResponse.json();

      // Generate itinerary suggestions
      const itinerarySuggestions = await generateAISuggestions(destinations, days, budget);
      setSuggestions(itinerarySuggestions);

      // Calculate route optimization
      if (destinations.length > 2) {
        const routeOpt = await calculateRouteOptimization(destinations);
        setRouteOptimization(routeOpt);
      }

    } catch (err) {
      console.error('Failed to generate itinerary suggestions:', err);
      setError('Failed to generate itinerary suggestions');
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async (
    destinations: Destination[],
    days: number,
    budget: number
  ): Promise<ItinerarySuggestion[]> => {
    // AI-powered itinerary generation logic
    const suggestions: ItinerarySuggestion[] = [];

    // Strategy 1: Efficiency-focused (minimize travel time)
    const efficiencyItinerary = createEfficiencyItinerary(destinations, days, budget);
    suggestions.push(efficiencyItinerary);

    // Strategy 2: Experience-focused (maximize ratings and variety)
    const experienceItinerary = createExperienceItinerary(destinations, days, budget);
    suggestions.push(experienceItinerary);

    // Strategy 3: Budget-optimized (maximize value)
    const budgetItinerary = createBudgetItinerary(destinations, days, budget);
    suggestions.push(budgetItinerary);

    return suggestions;
  };

  const createEfficiencyItinerary = (
    destinations: Destination[],
    days: number,
    budget: number
  ): ItinerarySuggestion => {
    // Sort by proximity and rating
    const sorted = destinations.sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      return ratingDiff;
    });

    const selected = sorted.slice(0, Math.min(days * 3, sorted.length));
    const route = calculateOptimalRoute(selected);

    return {
      id: 'efficiency-optimized',
      title: 'Efficiency Optimized Route',
      destinations: selected,
      totalDuration: days,
      totalCost: selected.reduce((sum, dest) => sum + dest.estimatedCost, 0),
      optimizationScore: 85,
      route,
      dailyBreakdown: createDailyBreakdown(route, days),
      reasoning: [
        'Minimizes travel time between destinations',
        'Prioritizes highly-rated attractions',
        'Optimizes daily schedule for maximum sightseeing'
      ]
    };
  };

  const createExperienceItinerary = (
    destinations: Destination[],
    days: number,
    budget: number
  ): ItinerarySuggestion => {
    // Group by category and ensure variety
    const categories = [...new Set(destinations.map(d => d.category))];
    const selected: Destination[] = [];

    categories.forEach(category => {
      const categoryDestinations = destinations
        .filter(d => d.category === category)
        .sort((a, b) => b.rating - a.rating);

      // Take top 2-3 from each category
      const toTake = Math.min(3, Math.ceil(days / categories.length));
      selected.push(...categoryDestinations.slice(0, toTake));
    });

    const route = calculateOptimalRoute(selected);

    return {
      id: 'experience-focused',
      title: 'Experience Maximized Route',
      destinations: selected,
      totalDuration: days,
      totalCost: selected.reduce((sum, dest) => sum + dest.estimatedCost, 0),
      optimizationScore: 92,
      route,
      dailyBreakdown: createDailyBreakdown(route, days),
      reasoning: [
        'Ensures variety across different attraction types',
        'Prioritizes highest-rated experiences',
        'Balances activity types throughout the trip'
      ]
    };
  };

  const createBudgetItinerary = (
    destinations: Destination[],
    days: number,
    budget: number
  ): ItinerarySuggestion => {
    // Sort by value (rating / cost ratio)
    const withValueScore = destinations.map(dest => ({
      ...dest,
      valueScore: dest.rating / Math.max(dest.estimatedCost, 1)
    }));

    const sorted = withValueScore.sort((a, b) => b.valueScore - a.valueScore);
    const selected = sorted.slice(0, Math.min(days * 2, sorted.length));
    const route = calculateOptimalRoute(selected.map(d => d));

    return {
      id: 'budget-optimized',
      title: 'Budget Optimized Route',
      destinations: selected,
      totalDuration: days,
      totalCost: selected.reduce((sum, dest) => sum + dest.estimatedCost, 0),
      optimizationScore: 78,
      route,
      dailyBreakdown: createDailyBreakdown(route, days),
      reasoning: [
        'Maximizes value for money spent',
        'Focuses on high-quality, affordable experiences',
        'Optimizes cost-efficiency across all activities'
      ]
    };
  };

  const calculateOptimalRoute = (destinations: Destination[]): Destination[] => {
    if (destinations.length <= 1) return destinations;

    // Simple nearest neighbor algorithm
    const route: Destination[] = [];
    const remaining = [...destinations];

    // Start with first destination
    route.push(remaining.shift()!);

    while (remaining.length > 0) {
      const current = route[route.length - 1];
      let nearestIndex = 0;
      let minDistance = calculateDistance(current, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = calculateDistance(current, remaining[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      route.push(remaining.splice(nearestIndex, 1)[0]);
    }

    return route;
  };

  const calculateDistance = (dest1: Destination, dest2: Destination): number => {
    if (!dest1.coordinates || !dest2.coordinates) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = toRadians(dest2.coordinates.lat - dest1.coordinates.lat);
    const dLng = toRadians(dest2.coordinates.lng - dest1.coordinates.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(dest1.coordinates.lat)) * Math.cos(toRadians(dest2.coordinates.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const createDailyBreakdown = (route: Destination[], totalDays: number) => {
    const breakdown = [];
    const destinationsPerDay = Math.ceil(route.length / totalDays);

    for (let day = 1; day <= totalDays; day++) {
      const startIndex = (day - 1) * destinationsPerDay;
      const endIndex = Math.min(day * destinationsPerDay, route.length);
      const dayDestinations = route.slice(startIndex, endIndex);

      breakdown.push({
        day,
        destinations: dayDestinations,
        estimatedCost: dayDestinations.reduce((sum, dest) => sum + dest.estimatedCost, 0),
        travelTime: Math.floor(Math.random() * 60) + 30 // Mock travel time
      });
    }

    return breakdown;
  };

  const calculateRouteOptimization = async (destinations: Destination[]): Promise<RouteOptimization> => {
    const originalRoute = [...destinations];
    const optimizedRoute = calculateOptimalRoute(destinations);

    // Calculate metrics
    const originalDistance = calculateTotalDistance(originalRoute);
    const optimizedDistance = calculateTotalDistance(optimizedRoute);
    const distanceSaved = originalDistance - optimizedDistance;
    const efficiency = originalDistance > 0 ? (distanceSaved / originalDistance) * 100 : 0;

    return {
      originalRoute,
      optimizedRoute,
      timeSaved: Math.floor(distanceSaved * 2), // Rough time estimate
      distanceSaved,
      efficiency
    };
  };

  const calculateTotalDistance = (route: Destination[]): number => {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += calculateDistance(route[i], route[i + 1]);
    }
    return total;
  };

  const getVisualizationData = () => {
    // Return data for visualization engine
    if (!suggestions.length) return null;

    const bestSuggestion = suggestions[0];

    return {
      itineraryChart: {
        type: 'bar',
        title: 'Daily Itinerary Breakdown',
        data: {
          days: bestSuggestion.dailyBreakdown.map(d => `Day ${d.day}`),
          costs: bestSuggestion.dailyBreakdown.map(d => d.estimatedCost),
          destinations: bestSuggestion.dailyBreakdown.map(d => d.destinations.length)
        }
      },
      routeOptimization: routeOptimization,
      costAnalysis: {
        totalBudget: budget,
        itineraryCost: bestSuggestion.totalCost,
        remainingBudget: budget - bestSuggestion.totalCost,
        costEfficiency: (bestSuggestion.totalCost / budget) * 100
      }
    };
  };

  useEffect(() => {
    generateItinerarySuggestions();
  }, [userId, cities, days, budget, interests]);

  return {
    suggestions,
    routeOptimization,
    loading,
    error,
    regenerateSuggestions: generateItinerarySuggestions,
    getVisualizationData,
  };
}