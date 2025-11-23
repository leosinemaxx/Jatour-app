"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Star, Clock, DollarSign, Users, Search, Filter } from 'lucide-react';
import { useDynamicDeals, useDealBenchmarking } from '@/lib/hooks/useDynamicDeals';

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

interface VendorDiscoveryProps {
  userId: string;
  currentLocation?: string;
  onDealSelect?: (deal: ScoredDeal) => void;
  onVendorSelect?: (merchantId: string) => void;
}

const VendorDiscovery = ({
  userId,
  currentLocation = 'Surabaya',
  onDealSelect,
  onVendorSelect
}: VendorDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'rating' | 'distance'>('relevance');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const { deals, loading, error, refreshDeals } = useDynamicDeals({
    userId,
    location: currentLocation,
    enableRealTime: true
  });

  const { benchmark, loading: benchmarkLoading } = useDealBenchmarking(selectedDealId || '');

  // Filter and sort deals
  const filteredDeals = deals
    .filter(deal => {
      const matchesSearch = !searchQuery ||
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || deal.category === selectedCategory;
      const matchesBudget = selectedBudget === 'all' || deal.budgetCategory === selectedBudget;

      return matchesSearch && matchesCategory && matchesBudget;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.discountedPrice - b.discountedPrice;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          // Mock distance sorting - in production, calculate actual distance
          return Math.random() - 0.5;
        case 'relevance':
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

  // Group deals by merchant for vendor discovery
  const vendors = filteredDeals.reduce((acc, deal) => {
    if (!acc[deal.merchantId]) {
      acc[deal.merchantId] = {
        id: deal.merchantId,
        name: deal.merchantName,
        category: deal.category,
        location: deal.location,
        deals: [],
        averageRating: 0,
        totalDeals: 0,
        bestDiscount: 0
      };
    }

    acc[deal.merchantId].deals.push(deal);
    acc[deal.merchantId].totalDeals = acc[deal.merchantId].deals.length;
    acc[deal.merchantId].averageRating = acc[deal.merchantId].deals
      .filter((d: ScoredDeal) => d.rating)
      .reduce((sum: number, d: ScoredDeal, _index: number, arr: ScoredDeal[]) => sum + (d.rating! / arr.length), 0);
    acc[deal.merchantId].bestDiscount = Math.max(
      acc[deal.merchantId].bestDiscount,
      deal.discountPercentage
    );

    return acc;
  }, {} as Record<string, any>);

  const vendorList = Object.values(vendors);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dining': return '🍽️';
      case 'accommodation': return '🏨';
      case 'transportation': return '🚗';
      case 'activities': return '🎭';
      case 'shopping': return '🛍️';
      default: return '📍';
    }
  };

  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case 'budget': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refreshDeals}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors, deals, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="dining">🍽️ Dining</SelectItem>
              <SelectItem value="accommodation">🏨 Accommodation</SelectItem>
              <SelectItem value="transportation">🚗 Transportation</SelectItem>
              <SelectItem value="activities">🎭 Activities</SelectItem>
              <SelectItem value="shopping">🛍️ Shopping</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBudget} onValueChange={setSelectedBudget}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Budgets</SelectItem>
              <SelectItem value="budget">💰 Budget</SelectItem>
              <SelectItem value="moderate">💳 Moderate</SelectItem>
              <SelectItem value="premium">💎 Premium</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">🎯 Relevance</SelectItem>
              <SelectItem value="price">💰 Price</SelectItem>
              <SelectItem value="rating">⭐ Rating</SelectItem>
              <SelectItem value="distance">📍 Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Found {filteredDeals.length} deals from {vendorList.length} vendors
        </p>
        <Button variant="outline" size="sm" onClick={refreshDeals}>
          🔄 Refresh
        </Button>
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendorList.map((vendor: any) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onVendorSelect?.(vendor.id)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(vendor.category)}</span>
                    {vendor.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {vendor.location}
                  </p>
                </div>
                <Badge className={getBudgetColor(vendor.deals[0]?.budgetCategory)}>
                  {vendor.deals[0]?.budgetCategory}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* Vendor Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{vendor.averageRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{vendor.totalDeals} deals</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>Up to {vendor.bestDiscount}% off</span>
                  </div>
                </div>

                {/* Top Deals Preview */}
                <div className="space-y-2">
                  {vendor.deals.slice(0, 2).map((deal: ScoredDeal) => (
                    <div
                      key={deal.id}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDealId(deal.id);
                        onDealSelect?.(deal);
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">{deal.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {deal.discountPercentage}% OFF
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Rp {deal.discountedPrice.toLocaleString()}</span>
                        <span className="line-through">Rp {deal.originalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Benchmarking for selected deal */}
                {selectedDealId && vendor.deals.some((d: ScoredDeal) => d.id === selectedDealId) && benchmark && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">💡 Price Insight</h5>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Market Average:</span>
                        <span>Rp {benchmark.averageMarketPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Position:</span>
                        <span className={benchmark.percentile > 50 ? 'text-green-600' : 'text-orange-600'}>
                          {benchmark.percentile}th percentile
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or location</p>
          <Button onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedBudget('all');
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default VendorDiscovery;