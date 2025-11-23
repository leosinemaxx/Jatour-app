"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Award, Users, Building2, Heart, Leaf, Calendar, MapPin, Sparkles, Activity, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { mlEngine } from "@/lib/ml/ml-engine";
import { budgetEngine } from "@/lib/ml/intelligent-budget-engine";
import NavbarDash from "@/app/components/navbar-dash";

interface MLInsightsData {
  totalTrips: number;
  completedTrips: number;
  plannedTrips: number;
  favoriteDestinations: Array<{name: string; count: number; category: string}>;
  travelStyle: string;
  budgetAverage: number;
  satisfactionScore: number;
  mlInsights: {
    priceSensitivity: number;
    activityPreference: number;
    riskTolerance: number;
    spontaneityScore: number;
    socialPreference: number;
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
    potentialSavings?: number;
  }>;
  spendingAnalysis: {
    categoryBreakdown: Record<string, number>;
    optimizationPotential: number;
    suggestions: string[];
  };
}

export default function InsightsPage() {
  const router = useRouter();
  const { preferences, savedItineraries, itinerary } = useSmartItinerary();
  const [insightsData, setInsightsData] = useState<MLInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Data integrity and validation checks
  const validateSmartBudgetSelections = () => {
    const warnings: string[] = [];

    // Check if smart-budget selections exist in localStorage
    const accommodationSelection = typeof window !== 'undefined' ? localStorage.getItem('smart-budget-accommodation') : null;
    const transportationSelection = typeof window !== 'undefined' ? localStorage.getItem('smart-budget-transportation') : null;

    if (accommodationSelection) {
      try {
        const accData = JSON.parse(accommodationSelection);
        if (accData.days !== preferences.days) {
          warnings.push(`Accommodation selection has ${accData.days} days but current itinerary has ${preferences.days} days`);
        }
        if (accData.travelers !== preferences.travelers) {
          warnings.push(`Accommodation selection has ${accData.travelers} travelers but current itinerary has ${preferences.travelers} travelers`);
        }
      } catch (e) {
        warnings.push('Invalid accommodation selection data in localStorage');
      }
    }

    if (transportationSelection) {
      try {
        const transData = JSON.parse(transportationSelection);
        if (transData.days !== preferences.days) {
          warnings.push(`Transportation selection has ${transData.days} days but current itinerary has ${preferences.days} days`);
        }
        if (transData.travelers !== preferences.travelers) {
          warnings.push(`Transportation selection has ${transData.travelers} travelers but current itinerary has ${preferences.travelers} travelers`);
        }
      } catch (e) {
        warnings.push('Invalid transportation selection data in localStorage');
      }
    }

    return warnings;
  };

  const checkDataIntegrity = () => {
    const issues: string[] = [];

    // Check if required data is present
    if (!preferences.days || preferences.days <= 0) {
      issues.push('Invalid or missing trip duration');
    }
    if (!preferences.travelers || preferences.travelers <= 0) {
      issues.push('Invalid or missing number of travelers');
    }
    if (!preferences.budget || preferences.budget <= 0) {
      issues.push('Invalid or missing budget');
    }
    if (!Array.isArray(savedItineraries)) {
      issues.push('Invalid saved itineraries data');
    }
    if (!Array.isArray(itinerary)) {
      issues.push('Invalid current itinerary data');
    }

    return issues;
  };

  const createFallbackPreferences = (prefs: any, issues: string[]) => {
    const fallback = { ...prefs };

    if (issues.some(issue => issue.includes('trip duration'))) {
      fallback.days = 3; // Default 3 days
    }
    if (issues.some(issue => issue.includes('travelers'))) {
      fallback.travelers = 2; // Default 2 travelers
    }
    if (issues.some(issue => issue.includes('budget'))) {
      fallback.budget = 5000000; // Default 5 million IDR
    }
    if (!fallback.cities || !Array.isArray(fallback.cities)) {
      fallback.cities = ['Jakarta']; // Default city
    }
    if (!fallback.themes || !Array.isArray(fallback.themes)) {
      fallback.themes = ['Mixed']; // Default theme
    }

    return fallback;
  };

  const createFallbackItineraries = (saved: any[], issues: string[]) => {
    if (!issues.some(issue => issue.includes('saved itineraries'))) {
      return saved;
    }

    // Return empty array if saved itineraries are invalid
    return [];
  };

  const createFallbackCurrentItinerary = (current: any[], issues: string[]) => {
    if (!issues.some(issue => issue.includes('current itinerary'))) {
      return current;
    }

    // Return empty array if current itinerary is invalid
    return [];
  };

  useEffect(() => {
    const generateInsights = async () => {
      try {
        setLoading(true);

        // Data integrity checks with fallbacks
        const integrityIssues = checkDataIntegrity();
        const fallbackPreferences = createFallbackPreferences(preferences, integrityIssues);
        const fallbackItineraries = createFallbackItineraries(savedItineraries, integrityIssues);
        const fallbackCurrentItinerary = createFallbackCurrentItinerary(itinerary, integrityIssues);

        // Show warnings for issues that were fixed with fallbacks
        if (integrityIssues.length > 0) {
          setValidationWarnings([
            ...validateSmartBudgetSelections(),
            `Some data issues were detected and fixed with fallbacks: ${integrityIssues.join(', ')}`
          ]);
        } else {
          setValidationWarnings(validateSmartBudgetSelections());
        }

        // Use fallback data for analysis
        const dataToAnalyze = {
          preferences: fallbackPreferences,
          savedItineraries: fallbackItineraries,
          currentItinerary: fallbackCurrentItinerary
        };

        // Analyze saved itineraries for insights
        const totalTrips = dataToAnalyze.savedItineraries.length;
        const completedTrips = dataToAnalyze.savedItineraries.filter(t => t.status === 'completed').length;
        const plannedTrips = dataToAnalyze.savedItineraries.filter(t => t.status === 'planned').length;
        const activeTrips = dataToAnalyze.savedItineraries.filter(t => t.status === 'active').length;

        // Extract favorite destinations from all saved itineraries
        const allDestinations: Array<{name: string; category: string}> = [];
        dataToAnalyze.savedItineraries.forEach(itinerary => {
          itinerary.daysPlan.forEach((day: { day: number; title: string; activities: { name: string; duration: string; cost: number; type: string; }[] }) => {
            day.activities.forEach(activity => {
              allDestinations.push({
                name: activity.name,
                category: activity.type
              });
            });
          });
        });

        const destinationCounts = allDestinations.reduce((acc, dest) => {
          acc[dest.name] = (acc[dest.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const favoriteDestinations = Object.entries(destinationCounts)
          .map(([name, count]) => {
            const category = allDestinations.find(d => d.name === name)?.category || 'general';
            return { name, count, category };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate budget average
        const budgetAverage = totalTrips > 0
          ? dataToAnalyze.savedItineraries.reduce((sum, trip) => sum + trip.budget, 0) / totalTrips
          : 0;

        // Analyze travel patterns from preferences
        const travelStyle = dataToAnalyze.preferences.themes.length > 0
          ? dataToAnalyze.preferences.themes.join(', ')
          : 'Mixed';

        // Generate ML insights based on user data
        const mlInsights = {
          priceSensitivity: dataToAnalyze.preferences.budget < 5000000 ? 0.8 : dataToAnalyze.preferences.budget > 15000000 ? 0.3 : 0.6,
          activityPreference: dataToAnalyze.preferences.themes.some((t: string) => ['adventure', 'nature', 'sports'].includes(t)) ? 0.7 : 0.4,
          riskTolerance: dataToAnalyze.preferences.themes.some((t: string) => ['adventure', 'explorer'].includes(t)) ? 0.8 : 0.5,
          spontaneityScore: dataToAnalyze.preferences.notes?.toLowerCase().includes('flexible') ? 0.7 : 0.4,
          socialPreference: dataToAnalyze.preferences.travelers > 3 ? 0.8 : 0.5
        };

        // Calculate satisfaction score based on ML insights
        const satisfactionScore = Math.round(
          70 + (mlInsights.activityPreference * 20) + (mlInsights.riskTolerance * 10) - (mlInsights.priceSensitivity * 10)
        );

        // Generate AI recommendations
        const recommendations = generateRecommendations(dataToAnalyze.preferences, dataToAnalyze.savedItineraries, mlInsights);

        // Analyze spending patterns
        const spendingAnalysis = analyzeSpendingPatterns(dataToAnalyze.savedItineraries, dataToAnalyze.preferences);

        const insights: MLInsightsData = {
          totalTrips,
          completedTrips,
          plannedTrips,
          favoriteDestinations,
          travelStyle,
          budgetAverage,
          satisfactionScore,
          mlInsights,
          recommendations,
          spendingAnalysis
        };

        setInsightsData(insights);

        console.log('🤖 ML Insights Generated:', {
          totalTrips,
          favoriteDestinations,
          mlInsights,
          recommendations: recommendations.length,
          spendingAnalysis
        });

      } catch (err) {
        console.error('❌ Failed to generate insights:', err);
        setError('Failed to generate travel insights. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [preferences, savedItineraries]);

  const generateRecommendations = (prefs: any, savedTrips: any[], mlInsights: any) => {
    const recommendations = [];

    // Budget optimization recommendation
    if (mlInsights.priceSensitivity > 0.6) {
      recommendations.push({
        type: 'budget',
        title: 'Budget Optimization',
        description: 'Based on your price-conscious behavior, consider traveling during weekdays to save up to 25% on accommodations.',
        confidence: 0.8,
        potentialSavings: Math.round(prefs.budget * 0.25)
      });
    }

    // Destination recommendation based on themes
    if (prefs.themes.includes('nature')) {
      recommendations.push({
        type: 'destination',
        title: 'Nature Destination Suggestion',
        description: 'Lombok shows 85% compatibility with your nature preferences. Best visited April-May for optimal weather.',
        confidence: 0.85
      });
    }

    if (prefs.themes.includes('culture')) {
      recommendations.push({
        type: 'destination',
        title: 'Cultural Experience',
        description: 'Consider visiting Solo for its rich Javanese culture and traditional arts, matching your cultural interests.',
        confidence: 0.78
      });
    }

    // Activity recommendation based on activity preference
    if (mlInsights.activityPreference > 0.6) {
      recommendations.push({
        type: 'activity',
        title: 'Active Experience Enhancement',
        description: 'Your preference for active experiences suggests trying hiking in Mount Rinjani for an unforgettable adventure.',
        confidence: 0.75,
        potentialSavings: 0
      });
    }

    // Timing recommendation
    if (mlInsights.spontaneityScore > 0.6) {
      recommendations.push({
        type: 'timing',
        title: 'Flexible Booking Strategy',
        description: 'Your spontaneous nature benefits from last-minute bookings, potentially saving 15-20% on flights and hotels.',
        confidence: 0.7,
        potentialSavings: Math.round(prefs.budget * 0.18)
      });
    }

    return recommendations;
  };

  const analyzeSpendingPatterns = (savedTrips: any[], prefs: any) => {
    const categoryBreakdown: Record<string, number> = {
      accommodation: 0,
      transportation: 0,
      food: 0,
      activities: 0,
      miscellaneous: 0
    };

    let totalSpent = 0;

    // Get smart-budget selections from localStorage for accurate calculations
    const accommodationSelection = typeof window !== 'undefined' ? localStorage.getItem('smart-budget-accommodation') : null;
    const transportationSelection = typeof window !== 'undefined' ? localStorage.getItem('smart-budget-transportation') : null;

    savedTrips.forEach(trip => {
      const tripBudget = trip.budget;

      // Standardized cost calculations
      // Accommodation: pricePerNight × days (no traveler multiplier)
      if (accommodationSelection) {
        try {
          const accData = JSON.parse(accommodationSelection);
          if (accData.hotel && accData.days === prefs.days) {
            categoryBreakdown.accommodation += accData.hotel.pricePerNight * prefs.days;
          } else {
            // Fallback to estimated calculation
            categoryBreakdown.accommodation += tripBudget * 0.35;
          }
        } catch (e) {
          categoryBreakdown.accommodation += tripBudget * 0.35;
        }
      } else {
        categoryBreakdown.accommodation += tripBudget * 0.35;
      }

      // Transportation: one-time cost in total (distributed evenly across days in breakdowns)
      if (transportationSelection) {
        try {
          const transData = JSON.parse(transportationSelection);
          if (transData.transportation && transData.days === prefs.days) {
            categoryBreakdown.transportation += transData.transportation.price;
          } else {
            // Fallback to estimated calculation
            categoryBreakdown.transportation += tripBudget * 0.25;
          }
        } catch (e) {
          categoryBreakdown.transportation += tripBudget * 0.25;
        }
      } else {
        categoryBreakdown.transportation += tripBudget * 0.25;
      }

      // Food: consistent multiplier per traveler per day
      categoryBreakdown.food += prefs.days * 200000 * prefs.travelers;

      // Activities: consistent multiplier per traveler per day
      categoryBreakdown.activities += prefs.days * 300000 * prefs.travelers;

      // Miscellaneous: consistent multiplier per traveler per day
      categoryBreakdown.miscellaneous += prefs.days * 100000 * prefs.travelers;

      totalSpent += tripBudget;
    });

    const optimizationPotential = savedTrips.length > 2 ? 22 : 15; // More trips = higher optimization potential

    const suggestions = [];
    if (categoryBreakdown.accommodation / totalSpent > 0.4) {
      suggestions.push('Consider alternative accommodation options to reduce costs');
    }
    if (categoryBreakdown.food / totalSpent < 0.15) {
      suggestions.push('Increase food budget for better local dining experiences');
    }
    if (categoryBreakdown.activities / totalSpent < 0.20) {
      suggestions.push('Allocate more budget for activities to enhance travel experience');
    }

    return {
      categoryBreakdown,
      optimizationPotential,
      suggestions
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your travel patterns with AI...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <Brain className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Insights Unavailable</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white px-6 py-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Travel Data Available</h2>
            <p className="text-gray-600 mb-6">Generate your first itinerary to see personalized insights.</p>
            <div className="space-x-4">
              <Button
                onClick={() => router.push("/dashboard/preferences")}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2"
              >
                Create First Itinerary
              </Button>
              <Button
                onClick={() => router.push("/dashboard/plan")}
                className="bg-gray-500 text-white px-6 py-2"
              >
                Back to Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-purple-600 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Travel Insights</h1>
              <p className="text-gray-600">AI-powered analytics based on your travel preferences</p>
            </div>
          </div>
        </div>

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Data Validation Warnings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {validationWarnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-yellow-700">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
                <div className="mt-4 text-sm text-yellow-600">
                  <p>Consider updating your smart-budget selections to match your current itinerary parameters for accurate cost calculations.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 text-purple-600" />
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-purple-900">{insightsData.totalTrips}</h3>
              <p className="text-purple-600">Total Trips</p>
              {insightsData.totalTrips > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {insightsData.completedTrips} completed, {insightsData.plannedTrips} planned
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-8 w-8 text-green-600" />
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-900">{insightsData.satisfactionScore}%</h3>
              <p className="text-green-600">Satisfaction Score</p>
              <p className="text-sm text-gray-500 mt-1">
                AI-estimated based on preferences
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">{insightsData.travelStyle}</h3>
              <p className="text-blue-600">Travel Style</p>
              <p className="text-sm text-gray-500 mt-1">
                Based on your selected themes
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-orange-900">IDR {insightsData.budgetAverage.toLocaleString()}</h3>
              <p className="text-orange-600">Avg Budget</p>
              <p className="text-sm text-gray-500 mt-1">
                Across {insightsData.totalTrips} trip{insightsData.totalTrips !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ML-Powered Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Travel Behavior Analysis */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Travel Behavior Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Activity Preferences
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Adventure/Active</span>
                    <span className="text-sm font-medium">{Math.round(insightsData.mlInsights.activityPreference * 100)}%</span>
                  </div>
                  <Progress value={insightsData.mlInsights.activityPreference * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Price Sensitivity</span>
                    <span className="text-sm font-medium">{Math.round(insightsData.mlInsights.priceSensitivity * 100)}%</span>
                  </div>
                  <Progress value={insightsData.mlInsights.priceSensitivity * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Spontaneity</span>
                    <span className="text-sm font-medium">{Math.round(insightsData.mlInsights.spontaneityScore * 100)}%</span>
                  </div>
                  <Progress value={insightsData.mlInsights.spontaneityScore * 100} className="h-2" />
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  Favorite Destinations
                </h4>
                <div className="space-y-2">
                  {insightsData.favoriteDestinations.length > 0 ? (
                    insightsData.favoriteDestinations.map((dest, index) => (
                      <div key={dest.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="font-medium">{dest.name}</span>
                            <span className="text-xs text-gray-500 ml-1">{dest.category}</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">#{index + 1} ({dest.count})</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No destinations found yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insightsData.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {insightsData.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium flex items-center gap-2">
                          {rec.type === 'budget' && <DollarSign className="h-4 w-4 text-green-500" />}
                          {rec.type === 'destination' && <MapPin className="h-4 w-4 text-blue-500" />}
                          {rec.type === 'activity' && <Activity className="h-4 w-4 text-orange-500" />}
                          {rec.type === 'timing' && <Clock className="h-4 w-4 text-red-500" />}
                          {rec.title}
                        </h5>
                        <div className="text-right">
                          <span className="text-xs text-purple-600">Confidence</span>
                          <div className="font-bold text-purple-700">{Math.round(rec.confidence * 100)}%</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      {rec.potentialSavings && (
                        <div className="text-sm text-green-600 font-medium mt-2">
                          Potential Savings: IDR {rec.potentialSavings.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Generate more itineraries for personalized recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Analysis */}
        {insightsData.spendingAnalysis.categoryBreakdown && (
          <Card className="border-green-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Budget Optimization Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Spending Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(insightsData.spendingAnalysis.categoryBreakdown).map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">IDR {amount.toLocaleString()}</span>
                          <Progress value={(amount / Object.values(insightsData.spendingAnalysis.categoryBreakdown).reduce((a, b) => a + b, 0)) * 100} className="h-2 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Optimization Potential</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{insightsData.spendingAnalysis.optimizationPotential}%</div>
                    <p className="text-sm text-gray-600 mb-4">Potential savings with AI optimization</p>
                    <div className="space-y-2">
                      {insightsData.spendingAnalysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm text-gray-600">• {suggestion}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Cost Breakdown */}
        {itinerary.length > 0 && (
          <Card className="border-blue-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Daily Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itinerary.map((day) => {
                  // Calculate daily costs with standardized calculations
                  const accommodationCost = day.accommodation ? day.accommodation.cost : 0;
                  // Transportation cost distributed evenly across days
                  const transportationSelection = typeof window !== 'undefined' ? localStorage.getItem('smart-budget-transportation') : null;
                  let transportationCost = 0;
                  if (transportationSelection) {
                    try {
                      const transData = JSON.parse(transportationSelection);
                      if (transData.transportation && transData.days === preferences.days) {
                        transportationCost = transData.transportation.price / preferences.days;
                      }
                    } catch (e) {
                      transportationCost = 0;
                    }
                  }
                  const foodCost = 200000 * preferences.travelers;
                  const activitiesCost = day.destinations.reduce((sum, dest) => sum + (dest.estimatedCost || 0), 0);
                  const miscellaneousCost = 100000 * preferences.travelers;
                  const dailyTotal = accommodationCost + transportationCost + foodCost + activitiesCost + miscellaneousCost;

                  return (
                    <div key={day.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium">Day {day.day} - {day.date}</h5>
                        <span className="font-bold text-blue-600">IDR {dailyTotal.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Accommodation</span>
                          <div className="font-medium">IDR {accommodationCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Transportation</span>
                          <div className="font-medium">IDR {transportationCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Food</span>
                          <div className="font-medium">IDR {foodCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Activities</span>
                          <div className="font-medium">IDR {activitiesCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Miscellaneous</span>
                          <div className="font-medium">IDR {miscellaneousCost.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            onClick={() => router.push("/dashboard/plan")}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3"
          >
            Back to Plans
          </Button>
          <Button
            onClick={() => router.push("/dashboard/preferences")}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3"
          >
            Create New Itinerary
          </Button>
        </div>
      </div>
    </div>
  );
}
