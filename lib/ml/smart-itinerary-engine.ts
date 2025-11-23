 // Smart Itinerary Creation Algorithm for JaTour
// ML-powered itinerary generation with intelligent scheduling and optimization

import { mlEngine, MLRecommendation, UserPreferenceProfile } from './ml-engine';
import { budgetEngine, SmartBudgetRecommendation } from './intelligent-budget-engine';

export interface SmartItineraryInput {
  userId: string;
  preferences: {
    budget: number;
    days: number;
    travelers: number;
    accommodationType: 'budget' | 'moderate' | 'luxury';
    cities: string[];
    interests: string[];
    themes: string[];
    preferredSpots: string[];
    startDate: string;
  };
  availableDestinations: Array<{
    id: string;
    name: string;
    location: string;
    category: string;
    estimatedCost: number;
    duration: number;
    coordinates?: { lat: number; lng: number };
    tags: string[];
    rating: number;
    openingHours?: string;
    bestTimeToVisit?: string;
  }>;
  constraints?: {
    maxDailyTravelTime?: number; // in minutes
    preferredStartTime?: string; // "09:00"
    preferredEndTime?: string; // "18:00"
    mustVisit?: string[]; // destination IDs
    avoidCrowds?: boolean;
    accessibilityRequired?: boolean;
  };
}

export interface SmartItineraryDay {
  day: number;
  date: string;
  destinations: SmartDestination[];
  accommodation?: {
    name: string;
    type: string;
    cost: number;
    location: string;
  };
  transportation?: {
    type: string;
    cost: number;
    route: string;
    duration: number;
  };
  totalCost: number;
  totalTime: number;
  mlConfidence: number;
  optimizationReasons: string[];
}

export interface SmartDestination {
  id: string;
  name: string;
  category: string;
  location: string;
  coordinates: { lat: number; lng: number };
  scheduledTime: string;
  duration: number;
  estimatedCost: number;
  rating: number;
  tags: string[];
  mlScore: number;
  predictedSatisfaction: number;
  crowdLevel?: 'low' | 'medium' | 'high';
  weatherSuitability?: number; // 0-1 scale
  bestTimeToVisit?: string;
  openingHours?: string;
  alternatives?: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
}

export interface SmartItineraryResult {
  itinerary: SmartItineraryDay[];
  totalCost: number;
  totalDuration: number;
  budgetBreakdown: SmartBudgetRecommendation;
  mlInsights: {
    personalizationScore: number;
    predictedUserSatisfaction: number;
    riskFactors: string[];
    recommendations: string[];
  };
  optimization: {
    timeOptimization: number; // percentage
    costOptimization: number; // percentage
    satisfactionOptimization: number; // percentage
    reasoning: string[];
  };
  costVariability: {
    seasonalAdjustments: SeasonalPricing[];
    demandFactors: DemandPricing[];
    currencyRates: CurrencyRate[];
    appliedDiscounts: Discount[];
    realTimeUpdates: RealTimePriceUpdate[];
  };
}

export interface SeasonalPricing {
  destinationId: string;
  season: 'low' | 'shoulder' | 'high' | 'peak';
  multiplier: number;
  reason: string;
}

export interface DemandPricing {
  destinationId: string;
  demandLevel: 'low' | 'medium' | 'high' | 'extreme';
  multiplier: number;
  occupancyRate?: number;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: number;
}

export interface Discount {
  type: 'group' | 'early_bird' | 'loyalty' | 'seasonal' | 'bulk';
  percentage: number;
  applicableTo: string[]; // destination IDs
  conditions: string;
}

export interface RealTimePriceUpdate {
  destinationId: string;
  originalPrice: number;
  currentPrice: number;
  changeReason: string;
  lastUpdated: number;
}

export interface ActivitySchedule {
  id: string;
  name: string;
  category: string;
  timeSlot: {
    start: string;
    end: string;
    duration: number; // in minutes
  };
  dependencies: string[]; // activity IDs that must be completed before this
  variableDuration: boolean;
  minDuration: number;
  maxDuration: number;
  cost: number;
  capacity: number;
  currentBookings: number;
}

export class SmartItineraryEngine {
  private timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  private categoryWeights = {
    'cultural': 1.0,
    'nature': 0.9,
    'adventure': 0.8,
    'food': 0.7,
    'shopping': 0.6,
    'entertainment': 0.5,
    'historical': 1.0,
    'religious': 0.9,
    'beach': 0.8,
    'mountain': 0.7
  };

  // Dynamic optimization state
  private optimizationCache = new Map<string, any>();
  private lastOptimizationTime = 0;
  private optimizationInterval = 300000; // 5 minutes

  createSmartItinerary(input: SmartItineraryInput): SmartItineraryResult {
    const profile = mlEngine.getUserProfile(input.userId);
    
    // Step 1: Get ML-powered destination recommendations
    const recommendedDestinations = this.getMLDestinationRecommendations(input, profile);
    
    // Step 2: Generate budget recommendations
    const budgetRecommendation = budgetEngine.calculateSmartBudget({
      userId: input.userId,
      preferences: input.preferences,
      destinations: recommendedDestinations
    });
    
    // Step 3: Optimize itinerary based on constraints and ML insights
    const optimizedItinerary = this.optimizeItinerarySchedule(
      recommendedDestinations, 
      input, 
      profile, 
      budgetRecommendation
    );
    
    // Step 4: Calculate ML insights and optimization metrics
    const mlInsights = this.calculateMLInsights(optimizedItinerary, profile, input);
    const optimization = this.calculateOptimizationMetrics(optimizedItinerary, input, budgetRecommendation);
    
    // Step 5: Calculate variable costs and totals
    const costVariability = this.calculateCostVariability(optimizedItinerary, input);
    const totalCost = optimizedItinerary.reduce((sum, day) => sum + day.totalCost, 0);
    const totalDuration = optimizedItinerary.reduce((sum, day) => sum + day.totalTime, 0);

    return {
      itinerary: optimizedItinerary,
      totalCost,
      totalDuration,
      budgetBreakdown: budgetRecommendation,
      mlInsights,
      optimization,
      costVariability
    };
  }

