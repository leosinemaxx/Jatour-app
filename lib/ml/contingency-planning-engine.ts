// Budget-as-a-Plan (BaaP) - Contingency Planning Engine
// Provides backup plans and alternative options for various failure scenarios

export interface ContingencyInput {
  userId: string;
  itinerary: any; // From ItineraryGenerator
  budget: {
    totalBudget: number;
    categoryBreakdown: {
      accommodation: number;
      transportation: number;
      food: number;
      activities: number;
      miscellaneous: number;
    };
  };
  riskAssessment: any; // From RiskAssessmentSystem
  userProfile: any;
  realTimeData?: {
    currentLocation?: any;
    weatherConditions?: any;
    transportationStatus?: any;
    localEvents?: any;
  };
}

export interface ContingencyPlan {
  id: string;
  triggerCondition: string;
  likelihood: number; // 0-1
  impact: number; // 0-1
  responseTime: 'immediate' | 'hours' | 'days';
  primaryAction: {
    type: 'reroute' | 'reschedule' | 'rebook' | 'cancel' | 'upgrade' | 'downgrade';
    description: string;
    cost: number;
    timeRequired: number; // minutes
  };
  backupActions: Array<{
    type: string;
    description: string;
    cost: number;
    feasibility: number; // 0-1
  }>;
  resourceRequirements: {
    contacts: string[];
    documents: string[];
    tools: string[];
  };
  communicationPlan: {
    notify: string[];
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  recoverySteps: Array<{
    step: number;
    action: string;
    responsible: string;
    timeframe: string;
  }>;
}

export interface ContingencyPlanningResult {
  primaryContingencies: ContingencyPlan[];
  secondaryContingencies: ContingencyPlan[];
  emergencyProtocols: Array<{
    scenario: string;
    immediateActions: string[];
    emergencyContacts: string[];
    recoveryPlan: string;
  }>;
  resourceAllocation: {
    emergencyFund: number;
    backupTransportation: number;
    alternativeAccommodation: number;
    communicationCredits: number;
  };
  monitoringTriggers: Array<{
    condition: string;
    threshold: number;
    action: string;
    notification: string;
  }>;
  successMetrics: {
    coverage: number; // Percentage of scenarios covered
    responseTime: number; // Average response time in minutes
    costEfficiency: number; // Cost per covered scenario
  };
}

export class ContingencyPlanningEngine {
  private mlEngine: any;

  constructor(mlEngine: any) {
    this.mlEngine = mlEngine;
  }

  generateContingencyPlans(input: ContingencyInput): ContingencyPlanningResult {
    console.log('[ContingencyPlanningEngine] Generating contingency plans for user:', input.userId);

    // Generate primary contingencies based on risk assessment
    const primaryContingencies = this.generatePrimaryContingencies(input);

    // Generate secondary contingencies for edge cases
    const secondaryContingencies = this.generateSecondaryContingencies(input);

    // Create emergency protocols
    const emergencyProtocols = this.createEmergencyProtocols(input);

    // Allocate resources for contingencies
    const resourceAllocation = this.allocateContingencyResources(input);

    // Set up monitoring triggers
    const monitoringTriggers = this.createMonitoringTriggers(input);

    // Calculate success metrics
    const successMetrics = this.calculateSuccessMetrics(primaryContingencies, secondaryContingencies, resourceAllocation);

    return {
      primaryContingencies,
      secondaryContingencies,
      emergencyProtocols,
      resourceAllocation,
      monitoringTriggers,
      successMetrics
    };
  }

