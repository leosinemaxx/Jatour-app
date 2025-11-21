// Enhanced Smart Itinerary Interface with ML Integration
// Elegant, user-friendly interface for smart itinerary creation and management

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Filter,
  Sparkles,
  Target,
  Zap,
  Users,
  Calendar,
  ChevronRight,
  Lightbulb,
  Award,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BehaviorTracker } from '@/lib/ml/behavior-tracker';
import { useBehaviorTracking } from '@/lib/ml/behavior-tracker';
import { smartItineraryEngine, SmartItineraryInput, SmartItineraryResult } from '@/lib/ml/smart-itinerary-engine';
import { budgetEngine } from '@/lib/ml/intelligent-budget-engine';
import { mlEngine } from '@/lib/ml/ml-engine';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSmartItinerary } from '@/lib/contexts/SmartItineraryContext';
import { useNotification } from '@/lib/components/NotificationProvider';

interface SmartItineraryInterfaceProps {
  onItineraryGenerated?: (itinerary: SmartItineraryResult) => void;
}

export function SmartItineraryInterface({ onItineraryGenerated }: SmartItineraryInterfaceProps) {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useSmartItinerary();
  const { addNotification } = useNotification();
  const { trackInteraction, trackFilterUsage, trackSearch } = useBehaviorTracking();
  
  const [step, setStep] = useState<'preferences' | 'optimization' | 'results'>('preferences');
  const [isGenerating, setIsGenerating] = useState(false);
  const [smartResult, setSmartResult] = useState<SmartItineraryResult | null>(null);
  const [mlInsights, setMlInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Enhanced preferences with ML insights
  const [enhancedPreferences, setEnhancedPreferences] = useState({
    ...preferences,
    mlOptimization: true,
    personalizeLevel: 'high' as 'low' | 'medium' | 'high',
    priorityWeight: {
      cost: 0.3,
      time: 0.2,
      satisfaction: 0.5
    }
  });

  // Mock available destinations (in real app, this would come from API)
  const mockDestinations = [
    {
      id: '1',
      name: 'Borobudur Temple',
      location: 'Yogyakarta',
      category: 'historical',
      estimatedCost: 75000,
      duration: 180,
      coordinates: { lat: -7.6079, lng: 110.2038 },
      tags: ['culture', 'history', 'UNESCO'],
      rating: 4.7
    },
    {
      id: '2',
      name: 'Ubud Rice Terraces',
      location: 'Bali',
      category: 'nature',
      estimatedCost: 50000,
      duration: 120,
      coordinates: { lat: -8.5069, lng: 115.2625 },
      tags: ['nature', 'photography', 'peaceful'],
      rating: 4.8
    },
    // Add more mock destinations...
  ];

  // Track ML engine recommendations for current user
  useEffect(() => {
    if (user) {
      const profile = mlEngine.getUserProfile(user.id);
      if (profile) {
        setMlInsights(profile.mlInsights);
        generateRecommendations(profile);
      }
    }
  }, [user]);

  const generateRecommendations = (profile: any) => {
    const recs = [];
    
    if (profile.mlInsights.activityPreference > 0.7) {
      recs.push({
        type: 'suggestion',
        icon: <Zap className="h-4 w-4" />,
        title: 'Adventure Enthusiast',
        description: 'Based on your activity preference, we recommend adding more outdoor adventures to your itinerary.',
        confidence: profile.mlInsights.activityPreference
      });
    }
    
    if (profile.mlInsights.priceSensitivity > 0.6) {
      recs.push({
        type: 'optimization',
        icon: <DollarSign className="h-4 w-4" />,
        title: 'Budget Optimizer',
        description: 'We\'ve identified cost-effective alternatives that match your preferences.',
        confidence: profile.mlInsights.priceSensitivity
      });
    }
    
    if (profile.mlInsights.spontaneityScore > 0.6) {
      recs.push({
        type: 'flexibility',
        icon: <Sparkles className="h-4 w-4" />,
        title: 'Flexible Scheduler',
        description: 'Your spontaneous nature suggests leaving room for unexpected discoveries.',
        confidence: profile.mlInsights.spontaneityScore
      });
    }
    
    setRecommendations(recs);
  };

  const handleGenerateSmartItinerary = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    trackInteraction('click', 'route', 'generate-smart-itinerary', {
      category: 'smart-itinerary',
      price: enhancedPreferences.budget
    });

    try {
      const smartInput: SmartItineraryInput = {
        userId: user.id,
        preferences: {
          budget: enhancedPreferences.budget,
          days: enhancedPreferences.days,
          travelers: enhancedPreferences.travelers,
          accommodationType: enhancedPreferences.accommodationType,
          cities: enhancedPreferences.cities,
          interests: enhancedPreferences.interests,
          themes: enhancedPreferences.themes,
          preferredSpots: enhancedPreferences.preferredSpots,
          startDate: enhancedPreferences.startDate
        },
        availableDestinations: mockDestinations,
        constraints: {
          avoidCrowds: true,
          accessibilityRequired: false,
          maxDailyTravelTime: 300
        }
      };

      const result = smartItineraryEngine.createSmartItinerary(smartInput);
      setSmartResult(result);
      setStep('results');
      
      addNotification({
        title: 'Smart Itinerary Generated!',
        message: 'Your personalized itinerary is ready with ML optimizations.',
        type: 'success'
      });

      if (onItineraryGenerated) {
        onItineraryGenerated(result);
      }
    } catch (error) {
      addNotification({
        title: 'Generation Failed',
        message: 'Unable to generate smart itinerary. Please try again.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPreferencesStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Smart Itinerary Preferences
        </h2>
        <p className="text-gray-600">
          Our AI will personalize your itinerary based on your preferences and behavior
        </p>
      </div>

      {/* ML Insights Panel */}
      {mlInsights && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="h-5 w-5" />
              ML Personalization Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(mlInsights.activityPreference * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Activity Lover</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((1 - mlInsights.priceSensitivity) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Value Seeker</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(mlInsights.spontaneityScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Spontaneous</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(mlInsights.riskTolerance * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Explorer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="text-blue-500">{rec.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm text-gray-600">{rec.description}</div>
                  </div>
                  <Badge variant="secondary">
                    {(rec.confidence * 100).toFixed(0)}% match
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Preferences Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget (IDR)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={enhancedPreferences.budget}
                  onChange={(e) => setEnhancedPreferences(prev => ({
                    ...prev,
                    budget: Number(e.target.value)
                  }))}
                  placeholder="5000000"
                />
              </div>
              <div>
                <Label htmlFor="days">Days</Label>
                <Select
                  value={enhancedPreferences.days.toString()}
                  onValueChange={(value) => setEnhancedPreferences(prev => ({
                    ...prev,
                    days: Number(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day} day{day > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="travelers">Travelers</Label>
              <Select
                value={enhancedPreferences.travelers.toString()}
                onValueChange={(value) => setEnhancedPreferences(prev => ({
                  ...prev,
                  travelers: Number(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} person{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accommodation">Accommodation Type</Label>
              <Select
                value={enhancedPreferences.accommodationType}
                onValueChange={(value: any) => setEnhancedPreferences(prev => ({
                  ...prev,
                  accommodationType: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ML Optimization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="personalize">Personalization Level</Label>
              <Select
                value={enhancedPreferences.personalizeLevel}
                onValueChange={(value: any) => setEnhancedPreferences(prev => ({
                  ...prev,
                  personalizeLevel: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Basic recommendations</SelectItem>
                  <SelectItem value="medium">Medium - Balanced personalization</SelectItem>
                  <SelectItem value="high">High - Deep ML insights</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Priority Weights</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cost Optimization</span>
                  <span className="text-sm font-medium">
                    {(enhancedPreferences.priorityWeight.cost * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={enhancedPreferences.priorityWeight.cost * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time Efficiency</span>
                  <span className="text-sm font-medium">
                    {(enhancedPreferences.priorityWeight.time * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={enhancedPreferences.priorityWeight.time * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Satisfaction</span>
                  <span className="text-sm font-medium">
                    {(enhancedPreferences.priorityWeight.satisfaction * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={enhancedPreferences.priorityWeight.satisfaction * 100} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mlOptimization"
                checked={enhancedPreferences.mlOptimization}
                onChange={(e) => setEnhancedPreferences(prev => ({
                  ...prev,
                  mlOptimization: e.target.checked
                }))}
              />
              <Label htmlFor="mlOptimization">Enable ML Optimization</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => setStep('optimization')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          Next: Optimization Preview
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderOptimizationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Optimization Preview
        </h2>
        <p className="text-gray-600">
          AI-powered optimizations will enhance your travel experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Target className="h-5 w-5" />
              Cost Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              Up to 25% savings
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Smart vendor negotiations</li>
              <li>• Off-peak timing optimization</li>
              <li>• Bundle deal recommendations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              Time Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              30% faster travel
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Optimized routing</li>
              <li>• Crowd avoidance</li>
              <li>• Smart scheduling</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Star className="h-5 w-5" />
              Satisfaction Boost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              40% higher satisfaction
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Personalized recommendations</li>
              <li>• Preference matching</li>
              <li>• Hidden gems discovery</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expected Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">ML-Powered Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Behavioral preference learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Dynamic pricing optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Real-time crowd predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Weather-aware scheduling</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Personalization Metrics</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Interest Match</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Alignment</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Style Preference</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('preferences')}>
          Back to Preferences
        </Button>
        <Button 
          onClick={handleGenerateSmartItinerary}
          disabled={isGenerating}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Smart Itinerary...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Smart Itinerary
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderResultsStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Your Smart Itinerary
        </h2>
        <p className="text-gray-600">
          AI-optimized itinerary tailored to your preferences
        </p>
      </div>

      {smartResult && (
        <>
          {/* ML Insights Summary */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                ML Optimization Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {smartResult.optimization.costOptimization.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Cost Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {smartResult.optimization.timeOptimization.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Time Efficient</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {smartResult.mlInsights.personalizationScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Personalization</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {smartResult.mlInsights.predictedUserSatisfaction.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Recommendations */}
          {smartResult.mlInsights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {smartResult.mlInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Itinerary Details */}
          <div className="space-y-4">
            {smartResult.itinerary.map((day, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Day {day.day} - {day.date}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {day.mlConfidence > 0.8 ? 'Highly Optimized' : 'Well Optimized'}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        ${day.totalCost.toLocaleString()} • {Math.round(day.totalTime / 60)}h
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.destinations.map((dest, destIndex) => (
                      <div key={destIndex} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{dest.name}</div>
                          <div className="text-sm text-gray-600">{dest.location}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{dest.scheduledTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span className="text-xs">{dest.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              <span className="text-xs">{(dest.mlScore * 100).toFixed(0)}% match</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {day.optimizationReasons.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-1">Why this day is optimized:</div>
                      <div className="text-sm text-green-700">
                        {day.optimizationReasons.join(' • ')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('optimization')}>
              Back to Optimization
            </Button>
            <Button 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              onClick={() => {
                addNotification({
                  title: 'Itinerary Saved!',
                  message: 'Your smart itinerary has been saved to your dashboard.',
                  type: 'success'
                });
              }}
            >
              Save Itinerary
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <BehaviorTracker targetType="route" targetId="smart-itinerary-interface">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {['preferences', 'optimization', 'results'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === stepName 
                  ? 'bg-blue-600 text-white' 
                  : index < ['preferences', 'optimization', 'results'].indexOf(step)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 2 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {step === 'preferences' && renderPreferencesStep()}
          {step === 'optimization' && renderOptimizationStep()}
          {step === 'results' && renderResultsStep()}
        </AnimatePresence>
      </div>
    </BehaviorTracker>
  );
}