  private getMLDestinationRecommendations(input: SmartItineraryInput, profile: UserPreferenceProfile | null): Array<SmartDestination & { mlScore: number }> {
    // Convert destinations to format expected by ML engine
    const availableItems = input.availableDestinations.map(dest => ({
      id: dest.id,
      type: 'destination',
      data: {
        category: dest.category,
        price: dest.estimatedCost,
        rating: dest.rating,
        location: dest.location,
        tags: dest.tags
      }
    }));

    // Get ML recommendations
    const mlRecommendations = mlEngine.generateRecommendations(input.userId, availableItems, input.preferences.days * 4);
    
    // Convert back to destination format and add ML scores
    return mlRecommendations.map(rec => {
      const originalDest = input.availableDestinations.find(d => d.id === rec.itemId)!;
      return {
        ...originalDest,
        mlScore: rec.score,
        predictedSatisfaction: rec.predictedRating
      } as SmartDestination & { mlScore: number };
    }).sort((a, b) => b.mlScore - a.mlScore);
  }

  private optimizeItinerarySchedule(
    destinations: Array<SmartDestination & { mlScore: number }>,
    input: SmartItineraryInput,
    profile: UserPreferenceProfile | null,
    budgetRecommendation: SmartBudgetRecommendation
  ): SmartItineraryDay[] {
    const days: SmartItineraryDay[] = [];
    const constraints = input.constraints || {};

    // Ensure no empty destination arrays - distribute destinations evenly across all days
    const availableDays = input.preferences.days;
    const destinationsPerDay = Math.floor(destinations.length / availableDays);
    const extraDestinations = destinations.length % availableDays;

    let destinationIndex = 0;

    for (let day = 1; day <= input.preferences.days; day++) {
      let dayDestinations: Array<SmartDestination & { mlScore: number }> = [];

      // Calculate how many destinations this day should get
      const baseCount = destinationsPerDay;
      const extraCount = (day <= extraDestinations) ? 1 : 0;
      const countForThisDay = baseCount + extraCount;

      // Get destinations for this day
      dayDestinations = destinations.slice(destinationIndex, destinationIndex + countForThisDay);
      destinationIndex += countForThisDay;

      // Optimize day schedule with fallback for empty days
      const optimizedDay = this.optimizeDaySchedule(dayDestinations, day, input, profile, constraints, destinations);
      days.push(optimizedDay);
    }

    // Optimize for travel between cities if multiple cities
    if (input.preferences.cities.length > 1) {
      this.optimizeInterCityTravel(days, input);
    }

    return days;
  }

  private optimizeDaySchedule(
    destinations: Array<SmartDestination & { mlScore: number }>,
    dayNumber: number,
    input: SmartItineraryInput,
    profile: UserPreferenceProfile | null,
    constraints: any,
    fullDestinations: Array<SmartDestination & { mlScore: number }>
  ): SmartItineraryDay {
    // Sort destinations by ML score and logical flow
    const sortedDestinations = this.sortDestinationsByOptimalFlow(destinations, constraints);

    // Schedule destinations within the day
    const scheduledDestinations = this.scheduleDestinationsInDay(sortedDestinations, dayNumber, input, constraints);

    // If no destinations were scheduled for this day, try to add a fallback destination
    // or ensure the day has some content (this handles cases where distribution logic creates empty days)
    let finalDestinations = scheduledDestinations;
    if (finalDestinations.length === 0 && fullDestinations.length > 0) {
      // If we have destinations but none were scheduled (e.g., time constraints or insufficient destinations),
      // force schedule at least one destination for the day using a random fallback
      const randomIndex = Math.floor(Math.random() * fullDestinations.length);
      const fallbackDest = fullDestinations[randomIndex];
      if (fallbackDest) {
        finalDestinations = [{
          ...fallbackDest,
          scheduledTime: constraints.preferredStartTime || '09:00',
          mlScore: fallbackDest.mlScore,
          predictedSatisfaction: fallbackDest.predictedSatisfaction
        }];
      }
    }

    // Calculate costs and times
    const totalCost = finalDestinations.reduce((sum, dest) => sum + dest.estimatedCost, 0);
    const totalTime = finalDestinations.reduce((sum, dest) => sum + dest.duration, 0);

    // Generate ML insights for the day
    const mlConfidence = this.calculateDayMLConfidence(finalDestinations, profile);
    const optimizationReasons = this.generateDayOptimizationReasons(finalDestinations, profile, constraints);

    return {
      day: dayNumber,
      date: this.calculateDate(input.preferences.startDate, dayNumber - 1),
      destinations: finalDestinations,
      totalCost,
      totalTime,
      mlConfidence,
      optimizationReasons
    };
  }

  private sortDestinationsByOptimalFlow(destinations: Array<SmartDestination & { mlScore: number }>, constraints: any): Array<SmartDestination & { mlScore: number }> {
    // If coordinates are available, sort by geographical proximity
    if (destinations.every(d => d.coordinates)) {
      return this.sortByGeographicProximity(destinations);
    }
    
    // Otherwise, sort by ML score and category diversity
    const categoryCounts = new Map<string, number>();
    
    return destinations.sort((a, b) => {
      // Prioritize ML score
      if (Math.abs(a.mlScore - b.mlScore) > 0.1) {
        return b.mlScore - a.mlScore;
      }
      
      // Then balance categories
      const aCount = categoryCounts.get(a.category) || 0;
      const bCount = categoryCounts.get(b.category) || 0;
      
      if (aCount !== bCount) {
        return aCount - bCount; // Prefer less common categories for diversity
      }
      
      // Finally, by rating
      return b.rating - a.rating;
    });
  }

  private sortByGeographicProximity(destinations: Array<SmartDestination & { mlScore: number }>): Array<SmartDestination & { mlScore: number }> {
    // Simple nearest neighbor algorithm
    if (destinations.length === 0) return destinations;
    
    const sorted = [destinations[0]];
    const remaining = destinations.slice(1);
    
    while (remaining.length > 0) {
      const current = sorted[sorted.length - 1];
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current.coordinates, remaining[0].coordinates);
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(current.coordinates, remaining[i].coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      sorted.push(remaining.splice(nearestIndex, 1)[0]);
    }
    
    return sorted;
  }

  private scheduleDestinationsInDay(
    destinations: Array<SmartDestination & { mlScore: number }>,
    dayNumber: number,
    input: SmartItineraryInput,
    dayConstraints: any
  ): SmartDestination[] {
    const scheduled: SmartDestination[] = [];
    const constraints = input.constraints || {};
    const startTime = constraints.preferredStartTime || '09:00';
    const endTime = constraints.preferredEndTime || '18:00';
    
    let currentTime = this.parseTime(startTime);
    const endTimeMinutes = this.parseTime(endTime);
    
    for (const dest of destinations) {
      // Check if adding this destination would exceed the day limit
      if (currentTime + dest.duration > endTimeMinutes) {
        break;
      }
      
      const scheduledDest = {
        ...dest,
        scheduledTime: this.formatTime(currentTime),
        mlScore: dest.mlScore,
        predictedSatisfaction: dest.predictedSatisfaction
      };
      
      scheduled.push(scheduledDest);
      currentTime += dest.duration + 30; // Add 30 min buffer between activities
    }
    
    return scheduled;
  }