  private generatePrimaryContingencies(input: ContingencyInput): ContingencyPlan[] {
    const contingencies: ContingencyPlan[] = [];
    const risks = input.riskAssessment?.riskFactors || [];

    // Transportation failure contingency
    const transportRisk = risks.find((r: any) => r.category === 'schedule' && r.type === 'schedule_delay');
    if (transportRisk || true) { // Always include basic transport contingency
      contingencies.push({
        id: 'transport_failure',
        triggerCondition: 'Transportation delay > 2 hours or cancellation',
        likelihood: transportRisk?.likelihood || 0.15,
        impact: 0.25,
        responseTime: 'hours',
        primaryAction: {
          type: 'reroute',
          description: 'Switch to alternative transportation mode',
          cost: 200000, // Cost of alternative transport
          timeRequired: 60 // 1 hour to arrange
        },
        backupActions: [
          {
            type: 'reschedule',
            description: 'Postpone affected activities to next available time',
            cost: 0,
            feasibility: 0.8
          },
          {
            type: 'cancel',
            description: 'Cancel remaining day activities and rest',
            cost: 0,
            feasibility: 1.0
          }
        ],
        resourceRequirements: {
          contacts: ['Local transportation hotline', 'Ride-sharing apps'],
          documents: ['Transportation tickets', 'Itinerary backup'],
          tools: ['Mobile data', 'Translation app']
        },
        communicationPlan: {
          notify: ['Travel companion', 'Emergency contact'],
          message: 'Transportation issue encountered, implementing backup plan',
          urgency: 'medium'
        },
        recoverySteps: [
          {
            step: 1,
            action: 'Assess current location and available alternatives',
            responsible: 'Traveler',
            timeframe: 'Immediate'
          },
          {
            step: 2,
            action: 'Contact alternative transportation provider',
            responsible: 'Traveler',
            timeframe: 'Within 30 minutes'
          },
          {
            step: 3,
            action: 'Update itinerary and notify affected parties',
            responsible: 'Traveler',
            timeframe: 'Within 1 hour'
          },
          {
            step: 4,
            action: 'Resume journey with alternative transport',
            responsible: 'Traveler',
            timeframe: 'Within 2 hours'
          }
        ]
      });
    }

    // Health emergency contingency
    const healthRisk = risks.find((r: any) => r.category === 'health_safety');
    if (healthRisk || true) { // Always include health contingency
      contingencies.push({
        id: 'health_emergency',
        triggerCondition: 'Health issue requiring medical attention',
        likelihood: healthRisk?.likelihood || 0.05,
        impact: 0.9,
        responseTime: 'immediate',
        primaryAction: {
          type: 'cancel',
          description: 'Seek immediate medical attention and cancel activities',
          cost: 500000, // Estimated medical costs
          timeRequired: 30 // 30 minutes to get help
        },
        backupActions: [
          {
            type: 'rebook',
            description: 'Reschedule remaining activities for recovery period',
            cost: 100000,
            feasibility: 0.6
          }
        ],
        resourceRequirements: {
          contacts: ['Emergency services (112/911)', 'Travel insurance', 'Embassy/Consulate'],
          documents: ['Travel insurance policy', 'Medical information', 'Passport'],
          tools: ['Emergency app', 'Medical translation card']
        },
        communicationPlan: {
          notify: ['Emergency contact', 'Travel insurance', 'Family'],
          message: 'Medical emergency - seeking immediate care',
          urgency: 'critical'
        },
        recoverySteps: [
          {
            step: 1,
            action: 'Ensure immediate safety and call emergency services',
            responsible: 'Traveler',
            timeframe: 'Immediate'
          },
          {
            step: 2,
            action: 'Contact travel insurance and embassy if needed',
            responsible: 'Traveler/Emergency contact',
            timeframe: 'Within 1 hour'
          },
          {
            step: 3,
            action: 'Notify all affected parties and update plans',
            responsible: 'Emergency contact',
            timeframe: 'Within 2 hours'
          },
          {
            step: 4,
            action: 'Arrange medical transport and accommodation changes',
            responsible: 'Travel insurance/Medical facility',
            timeframe: 'Within 4 hours'
          }
        ]
      });
    }

    // Budget overrun contingency
    const budgetRisk = risks.find((r: any) => r.category === 'budget');
    if (budgetRisk || true) { // Always include budget contingency
      contingencies.push({
        id: 'budget_overrun',
        triggerCondition: 'Daily spending exceeds budget by 20%',
        likelihood: budgetRisk?.likelihood || 0.2,
        impact: 0.3,
        responseTime: 'hours',
        primaryAction: {
          type: 'downgrade',
          description: 'Switch to budget alternatives for remaining activities',
          cost: -100000, // Cost savings
          timeRequired: 120 // 2 hours to find alternatives
        },
        backupActions: [
          {
            type: 'cancel',
            description: 'Cancel non-essential activities',
            cost: -50000,
            feasibility: 0.9
          }
        ],
        resourceRequirements: {
          contacts: ['Budget accommodation contacts', 'Local transport options'],
          documents: ['Budget breakdown', 'Emergency fund access'],
          tools: ['Expense tracking app', 'Local price comparison']
        },
        communicationPlan: {
          notify: ['Travel companion'],
          message: 'Adjusting plans to stay within budget',
          urgency: 'low'
        },
        recoverySteps: [
          {
            step: 1,
            action: 'Review current spending vs budget',
            responsible: 'Traveler',
            timeframe: 'Immediate'
          },
          {
            step: 2,
            action: 'Identify cost-saving alternatives',
            responsible: 'Traveler',
            timeframe: 'Within 1 hour'
          },
          {
            step: 3,
            action: 'Implement budget adjustments',
            responsible: 'Traveler',
            timeframe: 'Within 2 hours'
          },
          {
            step: 4,
            action: 'Monitor spending for rest of day',
            responsible: 'Traveler',
            timeframe: 'Ongoing'
          }
        ]
      });
    }

    // Weather disruption contingency
    const weatherRisk = risks.find((r: any) => r.type === 'weather_impact');
    if (weatherRisk) {
      contingencies.push({
        id: 'weather_disruption',
        triggerCondition: 'Severe weather affecting planned activities',
        likelihood: weatherRisk.likelihood,
        impact: weatherRisk.impact,
        responseTime: 'hours',
        primaryAction: {
          type: 'reschedule',
          description: 'Move outdoor activities to indoor alternatives',
          cost: 50000, // Cost of alternative activities
          timeRequired: 180 // 3 hours to reschedule
        },
        backupActions: [
          {
            type: 'reroute',
            description: 'Change destination to avoid weather-affected areas',
            cost: 150000,
            feasibility: 0.7
          }
        ],
        resourceRequirements: {
          contacts: ['Local weather services', 'Alternative activity providers'],
          documents: ['Weather forecast', 'Indoor activity options'],
          tools: ['Weather app', 'Local area knowledge']
        },
        communicationPlan: {
          notify: ['Travel companion'],
          message: 'Weather causing schedule changes',
          urgency: 'medium'
        },
        recoverySteps: [
          {
            step: 1,
            action: 'Monitor weather updates and assess impact',
            responsible: 'Traveler',
            timeframe: 'Immediate'
          },
          {
            step: 2,
            action: 'Identify suitable indoor alternatives',
            responsible: 'Traveler',
            timeframe: 'Within 1 hour'
          },
          {
            step: 3,
            action: 'Contact alternative activity providers',
            responsible: 'Traveler',
            timeframe: 'Within 2 hours'
          },
          {
            step: 4,
            action: 'Update schedule and notify companions',
            responsible: 'Traveler',
            timeframe: 'Within 3 hours'
          }
        ]
      });
    }

    return contingencies;
  }

