// Preference Learning System for Auto Budget Correction System
// Learns and embeds user preferences for personalized budget adjustments and recommendations

import { mlEngine, UserPreferenceProfile, UserBehaviorData } from './ml-engine';
import { spendingPatternAnalyzer, SpendingData } from './spending-pattern-analyzer';

export interface PreferenceEmbedding {
  userId: string;
  budgetPreferences: {
    priceSensitivity: number; // 0-1, how sensitive to price changes
    categoryPriorities: Record<string, number>; // category -> priority score
    spendingStyle: 'conservative' | 'moderate' | 'flexible';
    riskTolerance: number; // 0-1, willingness to try cheaper alternatives
  };
  experiencePreferences: {
    activityTypes: Record<string, number>; // activity type -> preference score
    accommodationStyle: 'budget' | 'comfort' | 'luxury';
    foodPreferences: Record<string, number>; // cuisine/food type -> preference score
    transportationMode: 'cost_optimized' | 'comfort_optimized' | 'time_optimized';
  };
  behavioralPatterns: {
    decisionSpeed: number; // 0-1, how quickly they make decisions
    adaptability: number; // 0-1, how willing to change plans
    socialInfluence: number; // 0-1, influenced by social factors
    planningHorizon: number; // days ahead they typically plan
  };
  embeddingVector: number[]; // ML embedding for similarity matching
  lastUpdated: Date;
  confidence: number; // 0-1, confidence in the embedding
}

export interface PersonalizedRecommendation {
  userId: string;
  context: 'budget_adjustment' | 'alternative_suggestion' | 'spending_alert';
  recommendations: Array<{
    type: 'alternative_option' | 'budget_reallocation' | 'timing_adjustment';
    item: {
      id: string;
      name: string;
      category: string;
      originalCost?: number;
      recommendedCost?: number;
    };
    appealScore: number; // 0-1, how appealing this is to the user
    confidence: number; // 0-1, confidence in the recommendation
    reasoning: string[];
    tradeoffs: string[];
  }>;
  generatedAt: Date;
}

export interface PreferenceUpdate {
  userId: string;
  updateType: 'behavior_observation' | 'explicit_feedback' | 'spending_pattern';
  data: any;
  timestamp: Date;
}

export class PreferenceLearningSystem {
  private preferenceEmbeddings: Map<string, PreferenceEmbedding> = new Map();
  private recommendationHistory: Map<string, PersonalizedRecommendation[]> = new Map();

  // Generate or update preference embedding for a user
  async generateEmbedding(userId: string): Promise<PreferenceEmbedding> {
    // Check cache first
    const cached = this.preferenceEmbeddings.get(userId);
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
      return cached;
    }

    const userProfile = mlEngine.getUserProfile(userId);
    const spendingPattern = spendingPatternAnalyzer.analyzePatterns(userId);

    const embedding = await this.createPreferenceEmbedding(userId, userProfile, spendingPattern);
    this.preferenceEmbeddings.set(userId, embedding);