  private optimizeInterCityTravel(days: SmartItineraryDay[], input: SmartItineraryInput): void {
    // Add transportation between cities
    for (let i = 1; i < days.length; i++) {
      const prevCity = this.getPredominantCity(days[i - 1].destinations);
      const currentCity = this.getPredominantCity(days[i].destinations);
      
      if (prevCity !== currentCity) {
        days[i].transportation = {
          type: this.selectOptimalTransport(prevCity, currentCity),
          cost: this.calculateTransportCost(prevCity, currentCity),
          route: `${prevCity} → ${currentCity}`,
          duration: this.calculateTravelDuration(prevCity, currentCity)
        };
      }
    }
  }

  private calculateMLInsights(itinerary: SmartItineraryDay[], profile: UserPreferenceProfile | null, input: SmartItineraryInput) {
    const allDestinations = itinerary.flatMap(day => day.destinations);
    const avgMLScore = allDestinations.reduce((sum, dest) => sum + dest.mlScore, 0) / allDestinations.length;
    const avgSatisfaction = allDestinations.reduce((sum, dest) => sum + dest.predictedSatisfaction, 0) / allDestinations.length;
    
    const personalizationScore = profile ? this.calculatePersonalizationScore(allDestinations, profile) : 0.5;
    
    const riskFactors = this.identifyRiskFactors(itinerary, input);
    const recommendations = this.generatePersonalizedRecommendations(itinerary, profile, input);
    
    return {
      personalizationScore,
      predictedUserSatisfaction: avgSatisfaction,
      riskFactors,
      recommendations
    };
  }

  private calculateOptimizationMetrics(itinerary: SmartItineraryDay[], input: SmartItineraryInput, budgetRecommendation: SmartBudgetRecommendation) {
    const baseCost = input.preferences.budget;
    const optimizedCost = itinerary.reduce((sum, day) => sum + day.totalCost, 0);
    const costOptimization = baseCost > 0 ? Math.max(0, (baseCost - optimizedCost) / baseCost * 100) : 0;
    
    const timeOptimization = this.calculateTimeOptimization(itinerary, input.constraints);
    const satisfactionOptimization = this.calculateSatisfactionOptimization(itinerary);
    
    const reasoning = [
      `Cost optimized by ${costOptimization.toFixed(1)}%`,
      `Time efficiency improved by ${timeOptimization.toFixed(1)}%`,
      `Satisfaction potential increased by ${satisfactionOptimization.toFixed(1)}%`
    ];
    
    return {
      timeOptimization,
      costOptimization,
      satisfactionOptimization,
      reasoning
    };
  }

  // Helper methods
  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calculateDate(startDate: string, daysToAdd: number): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private getPredominantCity(destinations: SmartDestination[]): string {
    if (destinations.length === 0) {
      return 'Jakarta'; // Default city if no destinations
    }
    
    const cityCounts = new Map<string, number>();
    destinations.forEach(dest => {
      const city = dest.location.split(',')[0]; // Get city name before comma
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    });
    
    const cityArray = Array.from(cityCounts.entries());
    if (cityArray.length === 0) {
      return 'Jakarta'; // Fallback if no cities found
    }
    
    const predominantCity = cityArray.reduce((a, b) => 
      cityCounts.get(a[0])! > cityCounts.get(b[0])! ? a : b
    )[0];
    
    return predominantCity;
  }

  private selectOptimalTransport(fromCity: string, toCity: string): string {
    // Simple logic - in real implementation, would check actual distances
    const distance = this.estimateCityDistance(fromCity, toCity);
    if (distance < 100) return 'Car/Taxi';
    if (distance < 500) return 'Bus/Train';
    return 'Flight';
  }

  private calculateTransportCost(fromCity: string, toCity: string): number {
    const distance = this.estimateCityDistance(fromCity, toCity);
    return Math.max(50000, distance * 1000); // Base cost plus distance-based
  }

  private calculateTravelDuration(fromCity: string, toCity: string): number {
    const distance = this.estimateCityDistance(fromCity, toCity);
    if (distance < 100) return 120; // 2 hours by car
    if (distance < 500) return 360; // 6 hours by bus/train
    return 480; // 8 hours including airport time
  }

  private estimateCityDistance(city1: string, city2: string): number {
    // Simplified distance estimation - in real app would use actual coordinates
    const cityDistances: Record<string, Record<string, number>> = {
      'Jakarta': { 'Bali': 1000, 'Yogyakarta': 450, 'Bandung': 150 },
      'Bali': { 'Jakarta': 1000, 'Yogyakarta': 800, 'Bandung': 900 },
      'Yogyakarta': { 'Jakarta': 450, 'Bali': 800, 'Bandung': 300 }
    };
    
    return cityDistances[city1]?.[city2] || cityDistances[city2]?.[city1] || 500;
  }

  private calculateDayMLConfidence(destinations: SmartDestination[], profile: UserPreferenceProfile | null): number {
    if (!profile) return 0.5;
    
    const avgScore = destinations.reduce((sum, dest) => sum + dest.mlScore, 0) / destinations.length;
    return Math.min(avgScore * 1.2, 1.0); // Slight boost for curated selection
  }

  private generateDayOptimizationReasons(destinations: SmartDestination[], profile: UserPreferenceProfile | null, constraints: any): string[] {
    const reasons: string[] = [];
    
    if (destinations.length > 0) {
      const avgRating = destinations.reduce((sum, d) => sum + d.rating, 0) / destinations.length;
      if (avgRating > 4.0) {
        reasons.push('Includes highly-rated destinations');
      }
    }
    
    if (profile) {
      const categoryMatch = destinations.filter(d => 
        profile.implicitPreferences.preferredCategories[d.category] > 0
      ).length / destinations.length;
      
      if (categoryMatch > 0.6) {
        reasons.push('Matches your preferred destination types');
      }
    }
    
    if (constraints.avoidCrowds) {
      reasons.push('Optimized to avoid peak crowd times');
    }
    
    return reasons;
  }

