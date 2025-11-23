import { NextRequest, NextResponse } from 'next/server';

// Define types locally to avoid server imports
interface ScoredDeal {
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
  averageSpendPerHour?: number;
  relevanceScore: number;
  budgetAlignmentScore: number;
  categoryFitScore: number;
  locationRelevanceScore: number;
  timeRelevanceScore: number;
  userPreferenceScore: number;
  reasoning: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const location = searchParams.get('location');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Mock deal data - in production, this would come from the DealMatchingService
    const mockDeals = [
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
        location: location || 'Surabaya',
        coordinates: { lat: -7.2575, lng: 112.7521 },
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms: ['Berlaku untuk dine-in', 'Tidak dapat digabung dengan promo lain'],
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        rating: 4.7,
        reviews: 234,
        tags: ['Traditional', 'Family', 'Local Favorite'],
        budgetCategory: 'budget',
        averageSpendPerHour: 25000,
        relevanceScore: 85,
        budgetAlignmentScore: 90,
        categoryFitScore: 80,
        locationRelevanceScore: 95,
        timeRelevanceScore: 100,
        userPreferenceScore: 75,
        reasoning: ['Excellent budget fit', 'Perfect category match', 'Ideal location match']
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
        location: location || 'Surabaya',
        coordinates: { lat: -7.2653, lng: 112.7427 },
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        terms: ['Berlaku weekday 07:00-11:00', 'Minimum 2 orang'],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        rating: 4.8,
        reviews: 189,
        tags: ['Coffee', 'Brunch', 'Artisan'],
        budgetCategory: 'moderate',
        averageSpendPerHour: 40000,
        relevanceScore: 88,
        budgetAlignmentScore: 85,
        categoryFitScore: 90,
        locationRelevanceScore: 90,
        timeRelevanceScore: 95,
        userPreferenceScore: 85,
        reasoning: ['Good budget alignment', 'Perfect category match', 'Convenient location']
      },
      {
        id: 'deal-003',
        merchantId: 'merchant-003',
        merchantName: 'Hotel Majapahit Budget',
        title: 'Standard Room 2 Nights',
        description: 'Kamar standard dengan breakfast untuk 2 orang, 2 malam',
        category: 'accommodation',
        originalPrice: 400000,
        discountedPrice: 280000,
        discountPercentage: 30,
        location: location || 'Surabaya',
        coordinates: { lat: -7.2633, lng: 112.7398 },
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        terms: ['Include breakfast', 'Free cancellation 24h before check-in'],
        imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
        rating: 4.0,
        reviews: 156,
        tags: ['Budget Hotel', 'City Center', 'Breakfast Included'],
        budgetCategory: 'budget',
        relevanceScore: 82,
        budgetAlignmentScore: 88,
        categoryFitScore: 75,
        locationRelevanceScore: 85,
        timeRelevanceScore: 90,
        userPreferenceScore: 80,
        reasoning: ['Good budget alignment', 'Available during trip dates', 'Convenient location']
      }
    ];

    // Filter by location if specified
    const filteredDeals = location
      ? mockDeals.filter(deal => deal.location.toLowerCase().includes(location.toLowerCase()))
      : mockDeals;

    return NextResponse.json({
      deals: filteredDeals,
      totalCount: filteredDeals.length,
      lastUpdated: new Date(),
      cacheUsed: false
    });

  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, location, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // In production, this would use the DealMatchingService to find personalized deals
    // For now, return mock data

    const mockPersonalizedDeals = [
      {
        id: 'personal-deal-001',
        merchantId: 'merchant-001',
        merchantName: 'Warung Bu Rudi',
        title: 'Sate Ayam Special Set Menu',
        description: 'Paket sate ayam lengkap dengan nasi, lalapan, dan es teh untuk 2 orang',
        category: 'dining',
        originalPrice: 75000,
        discountedPrice: 55000,
        discountPercentage: 27,
        location: location || 'Surabaya',
        coordinates: { lat: -7.2575, lng: 112.7521 },
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms: ['Berlaku untuk dine-in', 'Tidak dapat digabung dengan promo lain'],
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        rating: 4.7,
        reviews: 234,
        tags: ['Traditional', 'Family', 'Local Favorite'],
        budgetCategory: 'budget',
        averageSpendPerHour: 25000,
        relevanceScore: 92,
        budgetAlignmentScore: 95,
        categoryFitScore: 85,
        locationRelevanceScore: 98,
        timeRelevanceScore: 100,
        userPreferenceScore: 90,
        reasoning: ['Excellent budget fit', 'Perfect category match', 'Ideal location match', 'Matches your preferences perfectly']
      }
    ];

    return NextResponse.json({
      deals: mockPersonalizedDeals,
      totalCount: mockPersonalizedDeals.length,
      userId,
      preferences: preferences || {}
    });

  } catch (error) {
    console.error('Error creating personalized deals:', error);
    return NextResponse.json(
      { error: 'Failed to create personalized deals' },
      { status: 500 }
    );
  }
}