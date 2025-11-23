// Budget-as-a-Plan (BaaP) - Travel Contract Generator
// Generates comprehensive travel contracts with 95% budget adherence guarantee

import { AdherencePrediction } from './adherence-prediction-engine';
import { OptimizedPlan } from './plan-optimization-service';
import { RiskAssessment } from './risk-assessment-system';
import { ContingencyPlanningResult } from './contingency-planning-engine';

export interface TravelContractInput {
  userId: string;
  userProfile: any;
  optimizedPlan: OptimizedPlan;
  adherencePrediction: AdherencePrediction;
  riskAssessment: RiskAssessment;
  contingencyPlanning: ContingencyPlanningResult;
  contractTerms: {
    validityPeriod: number; // days
    guaranteeLevel: number; // 0.95 for 95%
    serviceFees: number;
    refundPolicy: string;
  };
}

export interface TravelContract {
  contractId: string;
  userId: string;
  generatedAt: number;
  validUntil: number;

  // Contract parties
  parties: {
    provider: {
      name: string;
      guarantee: string;
      contact: string;
    };
    customer: {
      name: string;
      id: string;
      agreedAt: number;
    };
  };

  // Core guarantee
  guarantee: {
    level: number; // 95%
    coverage: string;
    conditions: string[];
    exclusions: string[];
    claimProcess: string[];
  };

  // Guaranteed plan details
  plan: {
    itinerary: any;
    budget: any;
    adherence: number;
    confidence: number;
  };

  // Risk management
  riskManagement: {
    identifiedRisks: Array<{
      risk: string;
      mitigation: string;
      coverage: string;
    }>;
    monitoring: Array<{
      trigger: string;
      action: string;
      responsibility: string;
    }>;
  };

  // Tactical suggestions
  tacticalSuggestions: Array<{
    type: string;
    description: string;
    potentialSavings: number;
    ease: string;
    conditions: string;
  }>;

  // Contingency plans
  contingencies: {
    primary: Array<{
      scenario: string;
      response: string;
      coverage: string;
    }>;
    emergency: Array<{
      scenario: string;
      actions: string[];
      contacts: string[];
    }>;
  };

  // Service terms
  terms: {
    validity: string;
    amendments: string;
    termination: string;
    liability: string;
    disputeResolution: string;
  };

  // Performance metrics
  performance: {
    adherenceTarget: number;
    currentAdherence: number;
    riskScore: number;
    contingencyCoverage: number;
  };

  // Digital signature
  signatures: {
    provider: {
      signed: boolean;
      timestamp: number;
      signature: string;
    };
    customer: {
      signed: boolean;
      timestamp: number;
      signature: string;
    };
  };
}

export class TravelContractGenerator {
  private contractCounter = 0;

  generateContract(input: TravelContractInput): TravelContract {
    console.log('[TravelContractGenerator] Generating travel contract for user:', input.userId);

    const contractId = this.generateContractId();
    const now = Date.now();
    const validUntil = now + (input.contractTerms.validityPeriod * 24 * 60 * 60 * 1000);

    return {
      contractId,
      userId: input.userId,
      generatedAt: now,
      validUntil,

      parties: {
        provider: {
          name: 'JaTour Smart Travel Platform',
          guarantee: '95% Budget Adherence Guarantee',
          contact: 'support@jatour.com'
        },
        customer: {
          name: input.userProfile?.name || 'Valued Customer',
          id: input.userId,
          agreedAt: now
        }
      },

      guarantee: this.generateGuaranteeSection(input),

      plan: {
        itinerary: input.optimizedPlan.optimizedItinerary,
        budget: input.optimizedPlan.optimizedBudget,
        adherence: input.optimizedPlan.guaranteedAdherence,
        confidence: input.optimizedPlan.confidence
      },

      riskManagement: this.generateRiskManagementSection(input),

      tacticalSuggestions: this.generateTacticalSuggestionsSection(input),

      contingencies: this.generateContingenciesSection(input),

      terms: this.generateTermsSection(input),

      performance: {
        adherenceTarget: input.contractTerms.guaranteeLevel,
        currentAdherence: input.optimizedPlan.guaranteedAdherence,
        riskScore: input.riskAssessment.overallRiskScore,
        contingencyCoverage: input.contingencyPlanning.successMetrics.coverage
      },

      signatures: {
        provider: {
          signed: true,
          timestamp: now,
          signature: 'JaTour_Platform_Auto_Signature'
        },
        customer: {
          signed: false,
          timestamp: 0,
          signature: ''
        }
      }
    };
  }

  private generateContractId(): string {
    this.contractCounter++;
    const timestamp = Date.now();
    return `BaaP-${timestamp}-${this.contractCounter.toString().padStart(4, '0')}`;
  }

  private generateGuaranteeSection(input: TravelContractInput): TravelContract['guarantee'] {
    const guaranteeLevel = input.contractTerms.guaranteeLevel;

    return {
      level: guaranteeLevel,
      coverage: `JaTour guarantees that your actual travel expenses will not exceed ${Math.round(guaranteeLevel * 100)}% of the optimized budget plan. If expenses exceed this threshold due to factors within our control, JaTour will cover the difference.`,
      conditions: [
        'Follow the optimized itinerary and budget allocations provided',
        'Use recommended transportation and accommodation options',
        'Report any changes or issues immediately through the JaTour app',
        'Maintain regular communication during the trip',
        'Allow the platform to monitor and adjust plans as needed'
      ],
      exclusions: [
        'Personal purchases and discretionary spending',
        'Force majeure events (natural disasters, political unrest)',
        'Changes made without platform approval',
        'Pre-existing medical conditions not disclosed',
        'Travel outside the planned itinerary without coordination'
      ],
      claimProcess: [
        'Document all expenses with receipts and photos',
        'Report the issue through the JaTour app within 24 hours',
        'Provide supporting evidence and circumstances',
        'JaTour will review and process claims within 7 business days',
        'Approved claims will be refunded within 14 business days'
      ]
    };
  }

