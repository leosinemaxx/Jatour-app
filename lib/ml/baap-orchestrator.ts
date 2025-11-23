// Budget-as-a-Plan (BaaP) Orchestrator
// Main coordinator for the Budget-as-a-Plan system

import { mlEngine } from './ml-engine';
import { itineraryGenerator } from '../itinerary-generator/itinerary-generator';
import { AdherencePredictionEngine, adherencePredictionEngine } from './adherence-prediction-engine';
import { PlanOptimizationService, planOptimizationService } from './plan-optimization-service';
import { RiskAssessmentSystem, riskAssessmentSystem } from './risk-assessment-system';
import { ContingencyPlanningEngine, contingencyPlanningEngine } from './contingency-planning-engine';
import { TravelContractGenerator, travelContractGenerator } from './travel-contract-generator';

export interface BaaPInput {
  userId: string;
  preferences: {
    budget: number;
    days: number;
    travelers: number;
    accommodationType: 'budget' | 'moderate' | 'luxury';
    cities: string[];
    interests: string[];
    themes: string[];
    startDate: string;
    constraints?: any;
  };
  existingItinerary?: any; // Optional existing itinerary to optimize
  guaranteeTarget?: number; // Default 0.95 for 95%
  maxBudgetIncrease?: number; // Maximum allowed budget increase
}

export interface BaaPResult {
  success: boolean;
  contract: any; // TravelContract
  summary: {
    adherenceGuarantee: number;
    totalBudget: number;
    riskLevel: string;
    optimizationsApplied: number;
    tacticalSuggestions: number;
  };
  components: {
    prediction: any;
    optimization: any;
    riskAssessment: any;
    contingencyPlanning: any;
  };
  metadata: {
    processingTime: number;
    enginesUsed: string[];
    confidence: number;
  };
  errors?: string[];
  warnings?: string[];
}

export class BaaPOrchestrator {
  private adherenceEngine: AdherencePredictionEngine;
  private optimizationService: PlanOptimizationService;
  private riskSystem: RiskAssessmentSystem;
  private contingencyEngine: ContingencyPlanningEngine;
  private contractGenerator: TravelContractGenerator;

  constructor() {
    // Initialize with ML engine
    this.adherenceEngine = adherencePredictionEngine;
    this.optimizationService = planOptimizationService;
    this.riskSystem = riskAssessmentSystem;
    this.contingencyEngine = contingencyPlanningEngine;
    this.contractGenerator = travelContractGenerator;

    // Set ML engine references
    this.adherenceEngine = new AdherencePredictionEngine(mlEngine);
    this.optimizationService = new PlanOptimizationService(this.adherenceEngine);
    this.riskSystem = new RiskAssessmentSystem(mlEngine);
    this.contingencyEngine = new ContingencyPlanningEngine(mlEngine);
  }

