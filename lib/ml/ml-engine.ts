// ML Engine for JaTour Smart Itinerary System
// Simple machine learning for user behavior analysis and preference prediction

export interface UserBehaviorData {
  userId: string;
  timestamp: number;
  action: 'view' | 'click' | 'hover' | 'scroll' | 'filter' | 'search';
  targetType: 'destination' | 'hotel' | 'activity' | 'budget' | 'route' | 'preference';
  targetId: string;
  targetData?: {
    category?: string;
    price?: number;
    rating?: number;
    duration?: number;
    location?: string;
    tags?: string[];
  };
  sessionId: string;
  timeSpent?: number; // in milliseconds
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    screenWidth: number;
  };
}

export interface UserPreferenceProfile {
  userId: string;
  explicitPreferences: {
    budget: number;
    interests: string[];
    themes: string[];
    cities: string[];
    accommodationType: 'budget' | 'moderate' | 'luxury';
  };
  implicitPreferences: {
    preferredCategories: Record<string, number>; // category -> score
    preferredPriceRange: { min: number; max: number };
    preferredLocations: Record<string, number>; // location -> score
    behavioralPatterns: {
      averageSessionTime: number;
      preferredViewingTime: number;
      navigationSpeed: number;
      filterUsage: Record<string, number>;
    };
  };
  mlInsights: {
    riskTolerance: number; // 0-1, how willing to try new things
    priceSensitivity: number; // 0-1, how price-sensitive
    activityPreference: number; // 0-1, prefer active vs passive activities
    socialPreference: number; // 0-1, prefer solo vs group activities
    spontaneityScore: number; // 0-1, how spontaneous vs planned
  };
  lastUpdated: number;
}

export interface MLRecommendation {
  itemId: string;
  itemType: 'destination' | 'activity' | 'accommodation' | 'route';
  score: number;
  confidence: number;
  reasons: string[];
  predictedRating: number;
  estimatedCost: number;
}

export class MLEngine {
  private userProfiles: Map<string, UserPreferenceProfile> = new Map();
  private behaviorHistory: Map<string, UserBehaviorData[]> = new Map();
  private recommendationCache: Map<string, MLRecommendation[]> = new Map();

  // Track user behavior for ML analysis
  trackUserBehavior(data: UserBehaviorData): void {
    const userHistory = this.behaviorHistory.get(data.userId) || [];
    userHistory.push(data);
    
    // Keep only recent history (last 1000 interactions)
    if (userHistory.length > 1000) {
      userHistory.splice(0, userHistory.length - 1000);
    }
    
    this.behaviorHistory.set(data.userId, userHistory);
    this.updateUserProfile(data.userId);
  }

  // Update user preference profile based on behavior
  private updateUserProfile(userId: string): void {
    const history = this.behaviorHistory.get(userId) || [];
    if (history.length === 0) return;

    const profile = this.getOrCreateUserProfile(userId);
    const recentInteractions = history.slice(-100); // Last 100 interactions

    // Analyze viewing patterns
    this.analyzeViewingPatterns(recentInteractions, profile);
    
    // Analyze interaction patterns
    this.analyzeInteractionPatterns(recentInteractions, profile);
    
    // Update implicit preferences
    this.updateImplicitPreferences(recentInteractions, profile);
    
    // Calculate ML insights
    this.calculateMLInsights(recentInteractions, profile);

    profile.lastUpdated = Date.now();
    this.userProfiles.set(userId, profile);
  }

  private analyzeViewingPatterns(interactions: UserBehaviorData[], profile: UserPreferenceProfile): void {
    const viewInteractions = interactions.filter(i => i.action === 'view' || i.action === 'hover');
    const categoryScores: Record<string, number> = {};
    const locationScores: Record<string, number> = {};

    viewInteractions.forEach(interaction => {
      if (interaction.targetData?.category) {
        const category = interaction.targetData.category;
        const timeWeight = Math.min((interaction.timeSpent || 1000) / 5000, 2); // Max weight of 2
        categoryScores[category] = (categoryScores[category] || 0) + timeWeight;
      }

      if (interaction.targetData?.location) {
        const location = interaction.targetData.location;
        const timeWeight = Math.min((interaction.timeSpent || 1000) / 5000, 2);
        locationScores[location] = (locationScores[location] || 0) + timeWeight;
      }
    });

    // Update profile preferences
    profile.implicitPreferences.preferredCategories = { ...categoryScores };
    profile.implicitPreferences.preferredLocations = { ...locationScores };
  }