  private calculatePersonalizationScore(destinations: SmartDestination[], profile: UserPreferenceProfile): number {
    let score = 0;
    
    // Category preferences
    const categoryMatches = destinations.filter(d => 
      profile.implicitPreferences.preferredCategories[d.category] > 0
    ).length;
    score += (categoryMatches / destinations.length) * 0.4;
    
    // Location preferences
    const locationMatches = destinations.filter(d => 
      profile.implicitPreferences.preferredLocations[d.location] > 0
    ).length;
    score += (locationMatches / destinations.length) * 0.3;
    
    // Price range alignment
    const priceRange = profile.implicitPreferences.preferredPriceRange;
    const priceMatches = destinations.filter(d => 
      d.estimatedCost >= priceRange.min && d.estimatedCost <= priceRange.max
    ).length;
    score += (priceMatches / destinations.length) * 0.3;
    
    return Math.min(score, 1.0);
  }

  private identifyRiskFactors(itinerary: SmartItineraryDay[], input: SmartItineraryInput): string[] {
    const risks: string[] = [];
    
    // Weather risks (simplified)
    const rainySeasons = [11, 12, 1, 2, 3]; // Nov-Mar in Indonesia
    const startMonth = new Date(input.preferences.startDate).getMonth() + 1;
    if (rainySeasons.includes(startMonth)) {
      risks.push('Traveling during rainy season - outdoor activities may be affected');
    }
    
    // Budget risks
    const totalCost = itinerary.reduce((sum, day) => sum + day.totalCost, 0);
    if (totalCost > input.preferences.budget * 1.1) {
      risks.push('Estimated costs exceed budget - consider alternatives');
    }
    
    // Crowds risk
    if (input.constraints?.avoidCrowds) {
      risks.push('Peak season travel may result in crowds despite optimization');
    }
    
    return risks;
  }

  private generatePersonalizedRecommendations(itinerary: SmartItineraryDay[], profile: UserPreferenceProfile | null, input: SmartItineraryInput): string[] {
    const recommendations: string[] = [];
    
    if (profile) {
      if (profile.mlInsights.activityPreference > 0.7) {
        recommendations.push('Consider adding more adventure or outdoor activities');
      }
      
      if (profile.mlInsights.priceSensitivity > 0.6) {
        recommendations.push('Look for local food markets and free attractions to save money');
      }
      
      if (profile.mlInsights.spontaneityScore > 0.6) {
        recommendations.push('Leave some free time for spontaneous discoveries');
      }
    }
    
    // Add season-specific recommendations
    const month = new Date(input.preferences.startDate).getMonth() + 1;
    if ([6, 7, 8].includes(month)) {
      recommendations.push('Great time for beach and water activities!');
    } else if ([12, 1, 2].includes(month)) {
      recommendations.push('Peak tourist season - book accommodations early');
    }
    
    return recommendations;
  }

  private calculateTimeOptimization(itinerary: SmartItineraryDay[], constraints: any): number {
    // Compare with naive scheduling (random order)
    const totalActivities = itinerary.reduce((sum, day) => sum + day.destinations.length, 0);
    const baseTime = totalActivities * 180; // 3 hours per activity base
    const actualTime = itinerary.reduce((sum, day) => sum + day.totalTime, 0);
    
    return Math.max(0, (baseTime - actualTime) / baseTime * 100);
  }

  private calculateSatisfactionOptimization(itinerary: SmartItineraryDay[]): number {
    const allDestinations = itinerary.flatMap(day => day.destinations);
    const avgRating = allDestinations.reduce((sum, d) => sum + d.rating, 0) / allDestinations.length;
    const avgMLScore = allDestinations.reduce((sum, d) => sum + d.mlScore, 0) / allDestinations.length;

    // Combine rating and ML personalization score
    const baseSatisfaction = 3.5; // Neutral rating
    const ratingBoost = (avgRating - baseSatisfaction) * 20; // Convert to percentage
    const mlBoost = avgMLScore * 30; // ML personalization contribution

    return Math.max(0, ratingBoost + mlBoost);
  }

  // === COST VARIABILITY AND ACTIVITY INTEGRATION ENHANCEMENTS ===

  private calculateCostVariability(itinerary: SmartItineraryDay[], input: SmartItineraryInput): any {
    const allDestinations = itinerary.flatMap(day => day.destinations);

    return {
      seasonalAdjustments: this.calculateSeasonalPricing(allDestinations, input),
      demandFactors: this.calculateDemandPricing(allDestinations),
      currencyRates: this.getCurrencyRates(input.preferences),
      appliedDiscounts: this.calculateDiscounts(allDestinations, input),
      realTimeUpdates: this.getRealTimePriceUpdates(allDestinations)
    };
  }

  private calculateSeasonalPricing(destinations: SmartDestination[], input: SmartItineraryInput): SeasonalPricing[] {
    const startDate = new Date(input.preferences.startDate);
    const month = startDate.getMonth() + 1; // 1-12

    // Indonesian seasonal patterns
    const seasonalMultipliers: Record<number, { season: SeasonalPricing['season'], multiplier: number }> = {
      1: { season: 'high', multiplier: 1.3 }, // January - Peak season
      2: { season: 'high', multiplier: 1.3 }, // February - Peak season
      6: { season: 'shoulder', multiplier: 1.1 }, // June - School holidays
      7: { season: 'shoulder', multiplier: 1.1 }, // July - School holidays
      8: { season: 'shoulder', multiplier: 1.1 }, // August - School holidays
      12: { season: 'peak', multiplier: 1.5 }, // December - Christmas/New Year
    };

    const defaultSeason = { season: 'low' as const, multiplier: 0.9 };

    return destinations.map(dest => {
      const seasonal = seasonalMultipliers[month] || defaultSeason;
      return {
        destinationId: dest.id,
        season: seasonal.season,
        multiplier: seasonal.multiplier,
        reason: `Traveling during ${seasonal.season} season`
      };
    });
  }

