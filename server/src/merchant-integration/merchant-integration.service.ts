import { Injectable, Logger } from '@nestjs/common';

export interface MerchantDeal {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  category: 'dining' | 'accommodation' | 'transportation' | 'activities' | 'shopping';
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  validUntil: Date;
  terms: string[];
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  tags: string[];
  budgetCategory: 'budget' | 'moderate' | 'premium';
  averageSpendPerHour?: number; // For dining deals
}

export interface DealAggregatorResponse {
  deals: MerchantDeal[];
  totalCount: number;
  lastUpdated: Date;
}

@Injectable()
export class MerchantIntegrationService {
  private readonly logger = new Logger(MerchantIntegrationService.name);

  /**
   * Fetch deals from external deal aggregator APIs
   */
  async fetchDealsFromAggregator(
    location?: string,
    category?: string,
    budgetRange?: { min: number; max: number }
  ): Promise<MerchantDeal[]> {
    try {
      // Mock external API calls - in production, these would be real API integrations
      const deals = await this.mockFetchDeals(location, category, budgetRange);

      this.logger.log(`Fetched ${deals.length} deals from aggregator`);
      return deals;
    } catch (error) {
      this.logger.error('Error fetching deals from aggregator:', error);
      return [];
    }
  }

  /**
   * Get deals specifically for dining category with budget per hour consideration
   */
  async fetchDiningDeals(
    location: string,
    budgetPerHour: number,
    guestCount: number = 1
  ): Promise<MerchantDeal[]> {
    try {
      const deals = await this.fetchDealsFromAggregator(location, 'dining');

      // Filter deals that fit the budget per hour constraint
      const filteredDeals = deals.filter(deal => {
        if (deal.category !== 'dining' || !deal.averageSpendPerHour) return false;

        // Calculate cost per hour for the number of guests
        const totalHourlyCost = deal.averageSpendPerHour * guestCount;
        return totalHourlyCost <= budgetPerHour;
      });

      this.logger.log(`Found ${filteredDeals.length} dining deals within ${budgetPerHour} IDR/hour budget`);
      return filteredDeals;
    } catch (error) {
      this.logger.error('Error fetching dining deals:', error);
      return [];
    }
  }