  private generateSecondaryContingencies(input: ContingencyInput): ContingencyPlan[] {
    const contingencies: ContingencyPlan[] = [];

    // Lost documents contingency
    contingencies.push({
      id: 'lost_documents',
      triggerCondition: 'Loss of passport, tickets, or important documents',
      likelihood: 0.02,
      impact: 0.8,
      responseTime: 'immediate',
      primaryAction: {
        type: 'rebook',
        description: 'Contact embassy/consulate and arrange document replacement',
        cost: 1000000, // Estimated costs for document replacement
        timeRequired: 480 // 8 hours for processing
      },
      backupActions: [
        {
          type: 'cancel',
          description: 'Cancel trip and arrange emergency return',
          cost: 2000000,
          feasibility: 0.9
        }
      ],
      resourceRequirements: {
        contacts: ['Local embassy/consulate', 'Travel insurance', 'Emergency assistance'],
        documents: ['Digital copies of documents', 'Emergency contact list'],
        tools: ['Document backup app', 'Emergency communication']
      },
      communicationPlan: {
        notify: ['Emergency contact', 'Family', 'Employer'],
        message: 'Document loss - implementing emergency protocols',
        urgency: 'critical'
      },
      recoverySteps: [
        {
          step: 1,
          action: 'Report loss to local authorities and embassy',
          responsible: 'Traveler',
          timeframe: 'Immediate'
        },
        {
          step: 2,
          action: 'Contact travel insurance for assistance',
          responsible: 'Traveler/Emergency contact',
          timeframe: 'Within 1 hour'
        },
        {
          step: 3,
          action: 'Arrange temporary documents and accommodations',
          responsible: 'Embassy/Insurance',
          timeframe: 'Within 24 hours'
        },
        {
          step: 4,
          action: 'Continue trip or arrange return as appropriate',
          responsible: 'Traveler',
          timeframe: 'Within 48 hours'
        }
      ]
    });

    // Accommodation issues contingency
    contingencies.push({
      id: 'accommodation_issues',
      triggerCondition: 'Hotel overbooking, maintenance issues, or unacceptable conditions',
      likelihood: 0.08,
      impact: 0.4,
      responseTime: 'hours',
      primaryAction: {
        type: 'rebook',
        description: 'Find alternative accommodation immediately',
        cost: 300000, // Cost of alternative hotel
        timeRequired: 120 // 2 hours to find and move
      },
      backupActions: [
        {
          type: 'upgrade',
          description: 'Move to better accommodation if current is unacceptable',
          cost: 500000,
          feasibility: 0.6
        }
      ],
      resourceRequirements: {
        contacts: ['Hotel booking service', 'Alternative accommodation providers'],
        documents: ['Booking confirmation', 'Payment details'],
        tools: ['Hotel booking apps', 'Local area maps']
      },
      communicationPlan: {
        notify: ['Travel companion', 'Booking service'],
        message: 'Accommodation issue - relocating to alternative',
        urgency: 'medium'
      },
      recoverySteps: [
        {
          step: 1,
          action: 'Assess accommodation issue and negotiate with hotel',
          responsible: 'Traveler',
          timeframe: 'Immediate'
        },
        {
          step: 2,
          action: 'Search for alternative accommodation',
          responsible: 'Traveler',
          timeframe: 'Within 30 minutes'
        },
        {
          step: 3,
          action: 'Book alternative and arrange transport',
          responsible: 'Traveler',
          timeframe: 'Within 1 hour'
        },
        {
          step: 4,
          action: 'Move to new accommodation and update plans',
          responsible: 'Traveler',
          timeframe: 'Within 2 hours'
        }
      ]
    });

    return contingencies;
  }