  private calculateDemandPricing(destinations: SmartDestination[]): DemandPricing[] {
    return destinations.map(dest => {
      // Simulate demand based on rating and category popularity
      const baseDemand = dest.rating > 4.5 ? 'high' : dest.rating > 4.0 ? 'medium' : 'low';
      const categoryMultiplier = (this.categoryWeights as any)[dest.category] || 1.0;

      let demandLevel: DemandPricing['demandLevel'] = 'low';
      let multiplier = 1.0;

      if (baseDemand === 'high' && categoryMultiplier > 0.8) {
        demandLevel = 'extreme';
        multiplier = 1.4;
      } else if (baseDemand === 'high') {
        demandLevel = 'high';
        multiplier = 1.2;
      } else if (baseDemand === 'medium') {
        demandLevel = 'medium';
        multiplier = 1.1;
      }

      return {
        destinationId: dest.id,
        demandLevel,
        multiplier,
        occupancyRate: Math.random() * 100 // Simulated occupancy
      };
    });
  }

  private getCurrencyRates(preferences: any): CurrencyRate[] {
    // Simplified currency rates (in real app, fetch from API)
    const rates: CurrencyRate[] = [
      { from: 'IDR', to: 'USD', rate: 0.000067, lastUpdated: Date.now() },
      { from: 'USD', to: 'IDR', rate: 14950, lastUpdated: Date.now() },
      { from: 'IDR', to: 'EUR', rate: 0.000061, lastUpdated: Date.now() },
      { from: 'EUR', to: 'IDR', rate: 16350, lastUpdated: Date.now() }
    ];

    return rates;
  }