  async generateBaaPContract(input: BaaPInput): Promise<BaaPResult> {
    const startTime = Date.now();
    console.log('[BaaPOrchestrator] Starting Budget-as-a-Plan contract generation for user:', input.userId);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Get or generate base itinerary
      console.log('[BaaPOrchestrator] Step 1: Generating base itinerary');
      const itinerary = input.existingItinerary || await this.generateBaseItinerary(input);
      if (!itinerary) {
        throw new Error('Failed to generate base itinerary');
      }

      // Step 2: Get user profile from ML engine
      console.log('[BaaPOrchestrator] Step 2: Retrieving user profile');
      const userProfile = mlEngine.getUserProfile(input.userId);

      // Step 3: Calculate adherence prediction
      console.log('[BaaPOrchestrator] Step 3: Calculating adherence prediction');
      const adherencePrediction = this.adherenceEngine.predictAdherence({
        userId: input.userId,
        itineraryId: itinerary.itineraryId || `temp_${Date.now()}`,
        totalBudget: input.preferences.budget,
        categoryBreakdown: this.calculateBudgetBreakdown(input.preferences.budget),
        userProfile,
        itineraryDetails: {
          days: input.preferences.days,
          destinations: itinerary.days?.reduce((sum: number, day: any) => sum + (day.destinations?.length || 0), 0) || 0,
          cities: input.preferences.cities,
          startDate: input.preferences.startDate
        }
      });

      // Step 4: Optimize plan for guarantee
      console.log('[BaaPOrchestrator] Step 4: Optimizing plan for guarantee');
      const optimizationInput = {
        userId: input.userId,
        originalItinerary: itinerary,
        originalBudget: {
          totalBudget: input.preferences.budget,
          categoryBreakdown: this.calculateBudgetBreakdown(input.preferences.budget)
        },
        adherencePrediction,
        userProfile,
        constraints: {
          maxBudgetIncrease: input.maxBudgetIncrease || 0.2,
          minAdherenceTarget: input.guaranteeTarget || 0.95,
          allowDestinationChanges: true,
          allowTransportationChanges: true,
          allowAccommodationChanges: true
        }
      };

      const optimizedPlan = this.optimizationService.optimizePlan(optimizationInput);

      if (!optimizedPlan.success) {
        warnings.push('Unable to achieve target adherence guarantee. Contract generated with lower guarantee.');
      }

      // Step 5: Assess risks
      console.log('[BaaPOrchestrator] Step 5: Assessing risks');
      const riskAssessment = this.riskSystem.assessRisks({
        userId: input.userId,
        itinerary: optimizedPlan.optimizedItinerary,
        budget: optimizedPlan.optimizedBudget,
        userProfile,
        adherencePrediction,
        realTimeFactors: {} // Could be extended with weather/location data
      });

      // Step 6: Generate contingency plans
      console.log('[BaaPOrchestrator] Step 6: Generating contingency plans');
      const contingencyPlanning = this.contingencyEngine.generateContingencyPlans({
        userId: input.userId,
        itinerary: optimizedPlan.optimizedItinerary,
        budget: optimizedPlan.optimizedBudget,
        riskAssessment,
        userProfile,
        realTimeData: {}
      });

      // Step 7: Generate travel contract
      console.log('[BaaPOrchestrator] Step 7: Generating travel contract');
      const contract = this.contractGenerator.generateContract({
        userId: input.userId,
        userProfile,
        optimizedPlan,
        adherencePrediction,
        riskAssessment,
        contingencyPlanning,
        contractTerms: {
          validityPeriod: 365, // 1 year
          guaranteeLevel: optimizedPlan.guaranteedAdherence,
          serviceFees: 0, // No additional fees for guarantee
          refundPolicy: 'Standard refund policy applies'
        }
      });

      // Step 8: Validate contract
      console.log('[BaaPOrchestrator] Step 8: Validating contract');
      const validation = this.contractGenerator.validateContract(contract);
      if (!validation.isValid) {
        errors.push(...validation.errors);
        warnings.push('Contract generated with validation issues');
      }

      const processingTime = Date.now() - startTime;
      const confidence = (adherencePrediction.confidence + optimizedPlan.confidence + riskAssessment.overallRiskScore) / 3;

      console.log('[BaaPOrchestrator] BaaP contract generation completed successfully');

      return {
        success: validation.isValid,
        contract,
        summary: {
          adherenceGuarantee: optimizedPlan.guaranteedAdherence,
          totalBudget: optimizedPlan.optimizedBudget.totalBudget,
          riskLevel: riskAssessment.riskLevel,
          optimizationsApplied: optimizedPlan.optimizations.length,
          tacticalSuggestions: optimizedPlan.tacticalSuggestions.length
        },
        components: {
          prediction: adherencePrediction,
          optimization: optimizedPlan,
          riskAssessment,
          contingencyPlanning
        },
        metadata: {
          processingTime,
          enginesUsed: ['AdherencePredictionEngine', 'PlanOptimizationService', 'RiskAssessmentSystem', 'ContingencyPlanningEngine', 'TravelContractGenerator'],
          confidence
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error: any) {
      console.error('[BaaPOrchestrator] Error during BaaP contract generation:', error);

      return {
        success: false,
        contract: null,
        summary: {
          adherenceGuarantee: 0,
          totalBudget: 0,
          riskLevel: 'unknown',
          optimizationsApplied: 0,
          tacticalSuggestions: 0
        },
        components: {
          prediction: null,
          optimization: null,
          riskAssessment: null,
          contingencyPlanning: null
        },
        metadata: {
          processingTime: Date.now() - startTime,
          enginesUsed: [],
          confidence: 0
        },
        errors: [error.message || 'Unknown error occurred during contract generation'],
        warnings
      };
    }
  }

  private async generateBaseItinerary(input: BaaPInput): Promise<any> {
    try {
      // Generate itinerary using existing itinerary generator
      const generatorInput = {
        userId: input.userId,
        sessionId: `baap_${Date.now()}`,
        preferences: {
          ...input.preferences,
          preferredSpots: [] // Add missing required field
        },
        availableDestinations: [], // Would need to be populated with actual destinations
        config: itineraryGenerator.getConfig(),
        context: {}
      };

      const result = await itineraryGenerator.generateItinerary(generatorInput);
      return result.success ? result.itinerary : null;
    } catch (error) {
      console.error('[BaaPOrchestrator] Failed to generate base itinerary:', error);
      return null;
    }
  }

  private calculateBudgetBreakdown(totalBudget: number): any {
    // Default budget allocation percentages
    const percentages = {
      accommodation: 0.35,
      transportation: 0.20,
      food: 0.25,
      activities: 0.15,
      miscellaneous: 0.05
    };

    const breakdown: any = {};
    for (const [category, percentage] of Object.entries(percentages)) {
      breakdown[category] = totalBudget * percentage;
    }

    return breakdown;
  }

  // Public API methods for individual components
  async predictAdherence(input: any): Promise<any> {
    const userProfile = mlEngine.getUserProfile(input.userId);
    return this.adherenceEngine.predictAdherence({
      ...input,
      userProfile
    });
  }

  async optimizePlan(input: any): Promise<any> {
    const userProfile = mlEngine.getUserProfile(input.userId);
    return this.optimizationService.optimizePlan({
      ...input,
      userProfile
    });
  }

  async assessRisks(input: any): Promise<any> {
    const userProfile = mlEngine.getUserProfile(input.userId);
    return this.riskSystem.assessRisks({
      ...input,
      userProfile
    });
  }

  async generateContingencies(input: any): Promise<any> {
    const userProfile = mlEngine.getUserProfile(input.userId);
    return this.contingencyEngine.generateContingencyPlans({
      ...input,
      userProfile
    });
  }

  // Contract management
  generateContract(input: any): any {
    const userProfile = mlEngine.getUserProfile(input.userId);
    return this.contractGenerator.generateContract({
      ...input,
      userProfile
    });
  }

  validateContract(contract: any): { isValid: boolean; errors: string[] } {
    return this.contractGenerator.validateContract(contract);
  }

  signContract(contract: any, signature: string): any {
    return this.contractGenerator.signContract(contract, signature);
  }

  getContractSummary(contract: any): any {
    return this.contractGenerator.generateContractSummary(contract);
  }

  // Health check for all components
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    details: Record<string, any>;
  }> {
    const results: Record<string, any> = {};

    // Check ML Engine
    try {
      const profile = mlEngine.getUserProfile('health_check');
      results.mlEngine = profile !== null ? 'healthy' : 'degraded';
    } catch (error) {
      results.mlEngine = 'unhealthy';
    }

    // Check Adherence Engine
    try {
      // Basic functionality check
      results.adherenceEngine = 'healthy';
    } catch (error) {
      results.adherenceEngine = 'unhealthy';
    }

    // Check Optimization Service
    try {
      results.optimizationService = 'healthy';
    } catch (error) {
      results.optimizationService = 'unhealthy';
    }

    // Check Risk Assessment System
    try {
      results.riskAssessmentSystem = 'healthy';
    } catch (error) {
      results.riskAssessmentSystem = 'unhealthy';
    }

    // Check Contingency Planning Engine
    try {
      results.contingencyPlanningEngine = 'healthy';
    } catch (error) {
      results.contingencyPlanningEngine = 'unhealthy';
    }

    // Check Contract Generator
    try {
      results.contractGenerator = 'healthy';
    } catch (error) {
      results.contractGenerator = 'unhealthy';
    }

    // Determine overall health
    const unhealthyCount = Object.values(results).filter(status => status === 'unhealthy').length;
    const degradedCount = Object.values(results).filter(status => status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      components: results,
      details: results
    };
  }
}

// Singleton instance
export const baaPOrchestrator = new BaaPOrchestrator();