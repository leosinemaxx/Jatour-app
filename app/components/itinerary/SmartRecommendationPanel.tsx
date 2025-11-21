"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp,
  Heart,
  Plus,
  CheckCircle,
  Zap,
  Award,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Recommendation {
  id: string;
  type: 'accommodation' | 'transportation' | 'restaurant' | 'destination' | 'activity';
  title: string;
  description: string;
  rating: number;
  price: number;
  currency: string;
  image?: string;
  city: string;
  category: string;
  tags: string[];
  reason: string;
  matchScore: number;
  estimatedDuration?: number;
  openingHours?: string;
  address?: string;
}

interface RecommendationCategory {
  id: string;
  name: string;
  icon: any;
  count: number;
  color: string;
}

interface SmartRecommendationPanelProps {
  userPreferences: {
    budget: number;
    days: number;
    interests: string[];
    cities: string[];
    accommodationType: 'budget' | 'moderate' | 'luxury';
  };
  selectedBlocks: any[];
  onAddRecommendation: (recommendation: Recommendation) => void;
  className?: string;
}

export default function SmartRecommendationPanel({
  userPreferences,
  selectedBlocks,
  onAddRecommendation,
  className
}: SmartRecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock recommendations based on preferences
  const mockRecommendations: Recommendation[] = [
    // Destinations
    {
      id: '1',
      type: 'destination',
      title: 'Gunung Bromo Sunrise Tour',
      description: 'Experience the legendary sunrise view from Mount Bromo. Perfect for adventure seekers and photography enthusiasts.',
      rating: 4.8,
      price: 150000,
      currency: 'IDR',
      city: 'Probolinggo',
      category: 'Mountain',
      tags: ['sunrise', 'photography', 'adventure', 'hiking'],
      reason: 'Perfect match for your interest in mountains and adventure activities',
      matchScore: 95,
      estimatedDuration: 240,
      address: 'Taman Nasional Bromo Tengger Semeru'
    },
    {
      id: '2',
      type: 'destination',
      title: 'Pantai Klayar Beach Day',
      description: 'Stunning beach with unique rock formations and the famous sea fountain phenomenon.',
      rating: 4.6,
      price: 25000,
      currency: 'IDR',
      city: 'Pacitan',
      category: 'Beach',
      tags: ['beach', 'photography', 'relaxation', 'nature'],
      reason: 'Great for relaxation and natural beauty photography',
      matchScore: 88,
      estimatedDuration: 180,
      address: 'Desa Klayar, Kec. Donorojo, Pacitan'
    },
    
    // Accommodations
    {
      id: '3',
      type: 'accommodation',
      title: 'Golden Tulip Holland Resort Batu',
      description: 'Luxury resort with spa, infinity pool, and mountain views. Perfect for a relaxing stay.',
      rating: 4.7,
      price: 800000,
      currency: 'IDR',
      city: 'Batu',
      category: 'Luxury Hotel',
      tags: ['luxury', 'spa', 'pool', 'mountain-view'],
      reason: 'Matches your moderate to luxury accommodation preference',
      matchScore: 92,
      address: 'Jl. Oro-Oro Ombo No. 278, Batu'
    },
    {
      id: '4',
      type: 'accommodation',
      title: 'Batu Backpacker Lodge',
      description: 'Budget-friendly hostel perfect for young travelers with shared facilities.',
      rating: 4.0,
      price: 80000,
      currency: 'IDR',
      city: 'Batu',
      category: 'Hostel',
      tags: ['budget', 'backpacker', 'social', 'young-travelers'],
      reason: 'Budget-friendly option within your price range',
      matchScore: 85,
      address: 'Jl. Pasar Baru No. 8, Batu'
    },

    // Restaurants
    {
      id: '5',
      type: 'restaurant',
      title: 'Warung Bu Yuli',
      description: 'Legendary warung serving authentic Malang cuisine including pecel, gado-gado, and sate.',
      rating: 4.6,
      price: 35000,
      currency: 'IDR',
      city: 'Malang',
      category: 'Traditional Indonesian',
      tags: ['traditional', 'local-cuisine', 'affordable', 'authentic'],
      reason: 'Perfect for experiencing authentic East Java flavors',
      matchScore: 90,
      estimatedDuration: 90,
      address: 'Jl. Pecinan No. 45, Malang'
    },
    {
      id: '6',
      type: 'restaurant',
      title: 'Kopiko Roastery',
      description: 'Premium coffee roastery with single-origin beans and mountain views.',
      rating: 4.7,
      price: 45000,
      currency: 'IDR',
      city: 'Batu',
      category: 'Coffee House',
      tags: ['coffee', 'roastery', 'premium', 'mountain-view'],
      reason: 'Great coffee experience to complement your mountain adventure',
      matchScore: 87,
      estimatedDuration: 120,
      address: 'Jl. Oro-Oro Ombo No. 123, Batu'
    },

    // Transportation
    {
      id: '7',
      type: 'transportation',
      title: 'Bromo Express Bus Tour',
      description: 'Convenient bus tour with sunrise package including breakfast at viewpoint.',
      rating: 4.5,
      price: 250000,
      currency: 'IDR',
      city: 'Surabaya-Bromo',
      category: 'Bus Tour',
      tags: ['bus', 'tour-package', 'sunrise', 'convenient'],
      reason: 'Stress-free way to reach Bromo with organized timing',
      matchScore: 89,
      estimatedDuration: 480,
      address: 'Surabaya - Bromo'
    },

    // Activities
    {
      id: '8',
      type: 'activity',
      title: 'Batu Fruit Picking Experience',
      description: 'Pick fresh apples and other fruits at local plantations in Batu.',
      rating: 4.4,
      price: 50000,
      currency: 'IDR',
      city: 'Batu',
      category: 'Agricultural Experience',
      tags: ['agriculture', 'family-fun', 'fresh-fruit', 'interactive'],
      reason: 'Unique local experience perfect for family fun',
      matchScore: 84,
      estimatedDuration: 150,
      address: 'Various apple farms in Batu'
    }
  ];

  const categories: RecommendationCategory[] = [
    { id: 'all', name: 'All', icon: Sparkles, count: mockRecommendations.length, color: 'text-purple-600' },
    { id: 'destination', name: 'Destinations', icon: MapPin, count: mockRecommendations.filter(r => r.type === 'destination').length, color: 'text-green-600' },
    { id: 'accommodation', name: 'Hotels', icon: Award, count: mockRecommendations.filter(r => r.type === 'accommodation').length, color: 'text-blue-600' },
    { id: 'restaurant', name: 'Restaurants', icon: Heart, count: mockRecommendations.filter(r => r.type === 'restaurant').length, color: 'text-orange-600' },
    { id: 'transportation', name: 'Transport', icon: Zap, count: mockRecommendations.filter(r => r.type === 'transportation').length, color: 'text-purple-600' },
    { id: 'activity', name: 'Activities', icon: TrendingUp, count: mockRecommendations.filter(r => r.type === 'activity').length, color: 'text-pink-600' }
  ];

  useEffect(() => {
    // Simulate AI processing time
    const timer = setTimeout(() => {
      setRecommendations(mockRecommendations);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [userPreferences]);

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesCategory = selectedCategory === 'all' || rec.type === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'destination': return MapPin;
      case 'accommodation': return Award;
      case 'restaurant': return Heart;
      case 'transportation': return Zap;
      case 'activity': return TrendingUp;
      default: return Sparkles;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'destination': return 'text-green-600';
      case 'accommodation': return 'text-blue-600';
      case 'restaurant': return 'text-orange-600';
      case 'transportation': return 'text-purple-600';
      case 'activity': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold">AI Processing Your Recommendations</h3>
                <p className="text-purple-100 text-sm">Analyzing your preferences to find the perfect options...</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-bold">Smart Recommendations</h3>
                <p className="text-purple-100 text-sm">
                  AI-curated based on your preferences and budget
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">{filteredRecommendations.length} recommendations</p>
              <p className="text-xs text-purple-200">
                Match score: {Math.round(filteredRecommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / filteredRecommendations.length || 0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              <Icon className={`h-4 w-4 mr-2 ${selectedCategory === category.id ? 'text-white' : category.color}`} />
              {category.name} ({category.count})
            </Button>
          );
        })}
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filteredRecommendations.map((recommendation) => {
          const TypeIcon = getTypeIcon(recommendation.type);
          const typeColor = getTypeColor(recommendation.type);

          return (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-400">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Type Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <TypeIcon className={`h-6 w-6 ${typeColor}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {recommendation.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {recommendation.description}
                          </p>
                          
                          {/* Metadata */}
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{recommendation.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{recommendation.city}</span>
                            </div>
                            {recommendation.estimatedDuration && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(recommendation.estimatedDuration)}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatPrice(recommendation.price, recommendation.currency)}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {recommendation.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {recommendation.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{recommendation.tags.length - 3} more
                              </Badge>
                            )}
                          </div>

                          {/* AI Reason */}
                          <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-xs text-purple-700">
                              <Sparkles className="h-3 w-3 inline mr-1" />
                              {recommendation.reason}
                            </p>
                          </div>
                        </div>

                        {/* Match Score and Add Button */}
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {recommendation.matchScore}% match
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => onAddRecommendation(recommendation)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredRecommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(filteredRecommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / filteredRecommendations.length || 0)}%
              </p>
              <p className="text-xs text-gray-600">Avg Match</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(filteredRecommendations.reduce((sum, rec) => sum + rec.price, 0) / filteredRecommendations.length || 0).replace('Rp', 'Rp')}
              </p>
              <p className="text-xs text-gray-600">Avg Price</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredRecommendations.filter(rec => rec.rating >= 4.5).length}
              </p>
              <p className="text-xs text-gray-600">Top Rated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