    return embedding;
  }

  // Generate personalized recommendations based on context
  async generatePersonalizedRecommendations(
    userId: string,
    context: PersonalizedRecommendation['context'],
    options: Array<{
      id: string;
      name: string;
      category: string;
      cost: number;
      metadata?: any;
    }>
  ): Promise<PersonalizedRecommendation> {
    const embedding = await this.generateEmbedding(userId);

    const recommendations = await this.scoreAndRankOptions(options, embedding, context);

    const personalizedRec: PersonalizedRecommendation = {
      userId,
      context,
      recommendations,
      generatedAt: new Date()
    };

    // Store in history
    const history = this.recommendationHistory.get(userId) || [];
    history.push(personalizedRec);
    this.recommendationHistory.set(userId, history);

    return personalizedRec;
  }

  // Update preferences based on user behavior or feedback
  async updatePreferences(update: PreferenceUpdate): Promise<void> {
    const embedding = await this.generateEmbedding(update.userId);

    switch (update.updateType) {
      case 'behavior_observation':
        await this.updateFromBehavior(embedding, update.data);
        break;
      case 'explicit_feedback':
        await this.updateFromFeedback(embedding, update.data);
        break;
      case 'spending_pattern':
        await this.updateFromSpendingPattern(embedding, update.data);
        break;
    }

    embedding.lastUpdated = new Date();
    this.preferenceEmbeddings.set(update.userId, embedding);
  }

  // Get recommendation history for analysis
  getRecommendationHistory(userId: string): PersonalizedRecommendation[] {
    return this.recommendationHistory.get(userId) || [];
  }

  // Calculate similarity between user preferences and options
  calculatePreferenceSimilarity(embedding: PreferenceEmbedding, option: any): number {
    // Simplified similarity calculation
    let similarity = 0;
    let factors = 0;

    // Category preference
    const categoryPreference = embedding.budgetPreferences.categoryPriorities[option.category] || 0.5;
    similarity += categoryPreference;
    factors++;

    // Price sensitivity alignment
    const priceRatio = option.cost / (option.originalCost || option.cost);
    const priceAlignment = embedding.budgetPreferences.priceSensitivity > 0.5 ?
      (priceRatio < 1 ? 0.8 : 0.4) : (priceRatio < 1 ? 0.4 : 0.8);
    similarity += priceAlignment;
    factors++;

    // Risk tolerance
    const riskAlignment = embedding.budgetPreferences.riskTolerance > 0.5 ?
      (option.isAlternative ? 0.7 : 0.5) : (option.isAlternative ? 0.3 : 0.8);
    similarity += riskAlignment;
    factors++;

    return similarity / factors;
  }

  private async createPreferenceEmbedding(
    userId: string,
    profile: UserPreferenceProfile | null,
    spendingPattern: any
  ): Promise<PreferenceEmbedding> {
    // Budget preferences
    const budgetPreferences = this.extractBudgetPreferences(profile, spendingPattern);

    // Experience preferences
    const experiencePreferences = this.extractExperiencePreferences(profile);

    // Behavioral patterns
    const behavioralPatterns = this.extractBehavioralPatterns(profile, spendingPattern);

    // Create embedding vector (simplified)
    const embeddingVector = this.createEmbeddingVector(budgetPreferences, experiencePreferences, behavioralPatterns);

    // Calculate confidence
    const confidence = this.calculateEmbeddingConfidence(profile, spendingPattern);

    return {
      userId,
      budgetPreferences,
      experiencePreferences,
      behavioralPatterns,
      embeddingVector,
      lastUpdated: new Date(),
      confidence
    };
  }

  private extractBudgetPreferences(profile: UserPreferenceProfile | null, spendingPattern: any) {
    let priceSensitivity = 0.5;
    let spendingStyle: 'conservative' | 'moderate' | 'flexible' = 'moderate';
    let riskTolerance = 0.5;

    if (profile) {
      priceSensitivity = profile.mlInsights.priceSensitivity;

      if (priceSensitivity > 0.7) {
        spendingStyle = 'conservative';
      } else if (priceSensitivity < 0.3) {
        spendingStyle = 'flexible';
      }

      riskTolerance = profile.mlInsights.riskTolerance;
    }

    // Adjust based on spending patterns
    if (spendingPattern.riskScore > 0.8) {
      priceSensitivity = Math.max(priceSensitivity, 0.8);
      spendingStyle = 'conservative';
    }

    const categoryPriorities: Record<string, number> = {
      accommodation: 0.8,
      transportation: 0.6,
      food: 0.7,
      activities: 0.9,
      miscellaneous: 0.4
    };

    // Adjust priorities based on user behavior
    if (profile) {
      Object.entries(profile.implicitPreferences.preferredCategories).forEach(([category, score]) => {
        if (categoryPriorities[category] !== undefined) {
          categoryPriorities[category] = Math.min(1.0, categoryPriorities[category] + (score as number) * 0.2);
        }
      });
    }

    return {
      priceSensitivity,
      categoryPriorities,
      spendingStyle,
      riskTolerance
    };
  }

  private extractExperiencePreferences(profile: UserPreferenceProfile | null) {
    const activityTypes: Record<string, number> = {
      adventure: 0.5,
      cultural: 0.5,
      relaxation: 0.5,
      food: 0.5,
      shopping: 0.5,
      nature: 0.5
    };

    let accommodationStyle: 'budget' | 'comfort' | 'luxury' = 'comfort';
    let transportationMode: 'cost_optimized' | 'comfort_optimized' | 'time_optimized' = 'cost_optimized';

    if (profile) {
      // Adjust activity preferences based on implicit preferences
      Object.entries(profile.implicitPreferences.preferredCategories).forEach(([category, score]) => {
        if (activityTypes[category] !== undefined) {
          activityTypes[category] = Math.min(1.0, activityTypes[category] + (score as number) * 0.3);
        }
      });

      // Determine accommodation style
      if (profile.explicitPreferences.accommodationType === 'budget') {
        accommodationStyle = 'budget';
      } else if (profile.explicitPreferences.accommodationType === 'luxury') {
        accommodationStyle = 'luxury';
      }

      // Determine transportation preference
      if (profile.mlInsights.activityPreference > 0.7) {
        transportationMode = 'time_optimized'; // Active people prefer faster transport
      } else if (profile.mlInsights.priceSensitivity > 0.7) {
        transportationMode = 'cost_optimized';
      } else {
        transportationMode = 'comfort_optimized';
      }
    }

    const foodPreferences: Record<string, number> = {
      local: 0.7,
      international: 0.5,
      street_food: 0.6,
      fine_dining: 0.4
    };

    return {
      activityTypes,
      accommodationStyle,
      foodPreferences,
      transportationMode
    };
  }

  private extractBehavioralPatterns(profile: UserPreferenceProfile | null, spendingPattern: any) {
    let decisionSpeed = 0.5;
    let adaptability = 0.5;
    let socialInfluence = 0.5;
    let planningHorizon = 7; // default 7 days

    if (profile) {
      // Decision speed based on navigation patterns
      decisionSpeed = Math.min(1.0, profile.implicitPreferences.behavioralPatterns.navigationSpeed / 10);

      // Adaptability based on spontaneity and risk tolerance
      adaptability = (profile.mlInsights.spontaneityScore + profile.mlInsights.riskTolerance) / 2;

      // Social influence (simplified)
      socialInfluence = profile.mlInsights.socialPreference || 0.5;

      // Planning horizon based on session patterns
      planningHorizon = Math.max(3, Math.min(30, profile.implicitPreferences.behavioralPatterns.averageSessionTime / 1000 / 60)); // minutes to days approximation
    }

    return {
      decisionSpeed,
      adaptability,
      socialInfluence,
      planningHorizon
    };
  }

  private createEmbeddingVector(
    budget: any,
    experience: any,
    behavioral: any
  ): number[] {
    // Create a simplified embedding vector
    return [
      budget.priceSensitivity,
      budget.riskTolerance,
      (Object.values(budget.categoryPriorities) as number[]).reduce((a, b) => a + b, 0) / 5,
      experience.activityTypes.adventure,
      experience.activityTypes.cultural,
      behavioral.decisionSpeed,
      behavioral.adaptability,
      behavioral.socialInfluence,
      behavioral.planningHorizon / 30 // normalize to 0-1
    ];
  }

  private calculateEmbeddingConfidence(profile: UserPreferenceProfile | null, spendingPattern: any): number {
    let confidence = 0.5; // base confidence

    if (profile) {
      confidence += 0.2; // Has profile data
      if (profile.lastUpdated && (Date.now() - profile.lastUpdated) < 7 * 24 * 60 * 60 * 1000) {
        confidence += 0.1; // Recent data
      }
    }

    if (spendingPattern.predictions.confidence > 0.7) {
      confidence += 0.2; // Good spending pattern data
    }

    return Math.min(1.0, confidence);
  }

  private async scoreAndRankOptions(
    options: Array<{
      id: string;
      name: string;
      category: string;
      cost: number;
      metadata?: any;
    }>,
    embedding: PreferenceEmbedding,
    context: PersonalizedRecommendation['context']
  ): Promise<PersonalizedRecommendation['recommendations']> {
    const scoredOptions = options.map(option => {
      const appealScore = this.calculateAppealScore(option, embedding, context);
      const confidence = this.calculateRecommendationConfidence(option, embedding);

      return {
        type: this.determineRecommendationType(option, context),
        item: {
          id: option.id,
          name: option.name,
          category: option.category,
          recommendedCost: option.cost
        },
        appealScore,
        confidence,
        reasoning: this.generateReasoning(option, embedding, appealScore),
        tradeoffs: this.generateTradeoffs(option, embedding)
      };
    });

    // Sort by appeal score and confidence
    return scoredOptions
      .sort((a, b) => (b.appealScore * b.confidence) - (a.appealScore * a.confidence))
      .slice(0, 5); // Top 5 recommendations
  }

  private calculateAppealScore(option: any, embedding: PreferenceEmbedding, context: string): number {
    let score = 0;
    let factors = 0;

    // Category alignment
    const categoryPriority = embedding.budgetPreferences.categoryPriorities[option.category] || 0.5;
    score += categoryPriority * 0.3;
    factors += 0.3;

    // Price sensitivity
    const priceScore = embedding.budgetPreferences.priceSensitivity > 0.5 ?
      (option.cost < (option.originalCost || option.cost) ? 0.8 : 0.4) : 0.6;
    score += priceScore * 0.3;
    factors += 0.3;

    // Experience alignment
    const experienceAlignment = this.calculateExperienceAlignment(option, embedding);
    score += experienceAlignment * 0.4;
    factors += 0.4;

    return score / factors;
  }

  private calculateExperienceAlignment(option: any, embedding: PreferenceEmbedding): number {
    // Simplified experience alignment
    let alignment = 0.5;

    if (option.category === 'food' && embedding.experiencePreferences.foodPreferences) {
      alignment = embedding.experiencePreferences.foodPreferences.local || 0.5;
    } else if (option.category === 'accommodation') {
      const styleMatch = option.metadata?.style === embedding.experiencePreferences.accommodationStyle;
      alignment = styleMatch ? 0.8 : 0.4;
    } else if (option.category === 'activities') {
      const activityType = option.metadata?.type;
      if (activityType && embedding.experiencePreferences.activityTypes[activityType]) {
        alignment = embedding.experiencePreferences.activityTypes[activityType];
      }
    }

    return alignment;
  }

  private calculateRecommendationConfidence(option: any, embedding: PreferenceEmbedding): number {
    return Math.min(embedding.confidence, 0.9); // Cap at 0.9 for recommendations
  }

  private determineRecommendationType(option: any, context: string): PersonalizedRecommendation['recommendations'][0]['type'] {
    if (context === 'alternative_suggestion') {
      return 'alternative_option';
    } else if (context === 'budget_adjustment') {
      return 'budget_reallocation';
    } else {
      return 'timing_adjustment';
    }
  }

  private generateReasoning(option: any, embedding: PreferenceEmbedding, appealScore: number): string[] {
    const reasoning: string[] = [];

    if (appealScore > 0.7) {
      reasoning.push('Highly aligned with your preferences');
    } else if (appealScore > 0.5) {
      reasoning.push('Moderately aligned with your preferences');
    }

    if (embedding.budgetPreferences.priceSensitivity > 0.6 && option.cost < (option.originalCost || option.cost)) {
      reasoning.push('Cost-effective option that matches your budget-conscious approach');
    }

    if (embedding.behavioralPatterns.adaptability > 0.7) {
      reasoning.push('Flexible option that allows for changes');
    }

    return reasoning;
  }

  private generateTradeoffs(option: any, embedding: PreferenceEmbedding): string[] {
    const tradeoffs: string[] = [];

    if (option.cost < (option.originalCost || option.cost)) {
      tradeoffs.push('May have fewer amenities or services');
    }

    if (embedding.experiencePreferences.accommodationStyle === 'luxury' && option.metadata?.style === 'budget') {
      tradeoffs.push('Reduced comfort compared to your usual preferences');
    }

    if (embedding.behavioralPatterns.decisionSpeed < 0.5) {
      tradeoffs.push('May require advance planning');
    }

    return tradeoffs;
  }

  private async updateFromBehavior(embedding: PreferenceEmbedding, behaviorData: UserBehaviorData): Promise<void> {
    // Update embedding based on new behavior observation
    if (behaviorData.targetType === 'budget') {
      embedding.budgetPreferences.priceSensitivity =
        (embedding.budgetPreferences.priceSensitivity + (behaviorData.targetData?.price ? 0.1 : 0)) / 2;
    }

    // Update last updated time
    embedding.lastUpdated = new Date();
  }

  private async updateFromFeedback(embedding: PreferenceEmbedding, feedbackData: any): Promise<void> {
    // Update based on explicit user feedback
    if (feedbackData.preferenceType === 'price_sensitivity') {
      embedding.budgetPreferences.priceSensitivity = feedbackData.value;
    }

    embedding.lastUpdated = new Date();
  }

  private async updateFromSpendingPattern(embedding: PreferenceEmbedding, patternData: any): Promise<void> {
    // Update based on spending pattern changes
    if (patternData.riskScore > 0.8) {
      embedding.budgetPreferences.spendingStyle = 'conservative';
      embedding.budgetPreferences.priceSensitivity = Math.max(embedding.budgetPreferences.priceSensitivity, 0.7);
    }

    embedding.lastUpdated = new Date();
  }
}

// Singleton instance
export const preferenceLearningSystem = new PreferenceLearningSystem();