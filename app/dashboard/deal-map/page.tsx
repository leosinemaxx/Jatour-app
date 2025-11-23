"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, List, Grid, Zap, TrendingUp, Star, DollarSign, MapPin } from 'lucide-react';
import VendorDiscovery from '@/components/VendorDiscovery';
import { useDynamicDeals, useDealNotifications } from '@/lib/hooks/useDynamicDeals';
import dynamicImport from 'next/dynamic';

// Force dynamic rendering to avoid SSR issues with client-side components
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Dynamic import for DealMapComponent to avoid SSR issues with react-leaflet
const DealMapComponent = dynamicImport(
  () => import('@/components/maps/DealMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
);

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

export default function DealMapPage() {
  const [userId] = useState('user-123'); // Mock user ID - in production, get from auth
  const [currentLocation] = useState('Surabaya');
  const [selectedDeal, setSelectedDeal] = useState<ScoredDeal | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'grid'>('map');
  const [showNotifications, setShowNotifications] = useState(false);

  const { deals, loading, error, refreshDeals, isStale } = useDynamicDeals({
    userId,
    location: currentLocation,
    enableRealTime: true
  });

  const { notifications, clearNotification, clearAllNotifications } = useDealNotifications(userId);

  // Mock itinerary integration - in production, this would connect to actual itinerary data
  const [currentItinerary, setCurrentItinerary] = useState({
    id: 'itinerary-1',
    title: 'Surabaya Adventure',
    destinations: ['Monas', 'Istiqlal Mosque', 'National Monument'],
    budget: 500000,
    duration: 3
  });

  const addDealToItinerary = (deal: ScoredDeal) => {
    // Mock implementation - in production, this would update the actual itinerary
    console.log('Adding deal to itinerary:', deal);
    alert(`Deal "${deal.title}" added to your itinerary! 🎉`);
  };

  const getGenZMessage = () => {
    const messages = [
      "🔥 Hot deals just dropped!",
      "💰 Save big on your next adventure!",
      "⭐ Discover amazing deals near you!",
      "🎯 Perfect deals for your vibe!",
      "🚀 Level up your trip with these deals!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Map className="h-8 w-8 text-blue-600" />
                Deal Map Explorer
              </h1>
              <p className="text-gray-600 mt-1">{getGenZMessage()}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Alerts
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>

                {showNotifications && notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Deal Alerts</h3>
                        <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-r-none"
                >
                  <Map className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Itinerary Context */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Trip: {currentItinerary.title}</h2>
                <p className="text-blue-100">
                  {currentItinerary.destinations.length} destinations • {currentItinerary.duration} days • Budget: Rp {currentItinerary.budget.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">Finding deals for your itinerary...</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {deals.reduce((sum, deal) => sum + (deal.originalPrice - deal.discountedPrice), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(deals.reduce((sum, deal) => sum + (deal.rating || 0), 0) / deals.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Deal Locations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(deals.map(d => d.location)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Best Discount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(...deals.map(d => d.discountPercentage))}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Interactive Map
            </TabsTrigger>
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Vendor Discovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Deal Map - {currentLocation}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Interactive map showing deals in your area. Green = Low prices, Blue = Best ratings, Gold = Promotions
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <DealMapComponent
                    deals={deals}
                    center={[-7.2575, 112.7521]} // Surabaya center
                    zoom={12}
                    onDealClick={(deal) => setSelectedDeal(deal)}
                    onClusterClick={(cluster) => console.log('Cluster clicked:', cluster)}
                    selectedDealId={selectedDeal?.id}
                    showClusters={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selected Deal Details */}
            {selectedDeal && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        🎯 {selectedDeal.title}
                        <Badge className="bg-green-100 text-green-800">
                          {selectedDeal.discountPercentage}% OFF
                        </Badge>
                      </CardTitle>
                      <p className="text-gray-600">{selectedDeal.merchantName}</p>
                    </div>
                    <Button onClick={() => addDealToItinerary(selectedDeal)} className="bg-gradient-to-r from-blue-500 to-purple-600">
                      Add to Itinerary 🚀
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Deal Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original Price:</span>
                          <span className="line-through">Rp {selectedDeal.originalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discounted Price:</span>
                          <span className="font-bold text-green-600">Rp {selectedDeal.discountedPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>You Save:</span>
                          <span className="font-bold text-green-600">
                            Rp {(selectedDeal.originalPrice - selectedDeal.discountedPrice).toLocaleString()}
                          </span>
                        </div>
                        {selectedDeal.rating && (
                          <div className="flex justify-between">
                            <span>Rating:</span>
                            <span>⭐ {selectedDeal.rating}/5 ({selectedDeal.reviews} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Why This Deal?</h4>
                      <ul className="text-sm space-y-1">
                        {selectedDeal.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6">
            <VendorDiscovery
              userId={userId}
              currentLocation={currentLocation}
              onDealSelect={(deal) => setSelectedDeal(deal)}
              onVendorSelect={(vendorId) => setSelectedVendor(vendorId)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}