  private generateRiskManagementSection(input: TravelContractInput): TravelContract['riskManagement'] {
    const riskAssessment = input.riskAssessment;

    return {
      identifiedRisks: riskAssessment.riskFactors.slice(0, 5).map(risk => ({
        risk: risk.description,
        mitigation: risk.mitigationStrategies[0]?.strategy || 'Monitor and adjust as needed',
        coverage: risk.impact > 0.5 ? 'Full coverage available' : 'Partial coverage available'
      })),
      monitoring: riskAssessment.monitoringSchedule.map(schedule => ({
        trigger: schedule.timePoint,
        action: schedule.checks.join(', '),
        responsibility: 'Shared between platform and traveler'
      }))
    };
  }

  private generateTacticalSuggestionsSection(input: TravelContractInput): TravelContract['tacticalSuggestions'] {
    return input.optimizedPlan.tacticalSuggestions.map(suggestion => ({
      type: suggestion.type,
      description: suggestion.description,
      potentialSavings: suggestion.potentialSavings,
      ease: suggestion.ease,
      conditions: 'Available throughout the trip when budget pressures occur'
    }));
  }

  private generateContingenciesSection(input: TravelContractInput): TravelContract['contingencies'] {
    const contingencyPlanning = input.contingencyPlanning;

    return {
      primary: contingencyPlanning.primaryContingencies.map(contingency => ({
        scenario: contingency.triggerCondition,
        response: contingency.primaryAction.description,
        coverage: `Up to IDR ${contingency.primaryAction.cost.toLocaleString()} covered`
      })),
      emergency: contingencyPlanning.emergencyProtocols.map(protocol => ({
        scenario: protocol.scenario,
        actions: protocol.immediateActions,
        contacts: protocol.emergencyContacts
      }))
    };
  }

  private generateTermsSection(input: TravelContractInput): TravelContract['terms'] {
    const validityDays = input.contractTerms.validityPeriod;

    return {
      validity: `This contract is valid from the date of signature until ${validityDays} days after the planned trip end date, or until all obligations are fulfilled.`,
      amendments: 'Amendments to this contract must be agreed upon by both parties in writing. The platform reserves the right to update contingency plans based on changing conditions.',
      termination: 'Either party may terminate this contract with 48 hours notice. Early termination may affect guarantee coverage. The platform may terminate if terms are violated.',
      liability: 'JaTour\'s liability is limited to the guarantee amount specified. The platform is not liable for personal injury, loss of personal belongings, or acts of third parties.',
      disputeResolution: 'Disputes will be resolved through negotiation first, followed by mediation if necessary. All disputes subject to Indonesian law and jurisdiction.'
    };
  }

  // Contract validation and verification
  validateContract(contract: TravelContract): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check guarantee level
    if (contract.guarantee.level < 0.90) {
      errors.push('Guarantee level must be at least 90%');
    }

    // Check validity period
    if (contract.validUntil <= contract.generatedAt) {
      errors.push('Contract validity period is invalid');
    }

    // Check plan adherence
    if (contract.performance.currentAdherence < contract.performance.adherenceTarget) {
      errors.push('Current plan does not meet adherence target');
    }

    // Check required sections
    if (!contract.plan.itinerary) {
      errors.push('Contract must include itinerary details');
    }

    if (!contract.plan.budget) {
      errors.push('Contract must include budget details');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Contract signing
  signContract(contract: TravelContract, customerSignature: string): TravelContract {
    return {
      ...contract,
      signatures: {
        ...contract.signatures,
        customer: {
          signed: true,
          timestamp: Date.now(),
          signature: customerSignature
        }
      }
    };
  }

  // Contract status checking
  getContractStatus(contract: TravelContract): 'active' | 'expired' | 'terminated' | 'fulfilled' {
    const now = Date.now();

    if (now > contract.validUntil) {
      return 'expired';
    }

    if (contract.signatures.customer.signed && contract.signatures.provider.signed) {
      // Check if trip is completed (simplified logic)
      // In real implementation, this would check against actual trip data
      return 'active';
    }

    return 'active'; // Default to active
  }

  // Generate contract summary for display
  generateContractSummary(contract: TravelContract): {
    title: string;
    guarantee: string;
    keyTerms: string[];
    coverage: string;
    nextSteps: string[];
  } {
    return {
      title: `Travel Contract ${contract.contractId}`,
      guarantee: `${Math.round(contract.guarantee.level * 100)}% Budget Adherence Guarantee`,
      keyTerms: [
        `Valid until: ${new Date(contract.validUntil).toLocaleDateString()}`,
        `Coverage: Up to IDR ${contract.plan.budget.totalBudget.toLocaleString()}`,
        `Risk Score: ${Math.round(contract.performance.riskScore * 100)}%`,
        `Contingency Coverage: ${Math.round(contract.performance.contingencyCoverage)}%`
      ],
      coverage: 'Comprehensive coverage for budget overruns, travel disruptions, and emergencies as outlined in the full contract.',
      nextSteps: [
        'Review and sign the contract',
        'Download contingency plans',
        'Set up trip monitoring alerts',
        'Begin your guaranteed journey!'
      ]
    };
  }
}

// Singleton instance
export const travelContractGenerator = new TravelContractGenerator();