  /**
   * Mock implementation of external deal aggregator API
   * In production, this would integrate with real APIs like:
   * - Traveloka Deals API
   * - Gojek Deals API
   * - Local merchant partnerships
   * - Deal aggregation platforms
   */
  private async mockFetchDeals(
    location?: string,
    category?: string,
    budgetRange?: { min: number; max: number }
  ): Promise<MerchantDeal[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockDeals: MerchantDeal[] = [
      // Dining deals
      {
        id: 'deal-001',
        merchantId: 'merchant-001',
        merchantName: 'Warung Bu Rudi',
        title: 'Sate Ayam Special Set Menu',
        description: 'Paket sate ayam lengkap dengan nasi, lalapan, dan es teh untuk 2 orang',
        category: 'dining',
        originalPrice: 75000,
        discountedPrice: 55000,
        discountPercentage: 27,
        location: 'Surabaya',
        coordinates: { lat: -7.2575, lng: 112.7521 },
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        terms: ['Berlaku untuk dine-in', 'Tidak dapat digabung dengan promo lain'],
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        rating: 4.7,
        reviews: 234,
        tags: ['Traditional', 'Family', 'Local Favorite'],
        budgetCategory: 'budget',
        averageSpendPerHour: 25000 // 25k per hour for dining
      },
      {
        id: 'deal-002',
        merchantId: 'merchant-002',
        merchantName: 'Kedai Kopi Suroboyo',
        title: 'Brunch Package + Free Coffee',
        description: 'Paket brunch lengkap dengan kopi single origin dan pastry artisan',
        category: 'dining',
        originalPrice: 85000,
        discountedPrice: 65000,
        discountPercentage: 24,
        location: 'Surabaya',
        coordinates: { lat: -7.2653, lng: 112.7427 },
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        terms: ['Berlaku weekday 07:00-11:00', 'Minimum 2 orang'],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        rating: 4.8,
        reviews: 189,
        tags: ['Coffee', 'Brunch', 'Artisan'],
        budgetCategory: 'moderate',
        averageSpendPerHour: 40000
      },
      {
        id: 'deal-003',
        merchantId: 'merchant-003',
        merchantName: 'Rumah Bakso Malang',
        title: 'Family Bakso Package',
        description: 'Paket bakso komplet untuk 4 orang dengan pangsit dan gorengan',
        category: 'dining',
        originalPrice: 120000,
        discountedPrice: 85000,
        discountPercentage: 29,
        location: 'Malang',
        coordinates: { lat: -7.9667, lng: 112.6333 },
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        terms: ['Berlaku weekend', 'Include tax and service'],
        imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
        rating: 4.6,
        reviews: 312,
        tags: ['Family', 'Traditional', 'Complete Meal'],
        budgetCategory: 'budget',
        averageSpendPerHour: 30000
      },
      // Accommodation deals
      {
        id: 'deal-004',
        merchantId: 'merchant-004',
        merchantName: 'Hotel Majapahit Budget',
        title: 'Standard Room 2 Nights',
        description: 'Kamar standard dengan breakfast untuk 2 orang, 2 malam',
        category: 'accommodation',
        originalPrice: 400000,
        discountedPrice: 280000,
        discountPercentage: 30,
        location: 'Surabaya',
        coordinates: { lat: -7.2633, lng: 112.7398 },
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        terms: ['Include breakfast', 'Free cancellation 24h before check-in'],
        imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
        rating: 4.0,
        reviews: 156,
        tags: ['Budget Hotel', 'City Center', 'Breakfast Included'],
        budgetCategory: 'budget'
      },
      // Transportation deals
      {
        id: 'deal-005',
        merchantId: 'merchant-005',
        merchantName: 'Blue Bird Taxi',
        title: 'Airport Transfer Package',
        description: 'Transfer dari Bandara Juanda ke hotel di Surabaya dengan AC',
        category: 'transportation',
        originalPrice: 150000,
        discountedPrice: 110000,
        discountPercentage: 27,
        location: 'Surabaya',
        coordinates: { lat: -7.3797, lng: 112.7868 },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        terms: ['24/7 service', 'Professional driver', 'Safe journey guarantee'],
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
        rating: 4.5,
        reviews: 892,
        tags: ['Airport Transfer', 'Safe', 'Reliable'],
        budgetCategory: 'moderate'
      }
    ];

    // Apply filters
    let filteredDeals = mockDeals;

    if (location) {
      filteredDeals = filteredDeals.filter(deal =>
        deal.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (category) {
      filteredDeals = filteredDeals.filter(deal => deal.category === category);
    }

    if (budgetRange) {
      filteredDeals = filteredDeals.filter(deal =>
        deal.discountedPrice >= budgetRange.min && deal.discountedPrice <= budgetRange.max
      );
    }

    return filteredDeals;
  }

  /**
   * Get merchant details by ID
   */
  async getMerchantDetails(merchantId: string): Promise<any> {
    // Mock merchant details - in production, this would fetch from merchant database/API
    const mockMerchants = {
      'merchant-001': {
        id: 'merchant-001',
        name: 'Warung Bu Rudi',
        type: 'restaurant',
        address: 'Jl. Gubeng Kertajaya No. 15, Gubeng, Surabaya',
        phone: '+62 31 501 2345',
        rating: 4.7,
        totalReviews: 234,
        specialties: ['Sate Ayam Madura', 'Gado-gado Surabaya', 'Nasi Pecel'],
        operatingHours: {
          monday: '08:00-22:00',
          tuesday: '08:00-22:00',
          wednesday: '08:00-22:00',
          thursday: '08:00-22:00',
          friday: '08:00-23:00',
          saturday: '08:00-23:00',
          sunday: '09:00-21:00'
        }
      }
    };

    return mockMerchants[merchantId] || null;
  }
}