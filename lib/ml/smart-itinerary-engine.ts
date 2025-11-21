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
    
    // Step 5: Calculate totals
    const totalCost = optimizedItinerary.reduce((sum, day) => sum + day.totalCost, 0);
    const totalDuration = optimizedItinerary.reduce((sum, day) => sum + day.totalTime, 0);

    return {
      itinerary: optimizedItinerary,
      totalCost,
      totalDuration,
      budgetBreakdown: budgetRecommendation,
      mlInsights,
      optimization
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
    const destinationsPerDay = Math.ceil(destinations.length / input.preferences.days);
    
    for (let day = 1; day <= input.preferences.days; day++) {
      const dayDestinations = destinations.slice((day - 1) * destinationsPerDay, day * destinationsPerDay);
      const optimizedDay = this.optimizeDaySchedule(dayDestinations, day, input, profile, constraints);
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
    constraints: any
  ): SmartItineraryDay {
    // Sort destinations by ML score and logical flow
    const sortedDestinations = this.sortDestinationsByOptimalFlow(destinations, constraints);
    
    // Schedule destinations within the day
    const scheduledDestinations = this.scheduleDestinationsInDay(sortedDestinations, dayNumber, input, constraints);
    
    // Calculate costs and times
    const totalCost = scheduledDestinations.reduce((sum, dest) => sum + dest.estimatedCost, 0);
    const totalTime = scheduledDestinations.reduce((sum, dest) => sum + dest.duration, 0);
    
    // Generate ML insights for the day
    const mlConfidence = this.calculateDayMLConfidence(scheduledDestinations, profile);
    const optimizationReasons = this.generateDayOptimizationReasons(scheduledDestinations, profile, constraints);

    return {
      day: dayNumber,
      date: this.calculateDate(input.preferences.startDate, dayNumber - 1),
      destinations: scheduledDestinations,
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
    constraints: any
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
    const cityCounts = new Map<string, number>();
    destinations.forEach(dest => {
      const city = dest.location.split(',')[0]; // Get city name before comma
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    });
    
    return Array.from(cityCounts.entries()).reduce((a, b) => 
      cityCounts.get(a[0])! > cityCounts.get(b[0])! ? a : b
    )[0];
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
}

// Singleton instance
export const smartItineraryEngine = new SmartItineraryEngine();