  private createEmergencyProtocols(input: ContingencyInput): Array<{
    scenario: string;
    immediateActions: string[];
    emergencyContacts: string[];
    recoveryPlan: string;
  }> {
    return [
      {
        scenario: 'Medical Emergency',
        immediateActions: [
          'Call emergency services (112/911)',
          'Contact travel insurance immediately',
          'Notify emergency contact',
          'Provide location and medical details'
        ],
        emergencyContacts: [
          'Emergency services: 112/911',
          'Travel insurance emergency line',
          'Embassy/Consulate 24/7 emergency',
          'Family emergency contact'
        ],
        recoveryPlan: 'Follow medical facility guidance, contact insurance for coverage, arrange alternative transportation and accommodation as needed'
      },
      {
        scenario: 'Security Threat',
        immediateActions: [
          'Move to safe location immediately',
          'Contact local authorities if needed',
          'Notify emergency contact',
          'Follow local security advisories'
        ],
        emergencyContacts: [
          'Local police: 110 (Indonesia)',
          'Embassy/Consulate security section',
          'Travel advisory services',
          'Emergency contact'
        ],
        recoveryPlan: 'Monitor situation, consider early return if threat persists, document all incidents for insurance claims'
      },
      {
        scenario: 'Natural Disaster',
        immediateActions: [
          'Follow local authority evacuation orders',
          'Contact embassy for assistance',
          'Notify emergency contact with status',
          'Conserve phone battery and communication'
        ],
        emergencyContacts: [
          'Local disaster management authorities',
          'Embassy emergency line',
          'International disaster relief organizations',
          'Family emergency contact'
        ],
        recoveryPlan: 'Follow evacuation procedures, coordinate with embassy for repatriation, claim travel insurance for losses'
      },
      {
        scenario: 'Communication Failure',
        immediateActions: [
          'Use backup communication methods',
          'Locate internet cafes or public WiFi',
          'Contact embassy if completely isolated',
          'Conserve device battery'
        ],
        emergencyContacts: [
          'Embassy communication assistance',
          'Travel companion backup numbers',
          'Hotel front desk',
          'Local SIM card providers'
        ],
        recoveryPlan: 'Establish alternative communication channels, update emergency contacts on status, arrange meeting points if separated from companions'
      }
    ];
  }