  private calculateDiscounts(destinations: SmartDestination[], input: SmartItineraryInput): Discount[] {
    const discounts: Discount[] = [];

    // Group discount for larger parties
    if (input.preferences.travelers >= 4) {
      discounts.push({
        type: 'group',
        percentage: Math.min(input.preferences.travelers * 2, 15),
        applicableTo: destinations.map(d => d.id),
        conditions: `Group discount for ${input.preferences.travelers} travelers`
      });
    }

    // Early bird discount (booked more than 30 days in advance)
    const daysUntilTravel = Math.ceil((new Date(input.preferences.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilTravel > 30) {
      discounts.push({
        type: 'early_bird',
        percentage: 10,
        applicableTo: destinations.map(d => d.id),
        conditions: 'Booked more than 30 days in advance'
      });
    }

    // Bulk destination discount
    if (destinations.length >= 5) {
      discounts.push({
        type: 'bulk',
        percentage: 8,
        applicableTo: destinations.map(d => d.id),
        conditions: 'Visiting 5 or more destinations'
      });
    }

    return discounts;
  }

  private getRealTimePriceUpdates(destinations: SmartDestination[]): RealTimePriceUpdate[] {
    return destinations.map(dest => {
      // Simulate real-time price changes
      const changePercent = (Math.random() - 0.5) * 0.2; // -10% to +10%
      const currentPrice = dest.estimatedCost * (1 + changePercent);

      return {
        destinationId: dest.id,
        originalPrice: dest.estimatedCost,
        currentPrice,
        changeReason: changePercent > 0 ? 'Increased demand' : 'Available deals',
        lastUpdated: Date.now()
      };
    });
  }

  // Activity Integration Methods
  createActivitySchedule(itinerary: SmartItineraryDay[], activities: ActivitySchedule[]): SmartItineraryDay[] {
    return itinerary.map(day => ({
      ...day,
      destinations: day.destinations.map(dest => ({
        ...dest,
        activities: this.scheduleActivitiesForDestination(dest, activities, day)
      }))
    }));
  }

  private scheduleActivitiesForDestination(
    destination: SmartDestination,
    allActivities: ActivitySchedule[],
    day: SmartItineraryDay
  ): ActivitySchedule[] {
    // Find activities related to this destination
    const relevantActivities = allActivities.filter(activity =>
      activity.category.toLowerCase().includes(destination.category.toLowerCase()) ||
      destination.tags.some(tag => activity.name.toLowerCase().includes(tag.toLowerCase()))
    );

    if (relevantActivities.length === 0) return [];

    // Schedule activities within the day's time constraints
    const scheduledActivities: ActivitySchedule[] = [];
    let currentTime = this.parseTime(destination.scheduledTime);

    for (const activity of relevantActivities) {
      const activityEndTime = currentTime + activity.timeSlot.duration;

      // Check if activity fits within day and destination time
      const destEndTime = this.parseTime(destination.scheduledTime) + destination.duration;

      if (activityEndTime <= destEndTime && activityEndTime <= this.parseTime('18:00')) {
        const scheduledActivity = {
          ...activity,
          timeSlot: {
            ...activity.timeSlot,
            start: this.formatTime(currentTime),
            end: this.formatTime(activityEndTime)
          }
        };

        scheduledActivities.push(scheduledActivity);
        currentTime = activityEndTime + 30; // 30 min buffer
      }

      if (scheduledActivities.length >= 2) break; // Limit activities per destination
    }

    return scheduledActivities;
  }

  // Enhanced cost calculation with variability
  calculateVariableCost(
    baseCost: number,
    destinationId: string,
    input: SmartItineraryInput,
    costVariability: any
  ): number {
    let adjustedCost = baseCost;

    // Apply seasonal pricing
    const seasonal = costVariability.seasonalAdjustments.find((s: SeasonalPricing) => s.destinationId === destinationId);
    if (seasonal) {
      adjustedCost *= seasonal.multiplier;
    }

    // Apply demand pricing
    const demand = costVariability.demandFactors.find((d: DemandPricing) => d.destinationId === destinationId);
    if (demand) {
      adjustedCost *= demand.multiplier;
    }

    // Apply real-time updates
    const realTime = costVariability.realTimeUpdates.find((r: RealTimePriceUpdate) => r.destinationId === destinationId);
    if (realTime) {
      adjustedCost = realTime.currentPrice;
    }

    // Apply discounts
    const applicableDiscounts = costVariability.appliedDiscounts.filter((d: Discount) =>
      d.applicableTo.includes(destinationId)
    );

    for (const discount of applicableDiscounts) {
      adjustedCost *= (1 - discount.percentage / 100);
    }

    // Currency conversion if needed
    const currency = (input.preferences as any).currency;
    if (currency && currency !== 'IDR') {
      const rate = costVariability.currencyRates.find((r: CurrencyRate) =>
        r.from === 'IDR' && r.to === currency
      );
      if (rate) {
        adjustedCost *= rate.rate;
      }
    }

    return Math.round(adjustedCost);
  }

  // Data expansion capabilities
  expandItineraryWithRealData(
    input: SmartItineraryInput,
    externalDataSources: any[]
  ): SmartItineraryInput {
    // Expand destinations from external data sources
    const expandedDestinations = [...input.availableDestinations];

    for (const dataSource of externalDataSources) {
      if (dataSource.destinations) {
        expandedDestinations.push(...dataSource.destinations);
      }
    }

    // Remove duplicates based on ID
    const uniqueDestinations = expandedDestinations.filter(
      (dest, index, self) => self.findIndex(d => d.id === dest.id) === index
    );

    return {
      ...input,
      availableDestinations: uniqueDestinations
    };
  }

  // Performance optimization: batch processing
  processBatchItineraries(inputs: SmartItineraryInput[]): SmartItineraryResult[] {
    return inputs.map(input => this.createSmartItinerary(input));
  }

  // Real-time price monitoring
  startPriceMonitoring(destinationIds: string[], callback: (updates: RealTimePriceUpdate[]) => void): () => void {
    const interval = setInterval(() => {
      const updates = destinationIds.map(id => ({
        destinationId: id,
        originalPrice: Math.random() * 1000000, // Simulated
        currentPrice: Math.random() * 1000000,
        changeReason: 'Market fluctuation',
        lastUpdated: Date.now()
      }));

      callback(updates);
    }, 60000); // Update every minute

    // Return cleanup function
    return () => clearInterval(interval);
  }

  // === EAST JAVA SPECIFIC ITINERARY GENERATION ===

  /**
   * Generate optimized East Java itinerary using compiled destinations
   */
  createEastJavaItinerary(input: SmartItineraryInput): SmartItineraryResult {
    try {
      // Validate East Java preferences
      this.validateEastJavaInput(input);

      // Get East Java specific destinations
      const eastJavaDestinations = this.getEastJavaDestinations(input);

      // Create enhanced input with East Java data
      const enhancedInput: SmartItineraryInput = {
        ...input,
        availableDestinations: eastJavaDestinations
      };

      // Generate itinerary using main algorithm
      const result = this.createSmartItinerary(enhancedInput);

      // Add East Java specific optimizations
      return this.optimizeForEastJava(result, input);

    } catch (error) {
      console.error('Error generating East Java itinerary:', error);
      throw new Error(`Failed to generate East Java itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate input for East Java itinerary generation
   */
  private validateEastJavaInput(input: SmartItineraryInput): void {
    if (!input.preferences.cities || input.preferences.cities.length === 0) {
      throw new Error('At least one East Java city must be specified');
    }

    const validEastJavaCities = [
      'Surabaya', 'Malang', 'Batu', 'Probolinggo', 'Lumajang', 'Blitar',
      'Kediri', 'Madiun', 'Nganjuk', 'Jember', 'Bojonegoro', 'Pacitan',
      'Pamekasan', 'Sampang', 'Sumenep', 'Situbondo', 'Trenggalek'
    ];

    const invalidCities = input.preferences.cities.filter(city =>
      !validEastJavaCities.includes(city)
    );

    if (invalidCities.length > 0) {
      throw new Error(`Invalid cities for East Java itinerary: ${invalidCities.join(', ')}`);
    }

    if (input.preferences.days < 1 || input.preferences.days > 14) {
      throw new Error('East Java itinerary must be between 1-14 days');
    }

    if (input.preferences.budget < 1000000) {
      throw new Error('Minimum budget for East Java itinerary is IDR 1,000,000');
    }
  }

  /**
   * Get compiled East Java destinations with cost estimates
   */
  private getEastJavaDestinations(input: SmartItineraryInput): Array<{
    id: string;
    name: string;
    location: string;
    category: string;
    estimatedCost: number;
    duration: number;
    coordinates?: { lat: number; lng: number };
    tags: string[];
    rating: number;
    openingHours?: string;
    bestTimeToVisit?: string;
  }> {
    // East Java destinations with cost estimates (based on compiled data)
    const eastJavaDestinations = [
      // Mountains & Volcanoes
      {
        id: 'bromo',
        name: 'Gunung Bromo',
        location: 'Probolinggo',
        category: 'Mountain',
        estimatedCost: 150000,
        duration: 480, // 8 hours
        coordinates: { lat: -7.9425, lng: 112.9530 },
        tags: ['volcano', 'sunrise', 'adventure', 'photography'],
        rating: 4.8,
        openingHours: '24 hours',
        bestTimeToVisit: '04:00-08:00'
      },
      {
        id: 'semeru',
        name: 'Gunung Semeru',
        location: 'Lumajang',
        category: 'Mountain',
        estimatedCost: 200000,
        duration: 720, // 12 hours
        coordinates: { lat: -8.1080, lng: 112.9219 },
        tags: ['hiking', 'volcano', 'extreme', 'nature'],
        rating: 4.7,
        openingHours: '24 hours',
        bestTimeToVisit: '06:00-18:00'
      },
      {
        id: 'arjuno',
        name: 'Gunung Arjuno',
        location: 'Malang',
        category: 'Mountain',
        estimatedCost: 100000,
        duration: 360, // 6 hours
        coordinates: { lat: -7.7333, lng: 112.5833 },
        tags: ['hiking', 'nature', 'beginner-friendly'],
        rating: 4.6,
        openingHours: '24 hours',
        bestTimeToVisit: '06:00-16:00'
      },

      // Beaches
      {
        id: 'klayar',
        name: 'Pantai Klayar',
        location: 'Pacitan',
        category: 'Beach',
        estimatedCost: 50000,
        duration: 180, // 3 hours
        coordinates: { lat: -8.2553, lng: 111.2461 },
        tags: ['beach', 'photography', 'relaxation', 'sunset'],
        rating: 4.6,
        openingHours: '06:00-18:00',
        bestTimeToVisit: '16:00-18:00'
      },
      {
        id: 'balekambang',
        name: 'Pantai Balekambang',
        location: 'Malang',
        category: 'Beach',
        estimatedCost: 75000,
        duration: 240, // 4 hours
        coordinates: { lat: -8.4089, lng: 112.5300 },
        tags: ['beach', 'snorkeling', 'family', 'nature'],
        rating: 4.5,
        openingHours: '06:00-18:00',
        bestTimeToVisit: '08:00-16:00'
      },
      {
        id: 'g-land',
        name: 'Pantai Plengkung (G-Land)',
        location: 'Banyuwangi',
        category: 'Beach',
        estimatedCost: 250000,
        duration: 300, // 5 hours
        coordinates: { lat: -8.8167, lng: 114.3167 },
        tags: ['surfing', 'beach', 'extreme', 'adventure'],
        rating: 4.7,
        openingHours: '24 hours',
        bestTimeToVisit: '06:00-18:00'
      },

      // Temples & Cultural Sites
      {
        id: 'penataran',
        name: 'Candi Penataran',
        location: 'Blitar',
        category: 'Temple',
        estimatedCost: 30000,
        duration: 120, // 2 hours
        coordinates: { lat: -8.0833, lng: 112.2167 },
        tags: ['temple', 'history', 'hindu', 'culture'],
        rating: 4.5,
        openingHours: '06:00-17:00',
        bestTimeToVisit: '08:00-16:00'
      },
      {
        id: 'jago',
        name: 'Candi Jago',
        location: 'Malang',
        category: 'Temple',
        estimatedCost: 25000,
        duration: 90, // 1.5 hours
        coordinates: { lat: -8.2500, lng: 112.6333 },
        tags: ['temple', 'history', 'ramayana', 'culture'],
        rating: 4.4,
        openingHours: '06:00-17:00',
        bestTimeToVisit: '08:00-16:00'
      },

      // Cities & Urban
      {
        id: 'malang-city',
        name: 'Kota Malang',
        location: 'Malang',
        category: 'City',
        estimatedCost: 100000,
        duration: 480, // 8 hours
        coordinates: { lat: -7.9667, lng: 112.6333 },
        tags: ['city', 'culture', 'food', 'shopping'],
        rating: 4.6,
        openingHours: '24 hours',
        bestTimeToVisit: '08:00-22:00'
      },
      {
        id: 'surabaya-city',
        name: 'Kota Surabaya',
        location: 'Surabaya',
        category: 'City',
        estimatedCost: 150000,
        duration: 480, // 8 hours
        coordinates: { lat: -7.2575, lng: 112.7521 },
        tags: ['city', 'history', 'food', 'shopping'],
        rating: 4.5,
        openingHours: '24 hours',
        bestTimeToVisit: '08:00-22:00'
      },
      {
        id: 'batu-city',
        name: 'Kota Batu',
        location: 'Batu',
        category: 'City',
        estimatedCost: 120000,
        duration: 360, // 6 hours
        coordinates: { lat: -7.8667, lng: 112.5167 },
        tags: ['city', 'nature', 'food', 'apple'],
        rating: 4.6,
        openingHours: '24 hours',
        bestTimeToVisit: '08:00-20:00'
      },

      // Waterfalls
      {
        id: 'coban-rondo',
        name: 'Air Terjun Coban Rondo',
        location: 'Malang',
        category: 'Waterfall',
        estimatedCost: 40000,
        duration: 180, // 3 hours
        coordinates: { lat: -8.0000, lng: 112.5833 },
        tags: ['waterfall', 'nature', 'hiking', 'photography'],
        rating: 4.7,
        openingHours: '07:00-17:00',
        bestTimeToVisit: '08:00-16:00'
      },
      {
        id: 'madakaripura',
        name: 'Air Terjun Madakaripura',
        location: 'Probolinggo',
        category: 'Waterfall',
        estimatedCost: 75000,
        duration: 240, // 4 hours
        coordinates: { lat: -7.9167, lng: 112.8833 },
        tags: ['waterfall', 'legend', 'nature', 'hiking'],
        rating: 4.8,
        openingHours: '08:00-16:00',
        bestTimeToVisit: '08:00-14:00'
      },

      // Lakes
      {
        id: 'ranu-pani',
        name: 'Ranu Pani',
        location: 'Lumajang',
        category: 'Lake',
        estimatedCost: 50000,
        duration: 180, // 3 hours
        coordinates: { lat: -8.1080, lng: 112.9219 },
        tags: ['lake', 'basecamp', 'nature', 'semeru'],
        rating: 4.8,
        openingHours: '24 hours',
        bestTimeToVisit: '06:00-18:00'
      },

      // National Parks
      {
        id: 'bromo-tengger-semeru',
        name: 'Taman Nasional Bromo Tengger Semeru',
        location: 'Probolinggo',
        category: 'National Park',
        estimatedCost: 200000,
        duration: 600, // 10 hours
        coordinates: { lat: -8.0000, lng: 112.9000 },
        tags: ['national-park', 'volcano', 'nature', 'conservation'],
        rating: 4.9,
        openingHours: '24 hours',
        bestTimeToVisit: '04:00-18:00'
      }
    ];

    // Filter by user preferences
    return eastJavaDestinations.filter(dest => {
      // Filter by cities
      if (input.preferences.cities && input.preferences.cities.length > 0) {
        if (!input.preferences.cities.includes(dest.location)) {
          return false;
        }
      }

      // Filter by interests/themes
      if (input.preferences.interests && input.preferences.interests.length > 0) {
        const hasMatchingInterest = input.preferences.interests.some(interest =>
          dest.tags.includes(interest.toLowerCase())
        );
        if (!hasMatchingInterest) return false;
      }

      // Filter by preferred spots
      if (input.preferences.preferredSpots && input.preferences.preferredSpots.length > 0) {
        if (!input.preferences.preferredSpots.includes(dest.id)) {
          return false;
        }
      }

      // Filter by budget constraints
      const maxDestCost = input.preferences.budget * 0.3; // Max 30% of budget per destination
      if (dest.estimatedCost > maxDestCost) {
        return false;
      }

      return true;
    });
  }

  /**
   * Optimize itinerary specifically for East Java travel patterns
   */
  private optimizeForEastJava(result: SmartItineraryResult, input: SmartItineraryInput): SmartItineraryResult {
    // Add East Java specific recommendations
    const eastJavaRecommendations = [
      'Consider visiting during dry season (April-September) for better weather',
      'Bromo sunrise tours are most popular - book early',
      'Try local East Java specialties like rawon, rujak, and pecel',
      'Use travel apps for real-time traffic updates between cities',
      'Consider homestays in rural areas for authentic cultural experience'
    ];

    // Add seasonal considerations for East Java
    const month = new Date(input.preferences.startDate).getMonth() + 1;
    if ([11, 12, 1, 2, 3].includes(month)) {
      eastJavaRecommendations.push('Rainy season: Prepare for wet conditions, especially in mountains');
    } else if ([6, 7, 8, 9].includes(month)) {
      eastJavaRecommendations.push('Dry season: Perfect for outdoor activities and beach visits');
    }

    return {
      ...result,
      mlInsights: {
        ...result.mlInsights,
        recommendations: [...result.mlInsights.recommendations, ...eastJavaRecommendations]
      }
    };
  }

  /**
   * Generate East Java hotel selections based on preferences
   */
  selectEastJavaHotels(input: SmartItineraryInput): Array<{
    day: number;
    accommodation: {
      name: string;
      type: string;
      cost: number;
      location: string;
      rating: number;
      amenities: string[];
    };
  }> {
    const hotelSelections = [];
    const cities = input.preferences.cities;

    for (let day = 1; day <= input.preferences.days; day++) {
      // Rotate through cities for multi-city itineraries
      const cityIndex = (day - 1) % cities.length;
      const city = cities[cityIndex];

      const hotels = this.getHotelsForCity(city, input.preferences.accommodationType);
      const selectedHotel = hotels[Math.floor(Math.random() * hotels.length)];

      hotelSelections.push({
        day,
        accommodation: selectedHotel
      });
    }

    return hotelSelections;
  }

  /**
   * Get hotel options for specific East Java cities
   */
  private getHotelsForCity(city: string, type: 'budget' | 'moderate' | 'luxury'): Array<{
    name: string;
    type: string;
    cost: number;
    location: string;
    rating: number;
    amenities: string[];
  }> {
    const hotelData: Record<string, Array<{
      name: string;
      type: string;
      cost: number;
      location: string;
      rating: number;
      amenities: string[];
    }>> = {
      'Malang': [
        {
          name: 'Hotel Tugu Malang',
          type: 'moderate',
          cost: 450000,
          location: 'Malang',
          rating: 4.2,
          amenities: ['wifi', 'pool', 'restaurant', 'parking']
        },
        {
          name: 'Savana Hotel Malang',
          type: 'luxury',
          cost: 750000,
          location: 'Malang',
          rating: 4.5,
          amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'parking']
        },
        {
          name: 'Hotel Santika Premiere Malang',
          type: 'luxury',
          cost: 650000,
          location: 'Malang',
          rating: 4.3,
          amenities: ['wifi', 'pool', 'restaurant', 'business-center', 'parking']
        }
      ],
      'Batu': [
        {
          name: 'Golden Tulip Holland Resort Batu',
          type: 'luxury',
          cost: 1200000,
          location: 'Batu',
          rating: 4.7,
          amenities: ['wifi', 'pool', 'spa', 'restaurant', 'kids-club', 'parking']
        },
        {
          name: 'Arjuna Hotel & Resort',
          type: 'moderate',
          cost: 350000,
          location: 'Batu',
          rating: 4.1,
          amenities: ['wifi', 'pool', 'restaurant', 'parking']
        }
      ],
      'Surabaya': [
        {
          name: 'Hotel Majapahit Surabaya',
          type: 'luxury',
          cost: 800000,
          location: 'Surabaya',
          rating: 4.5,
          amenities: ['wifi', 'pool', 'spa', 'restaurant', 'business-center', 'parking']
        },
        {
          name: 'Swiss-Belresort Tretes',
          type: 'moderate',
          cost: 400000,
          location: 'Tretes',
          rating: 4.4,
          amenities: ['wifi', 'pool', 'restaurant', 'parking']
        }
      ],
      'Probolinggo': [
        {
          name: 'Hotel Bromo Permai',
          type: 'moderate',
          cost: 300000,
          location: 'Probolinggo',
          rating: 4.0,
          amenities: ['wifi', 'restaurant', 'parking']
        },
        {
          name: 'Cemara Indah Hotel',
          type: 'budget',
          cost: 150000,
          location: 'Probolinggo',
          rating: 3.8,
          amenities: ['wifi', 'parking']
        }
      ]
    };

    const cityHotels = hotelData[city] || [];
    return cityHotels.filter(hotel => hotel.type === type);
  }

  /**
   * Enhanced error handling for East Java itineraries
   */
  private handleEastJavaItineraryError(error: any, input: SmartItineraryInput): SmartItineraryResult {
    console.error('East Java itinerary generation error:', error);

    // Provide fallback itinerary
    const fallbackDays: SmartItineraryDay[] = [];
    for (let day = 1; day <= Math.min(input.preferences.days, 3); day++) {
      fallbackDays.push({
        day,
        date: this.calculateDate(input.preferences.startDate, day - 1),
        destinations: [{
          id: 'fallback',
          name: 'Explore Local Area',
          category: 'Cultural',
          location: input.preferences.cities[0] || 'Malang',
          coordinates: { lat: -7.9667, lng: 112.6333 },
          scheduledTime: '09:00',
          duration: 240,
          estimatedCost: 100000,
          rating: 4.0,
          tags: ['local', 'culture'],
          mlScore: 0.5,
          predictedSatisfaction: 0.7
        }],
        totalCost: 100000,
        totalTime: 240,
        mlConfidence: 0.3,
        optimizationReasons: ['Fallback itinerary due to processing error']
      });
    }

    return {
      itinerary: fallbackDays,
      totalCost: fallbackDays.reduce((sum, day) => sum + day.totalCost, 0),
      totalDuration: fallbackDays.reduce((sum, day) => sum + day.totalTime, 0),
      budgetBreakdown: {
        totalBudget: input.preferences.budget,
        categoryBreakdown: {
          accommodation: { allocated: 0, recommended: 0, savings: 0 },
          transportation: { allocated: 0, recommended: 0, savings: 0 },
          food: { allocated: 0, recommended: 0, savings: 0 },
          activities: { allocated: fallbackDays.reduce((sum, day) => sum + day.totalCost, 0), recommended: fallbackDays.reduce((sum, day) => sum + day.totalCost, 0), savings: 0 },
          miscellaneous: { allocated: 0, recommended: 0, savings: 0 }
        },
        optimizations: [],
        confidence: 0.3,
        reasoning: ['Fallback mode activated due to error']
      },
      mlInsights: {
        personalizationScore: 0.3,
        predictedUserSatisfaction: 0.5,
        riskFactors: ['System processing error occurred', 'Using fallback recommendations'],
        recommendations: [
          'Try again with simplified preferences',
          'Consider contacting support for assistance',
          'Check network connectivity and try again'
        ]
      },
      optimization: {
        timeOptimization: 0,
        costOptimization: 0,
        satisfactionOptimization: 0,
        reasoning: ['Fallback mode activated due to error']
      },
      costVariability: {
        seasonalAdjustments: [],
        demandFactors: [],
        currencyRates: [],
        appliedDiscounts: [],
        realTimeUpdates: []
      }
    };
  }
}

// Singleton instance
export const smartItineraryEngine = new SmartItineraryEngine();