  private analyzeInteractionPatterns(interactions: UserBehaviorData[], profile: UserPreferenceProfile): void {
    const clickInteractions = interactions.filter(i => i.action === 'click');
    const filterUsage: Record<string, number> = {};
    let totalTimeSpent = 0;
    let validTimeSpentCount = 0;

    interactions.forEach(interaction => {
      if (interaction.action === 'filter') {
        filterUsage[interaction.targetId] = (filterUsage[interaction.targetId] || 0) + 1;
      }
      
      if (interaction.timeSpent) {
        totalTimeSpent += interaction.timeSpent;
        validTimeSpentCount++;
      }
    });

    profile.implicitPreferences.behavioralPatterns = {
      averageSessionTime: validTimeSpentCount > 0 ? totalTimeSpent / validTimeSpentCount : 0,
      preferredViewingTime: this.calculatePreferredViewingTime(interactions),
      navigationSpeed: this.calculateNavigationSpeed(interactions),
      filterUsage: filterUsage
    };
  }

  private updateImplicitPreferences(interactions: UserBehaviorData[], profile: UserPreferenceProfile): void {
    const relevantInteractions = interactions.filter(i => 
      i.targetData?.price && i.action === 'view'
    );

    if (relevantInteractions.length > 0) {
      const prices = relevantInteractions
        .map(i => i.targetData?.price || 0)
        .filter(p => p > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        profile.implicitPreferences.preferredPriceRange = { min: minPrice, max: maxPrice };
        
        // Calculate price sensitivity
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const priceVariance = prices.reduce((acc, price) => acc + Math.pow(price - avgPrice, 2), 0) / prices.length;
        profile.mlInsights.priceSensitivity = Math.min(priceVariance / (avgPrice * avgPrice), 1);
      }
    }
  }

  private calculateMLInsights(interactions: UserBehaviorData[], profile: UserPreferenceProfile): void {
    // Risk tolerance: based on variety in destinations viewed
    const viewedDestinations = new Set(interactions.map(i => i.targetId));
    const uniqueCategories = new Set(interactions.map(i => i.targetData?.category).filter(Boolean));
    profile.mlInsights.riskTolerance = Math.min(uniqueCategories.size / 10, 1);

    // Activity preference: based on active vs passive content engagement
    const activeInteractions = interactions.filter(i => 
      ['adventure', 'sports', 'hiking', 'water'].some(tag => 
        i.targetData?.tags?.includes(tag)
      )
    ).length;
    const passiveInteractions = interactions.filter(i => 
      ['museum', 'relaxation', 'dining', 'shopping'].some(tag => 
        i.targetData?.tags?.includes(tag)
      )
    ).length;
    
    profile.mlInsights.activityPreference = activeInteractions / (activeInteractions + passiveInteractions + 1);

    // Spontaneity score: based on session time and navigation patterns
    const avgSessionTime = profile.implicitPreferences.behavioralPatterns.averageSessionTime;
    profile.mlInsights.spontaneityScore = Math.min(avgSessionTime / 300000, 1); // 5 minutes = max spontaneity
  }

  private calculatePreferredViewingTime(interactions: UserBehaviorData[]): number {
    const viewingTimes = interactions
      .filter(i => i.action === 'view' && i.timeSpent)
      .map(i => i.timeSpent || 0);
    
    return viewingTimes.length > 0 
      ? viewingTimes.reduce((a, b) => a + b, 0) / viewingTimes.length
      : 0;
  }

  private calculateNavigationSpeed(interactions: UserBehaviorData[]): number {
    if (interactions.length < 2) return 1;
    
    const timeDiff = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
    return interactions.length / (timeDiff / 1000); // interactions per second
  }

  private getOrCreateUserProfile(userId: string): UserPreferenceProfile {
    return this.userProfiles.get(userId) || {
      userId,
      explicitPreferences: {
        budget: 0,
        interests: [],
        themes: [],
        cities: [],
        accommodationType: 'moderate'
      },
      implicitPreferences: {
        preferredCategories: {},
        preferredPriceRange: { min: 0, max: 10000000 },
        preferredLocations: {},
        behavioralPatterns: {
          averageSessionTime: 0,
          preferredViewingTime: 0,
          navigationSpeed: 0,
          filterUsage: {}
        }
      },
      mlInsights: {
        riskTolerance: 0.5,
        priceSensitivity: 0.5,
        activityPreference: 0.5,
        socialPreference: 0.5,
        spontaneityScore: 0.5
      },
      lastUpdated: 0
    };
  }