  private allocateContingencyResources(input: ContingencyInput): {
    emergencyFund: number;
    backupTransportation: number;
    alternativeAccommodation: number;
    communicationCredits: number;
  } {
    const totalBudget = input.budget.totalBudget;
    const riskLevel = input.riskAssessment?.riskLevel || 'medium';

    // Base allocations as percentage of total budget
    const basePercentages = {
      low: { emergency: 0.03, transport: 0.02, accommodation: 0.02, communication: 0.01 },
      medium: { emergency: 0.05, transport: 0.03, accommodation: 0.03, communication: 0.02 },
      high: { emergency: 0.08, transport: 0.05, accommodation: 0.05, communication: 0.03 },
      critical: { emergency: 0.12, transport: 0.08, accommodation: 0.08, communication: 0.05 }
    };

    const percentages = basePercentages[riskLevel as keyof typeof basePercentages];

    return {
      emergencyFund: totalBudget * percentages.emergency,
      backupTransportation: totalBudget * percentages.transport,
      alternativeAccommodation: totalBudget * percentages.accommodation,
      communicationCredits: totalBudget * percentages.communication
    };
  }

  private createMonitoringTriggers(input: ContingencyInput): Array<{
    condition: string;
    threshold: number;
    action: string;
    notification: string;
  }> {
    return [
      {
        condition: 'Daily spending',
        threshold: 0.8, // 80% of daily budget
        action: 'Send spending alert and suggest cost-saving measures',
        notification: 'You\'ve spent 80% of your daily budget. Consider reviewing expenses.'
      },
      {
        condition: 'Activity completion rate',
        threshold: 0.5, // 50% of planned activities missed
        action: 'Suggest schedule adjustments and backup activities',
        notification: 'Multiple activities have been missed. Would you like alternative suggestions?'
      },
      {
        condition: 'Health status',
        threshold: 0.7, // Self-reported health score
        action: 'Recommend rest and medical consultation if needed',
        notification: 'Your health status indicates you may need to slow down the pace.'
      },
      {
        condition: 'Weather impact',
        threshold: 0.6, // 60% chance of disruptive weather
        action: 'Suggest indoor alternatives and schedule changes',
        notification: 'Weather conditions may affect your plans. Indoor alternatives available.'
      },
      {
        condition: 'Transportation status',
        threshold: 0.8, // 80% confidence in on-time arrival
        action: 'Monitor transportation and prepare alternatives',
        notification: 'Transportation may be delayed. Backup options are ready.'
      }
    ];
  }

  private calculateSuccessMetrics(
    primaryContingencies: ContingencyPlan[],
    secondaryContingencies: ContingencyPlan[],
    resourceAllocation: any
  ): {
    coverage: number;
    responseTime: number;
    costEfficiency: number;
  } {
    // Calculate coverage (what percentage of risk scenarios are covered)
    const totalRisks = 10; // Estimated total possible risk scenarios
    const coveredRisks = primaryContingencies.length + secondaryContingencies.length;
    const coverage = Math.min(coveredRisks / totalRisks, 1);

    // Calculate average response time
    const allContingencies = [...primaryContingencies, ...secondaryContingencies];
    const responseTimeMap = { immediate: 30, hours: 120, days: 1440 }; // minutes
    const avgResponseTime = allContingencies.reduce((sum, plan) =>
      sum + responseTimeMap[plan.responseTime], 0) / allContingencies.length;

    // Calculate cost efficiency (total contingency cost per covered scenario)
    const totalContingencyCost = Object.values(resourceAllocation).reduce((a: number, b: any) => a + (b as number), 0);
    const costEfficiency = totalContingencyCost / coveredRisks;

    return {
      coverage: coverage * 100, // Convert to percentage
      responseTime: avgResponseTime,
      costEfficiency
    };
  }
}

// Singleton instance
export const contingencyPlanningEngine = new ContingencyPlanningEngine(null);