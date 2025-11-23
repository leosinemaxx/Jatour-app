import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mlEngine } from '../../../lib/ml/ml-engine';

export interface SavingsOpportunity {
  id: string;
  category: string;
  type: 'transportation' | 'accommodation' | 'food' | 'activities' | 'general';
  title: string;
  description: string;
  potentialSavings: number;
  confidence: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: 'immediate' | 'short_term' | 'long_term';
  requirements?: string[];
  alternatives?: Array<{
    option: string;
    cost: number;
    benefits: string[];
  }>;
  detectedAt: Date;
}

@Injectable()
export class SavingsOpportunityDetector {
  constructor(private prisma: PrismaService) {}

  async detectSavingsOpportunities(userId: string): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];

    // Get user's recent expenses
    const recentExpenses = await this.getRecentExpenses(userId);

    // Analyze transportation savings
    const transportOpportunities = await this.detectTransportationSavings(userId, recentExpenses);
    opportunities.push(...transportOpportunities);

    // Analyze accommodation savings
    const accommodationOpportunities = await this.detectAccommodationSavings(userId, recentExpenses);
    opportunities.push(...accommodationOpportunities);

    // Analyze food savings
    const foodOpportunities = await this.detectFoodSavings(userId, recentExpenses);
    opportunities.push(...foodOpportunities);

    // Analyze activity savings
    const activityOpportunities = await this.detectActivitySavings(userId, recentExpenses);
    opportunities.push(...activityOpportunities);

    // ML-based personalized opportunities
    const mlOpportunities = await this.detectMLOpportunities(userId, recentExpenses);
    opportunities.push(...mlOpportunities);

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  private async getRecentExpenses(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        itinerary: true,
      },
    });
  }

  private async detectTransportationSavings(userId: string, expenses: any[]): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];
    const transportExpenses = expenses.filter(e => e.category === 'transportation');

    if (transportExpenses.length === 0) return opportunities;

    const totalTransportSpending = transportExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgTransportCost = totalTransportSpending / transportExpenses.length;

    // Check for ride-hailing frequency
    const rideHailingCount = transportExpenses.filter(e =>
      e.description?.toLowerCase().includes('grab') ||
      e.description?.toLowerCase().includes('gojek') ||
      e.description?.toLowerCase().includes('uber')
    ).length;

    if (rideHailingCount > 5) {
      opportunities.push({
        id: 'transport-bus-alternative',
        category: 'transportation',
        type: 'transportation',
        title: 'Switch to Bus Transport',
        description: 'You frequently use ride-hailing services. Switching to bus transport could save you up to 112,000 per trip.',
        potentialSavings: 112000,
        confidence: 0.8,
        difficulty: 'medium',
        timeframe: 'immediate',
        requirements: ['Check local bus routes', 'Download transport app'],
        alternatives: [
          {
            option: 'Local Bus',
            cost: avgTransportCost * 0.3,
            benefits: ['Cost-effective', 'Regular schedule', 'Less traffic stress'],
          },
          {
            option: 'Bicycle Rental',
            cost: avgTransportCost * 0.1,
            benefits: ['Very cheap', 'Healthy', 'Explore at your own pace'],
          },
        ],
        detectedAt: new Date(),
      });
    }

    // Check for high transportation spending
    if (avgTransportCost > 50000) {
      opportunities.push({
        id: 'transport-bundling',
        category: 'transportation',
        type: 'transportation',
        title: 'Bundle Transportation with Accommodation',
        description: 'High transportation costs detected. Many hotels offer free airport transfers or discounted transport packages.',
        potentialSavings: Math.min(avgTransportCost * 0.4, 150000),
        confidence: 0.7,
        difficulty: 'easy',
        timeframe: 'short_term',
        requirements: ['Contact hotel for transport packages'],
        detectedAt: new Date(),
      });
    }

    return opportunities;
  }

  private async detectAccommodationSavings(userId: string, expenses: any[]): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];
    const accommodationExpenses = expenses.filter(e => e.category === 'accommodation');

    if (accommodationExpenses.length === 0) return opportunities;

    const totalAccommodationSpending = accommodationExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgAccommodationCost = totalAccommodationSpending / accommodationExpenses.length;

    // Check for last-minute bookings (higher prices)
    const recentBookings = accommodationExpenses.filter(e => {
      const daysDiff = (new Date().getTime() - e.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < 7; // Booked within last week
    });

    if (recentBookings.length > 0) {
      opportunities.push({
        id: 'accommodation-advance-booking',
        category: 'accommodation',
        type: 'accommodation',
        title: 'Book Accommodation in Advance',
        description: 'Last-minute bookings are costing you more. Booking 2-3 weeks in advance can save up to 30%.',
        potentialSavings: Math.min(avgAccommodationCost * 0.3, 200000),
        confidence: 0.9,
        difficulty: 'easy',
        timeframe: 'short_term',
        requirements: ['Plan trips ahead', 'Use booking apps with advance discounts'],
        detectedAt: new Date(),
      });
    }

    // Check for premium accommodation spending
    if (avgAccommodationCost > 300000) {
      opportunities.push({
        id: 'accommodation-budget-options',
        category: 'accommodation',
        type: 'accommodation',
        title: 'Consider Budget Accommodation Options',
        description: 'Your accommodation costs are high. Budget hotels or guesthouses can provide similar comfort at lower prices.',
        potentialSavings: avgAccommodationCost * 0.25,
        confidence: 0.75,
        difficulty: 'medium',
        timeframe: 'immediate',
        alternatives: [
          {
            option: 'Budget Hotel',
            cost: avgAccommodationCost * 0.7,
            benefits: ['Significant savings', 'Often well-reviewed', 'Central locations'],
          },
          {
            option: 'Guesthouse/Home stay',
            cost: avgAccommodationCost * 0.5,
            benefits: ['Local experience', 'Home-cooked meals', 'Cultural immersion'],
          },
        ],
        detectedAt: new Date(),
      });
    }

    return opportunities;
  }

  private async detectFoodSavings(userId: string, expenses: any[]): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];
    const foodExpenses = expenses.filter(e => e.category === 'food');

    if (foodExpenses.length === 0) return opportunities;

    const totalFoodSpending = foodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgFoodCost = totalFoodSpending / foodExpenses.length;

    // Check for restaurant frequency
    const restaurantCount = foodExpenses.filter(e =>
      e.description?.toLowerCase().includes('restaurant') ||
      e.description?.toLowerCase().includes('resto') ||
      e.merchant?.toLowerCase().includes('restaurant')
    ).length;

    if (restaurantCount > foodExpenses.length * 0.6) {
      opportunities.push({
        id: 'food-street-food',
        category: 'food',
        type: 'food',
        title: 'Try Local Street Food',
        description: 'You frequently eat at restaurants. Street food offers authentic local cuisine at much lower prices.',
        potentialSavings: Math.min(avgFoodCost * 0.6, 80000),
        confidence: 0.85,
        difficulty: 'easy',
        timeframe: 'immediate',
        requirements: ['Research safe street food areas', 'Try local recommendations'],
        alternatives: [
          {
            option: 'Street Food',
            cost: avgFoodCost * 0.4,
            benefits: ['Authentic experience', 'Much cheaper', 'Local culture'],
          },
          {
            option: 'Local Warung',
            cost: avgFoodCost * 0.6,
            benefits: ['Traditional setting', 'Reasonable prices', 'Local interaction'],
          },
        ],
        detectedAt: new Date(),
      });
    }

    // Check for high food spending
    if (avgFoodCost > 100000) {
      opportunities.push({
        id: 'food-cooking',
        category: 'food',
        type: 'food',
        title: 'Cook Some Meals',
        description: 'Your food expenses are high. Cooking some meals at your accommodation can significantly reduce costs.',
        potentialSavings: avgFoodCost * 0.4,
        confidence: 0.7,
        difficulty: 'medium',
        timeframe: 'short_term',
        requirements: ['Access to kitchen', 'Local market knowledge'],
        detectedAt: new Date(),
      });
    }

    return opportunities;
  }

  private async detectActivitySavings(userId: string, expenses: any[]): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];
    const activityExpenses = expenses.filter(e =>
      e.category === 'tourism tickets' ||
      e.category === 'activities'
    );

    if (activityExpenses.length === 0) return opportunities;

    const totalActivitySpending = activityExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgActivityCost = totalActivitySpending / activityExpenses.length;

    // Check for individual ticket purchases
    if (activityExpenses.length > 3) {
      opportunities.push({
        id: 'activity-combo-tickets',
        category: 'activities',
        type: 'activities',
        title: 'Purchase Combo Tickets',
        description: 'You\'ve purchased multiple activity tickets individually. Combo packages often provide significant discounts.',
        potentialSavings: Math.min(avgActivityCost * 0.25, 100000),
        confidence: 0.8,
        difficulty: 'easy',
        timeframe: 'short_term',
        requirements: ['Check for combo deals', 'Plan activities in advance'],
        detectedAt: new Date(),
      });
    }

    // Check for high activity spending
    if (avgActivityCost > 150000) {
      opportunities.push({
        id: 'activity-free-alternatives',
        category: 'activities',
        type: 'activities',
        title: 'Explore Free Activities',
        description: 'Your activity expenses are high. Many destinations offer free attractions and walking tours.',
        potentialSavings: avgActivityCost * 0.5,
        confidence: 0.6,
        difficulty: 'easy',
        timeframe: 'immediate',
        alternatives: [
          {
            option: 'Free Walking Tours',
            cost: 0,
            benefits: ['Learn local history', 'Meet other travelers', 'See hidden gems'],
          },
          {
            option: 'Public Parks & Beaches',
            cost: 0,
            benefits: ['Relaxing', 'Beautiful scenery', 'No cost'],
          },
        ],
        detectedAt: new Date(),
      });
    }

    return opportunities;
  }

  private async detectMLOpportunities(userId: string, expenses: any[]): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];

    try {
      const userProfile = mlEngine.getUserProfile(userId);

      if (userProfile) {
        // Price sensitivity based savings
        if (userProfile.mlInsights.priceSensitivity > 0.8) {
          opportunities.push({
            id: 'ml-price-sensitive-general',
            category: 'general',
            type: 'general',
            title: 'Maximize Your Price Sensitivity',
            description: 'Your behavior shows high price sensitivity. Focus on deals, discounts, and budget options for maximum savings.',
            potentialSavings: 200000, // Estimated based on profile
            confidence: 0.9,
            difficulty: 'easy',
            timeframe: 'immediate',
            requirements: ['Use discount apps', 'Check for promotions regularly'],
            detectedAt: new Date(),
          });
        }

        // Activity preference optimization
        if (userProfile.mlInsights.activityPreference > 0.7) {
          opportunities.push({
            id: 'ml-activity-bundling',
            category: 'activities',
            type: 'activities',
            title: 'Bundle Adventure Activities',
            description: 'You prefer active experiences. Look for adventure packages that bundle multiple activities at discounted rates.',
            potentialSavings: 150000,
            confidence: 0.75,
            difficulty: 'medium',
            timeframe: 'short_term',
            requirements: ['Research adventure packages', 'Book in advance'],
            detectedAt: new Date(),
          });
        }

        // Spontaneity based savings
        if (userProfile.mlInsights.spontaneityScore > 0.7) {
          opportunities.push({
            id: 'ml-spontaneous-deals',
            category: 'general',
            type: 'general',
            title: 'Take Advantage of Last-Minute Deals',
            description: 'Your spontaneous nature aligns perfectly with last-minute deals and flash sales.',
            potentialSavings: 100000,
            confidence: 0.8,
            difficulty: 'easy',
            timeframe: 'immediate',
            requirements: ['Monitor flash sales', 'Be flexible with dates'],
            detectedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error detecting ML-based opportunities:', error);
    }

    return opportunities;
  }
}