  // Generate ML-powered recommendations
  generateRecommendations(
    userId: string, 
    availableItems: Array<{id: string, type: string, data: any}>,
    limit: number = 10
  ): MLRecommendation[] {
    const cacheKey = `${userId}-${availableItems.length}`;
    if (this.recommendationCache.has(cacheKey)) {
      return this.recommendationCache.get(cacheKey)!.slice(0, limit);
    }

    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return this.getDefaultRecommendations(availableItems, limit);
    }

    const recommendations: MLRecommendation[] = availableItems.map(item => {
      let score = 0;
      const reasons: string[] = [];
      let confidence = 0.5;

      // Category matching
      const categoryScore = profile.implicitPreferences.preferredCategories[item.data.category || ''] || 0;
      score += categoryScore * 0.3;
      if (categoryScore > 0) reasons.push(`Matches your interest in ${item.data.category}`);

      // Location matching
      const locationScore = profile.implicitPreferences.preferredLocations[item.data.location || ''] || 0;
      score += locationScore * 0.2;
      if (locationScore > 0) reasons.push(`Located in your preferred area`);

      // Price preference matching
      const itemPrice = item.data.price || 0;
      const priceRange = profile.implicitPreferences.preferredPriceRange;
      if (itemPrice >= priceRange.min && itemPrice <= priceRange.max) {
        score += 0.2;
        reasons.push(`Fits your budget range`);
        confidence += 0.1;
      }

      // ML insights scoring
      score += profile.mlInsights.riskTolerance * 0.1;
      score += (1 - profile.mlInsights.priceSensitivity) * 0.1;
      
      // Normalize score to 0-1
      score = Math.min(score / 2, 1);

      // Calculate predicted rating based on user behavior patterns
      const predictedRating = this.calculatePredictedRating(item, profile);

      return {
        itemId: item.id,
        itemType: item.type as any,
        score,
        confidence,
        reasons,
        predictedRating,
        estimatedCost: itemPrice
      };
    });

    // Sort by score and return top recommendations
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache results
    this.recommendationCache.set(cacheKey, sortedRecommendations);

    return sortedRecommendations;
  }

  private getDefaultRecommendations(availableItems: any[], limit: number): MLRecommendation[] {
    return availableItems.slice(0, limit).map(item => ({
      itemId: item.id,
      itemType: item.type as any,
      score: 0.5,
      confidence: 0.3,
      reasons: ['Popular choice'],
      predictedRating: 3.5,
      estimatedCost: item.data?.price || 0
    }));
  }

  private calculatePredictedRating(item: any, profile: UserPreferenceProfile): number {
    let baseRating = 3.5; // Neutral rating
    
    // Adjust based on category preferences
    const categoryScore = profile.implicitPreferences.preferredCategories[item.data.category || ''] || 0;
    baseRating += categoryScore * 0.5;
    
    // Adjust based on price satisfaction
    const priceRange = profile.implicitPreferences.preferredPriceRange;
    const itemPrice = item.data.price || 0;
    if (itemPrice >= priceRange.min && itemPrice <= priceRange.max) {
      baseRating += 0.3;
    }
    
    // Clamp rating between 1 and 5
    return Math.max(1, Math.min(5, baseRating));
  }

  // Get user preference profile
  getUserProfile(userId: string): UserPreferenceProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  // Update explicit preferences
  updateExplicitPreferences(userId: string, preferences: Partial<UserPreferenceProfile['explicitPreferences']>): void {
    const profile = this.getOrCreateUserProfile(userId);
    profile.explicitPreferences = { ...profile.explicitPreferences, ...preferences };
    profile.lastUpdated = Date.now();
    this.userProfiles.set(userId, profile);
  }

  // Clear cache (call periodically)
  clearCache(): void {
    this.recommendationCache.clear();
  }

  // Export user data for analysis
  exportUserData(userId: string): any {
    const profile = this.userProfiles.get(userId);
    const history = this.behaviorHistory.get(userId);
    
    return {
      profile,
      behaviorHistory: history,
      exportedAt: Date.now()
    };
  }
}

// Singleton instance
export const mlEngine = new MLEngine();
