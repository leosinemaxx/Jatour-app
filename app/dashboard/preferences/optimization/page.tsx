"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { mlEngine } from "@/lib/ml/ml-engine";
import { Button } from "@/components/ui/button";
import { Target, Clock, Star, Sparkles, Award, TrendingUp, Heart, Zap, Shuffle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import NavbarDash from "@/app/components/navbar-dash";

export default function OptimizationPage() {
  const router = useRouter();
  const { preferences, generateItinerary, generating } = useSmartItinerary();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    budget: preferences.budget,
    accommodationType: preferences.accommodationType,
    preferredSpots: preferences.preferredSpots
  });
  const [mlInsights, setMlInsights] = useState({
    activityLover: 0,
    valueSeeker: 0,
    spontaneous: 0,
    explorer: 0,
    interestMatch: 0,
    budgetAlignment: 0,
    stylePreference: 0,
    destinationMatch: 0
  });
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    setFormData({
      budget: preferences.budget,
      accommodationType: preferences.accommodationType,
      preferredSpots: preferences.preferredSpots
    });
  }, [preferences]);

  // Load ML insights when user is available
  useEffect(() => {
    if (user) {
      loadMLInsights();
    }
  }, [user]);

  const loadMLInsights = () => {
    setLoadingInsights(true);
    
    try {
      // Simulate loading time for realistic UX
      setTimeout(() => {
        if (user) {
          // Get user profile from ML engine
          const userProfile = mlEngine.getUserProfile(user.id);
          
          if (userProfile) {
            // Calculate dynamic insights based on user behavior
            const insights = calculateDynamicInsights(userProfile, preferences);
            setMlInsights(insights);
          } else {
            // Use default insights based on current preferences
            const defaultInsights = calculateDefaultInsights(preferences);
            setMlInsights(defaultInsights);
          }
        } else {
          // Use basic default insights for non-authenticated users
          setMlInsights({
            activityLover: 50,
            valueSeeker: 50,
            spontaneous: 50,
            explorer: 50,
            interestMatch: 75,
            budgetAlignment: 75,
            stylePreference: 75,
            destinationMatch: 75
          });
        }
        
        setLoadingInsights(false);
      }, 1000); // Simulate API call delay
    } catch (error) {
      console.error('Failed to load ML insights:', error);
      setLoadingInsights(false);
    }
  };

  const calculateDynamicInsights = (userProfile: any, currentPreferences: any) => {
    const insights = { ...mlInsights };
    
    // Activity Lover: based on mlInsights.activityPreference and interests
    const activityScore = userProfile.mlInsights.activityPreference * 100;
    const adventureInterests = currentPreferences.interests.filter((interest: string) => 
      ['adventure', 'hiking', 'sports', 'water activities'].some(keyword => 
        interest.toLowerCase().includes(keyword)
      )
    ).length;
    insights.activityLover = Math.min(100, activityScore + (adventureInterests * 10));

    // Value Seeker: based on mlInsights.priceSensitivity and accommodation type
    const valueScore = (1 - userProfile.mlInsights.priceSensitivity) * 100;
    const budgetPreference = currentPreferences.accommodationType === 'budget' ? 90 : 
                             currentPreferences.accommodationType === 'moderate' ? 70 : 50;
    insights.valueSeeker = (valueScore + budgetPreference) / 2;

    // Spontaneous: based on mlInsights.spontaneityScore and travel notes
    const spontaneityScore = userProfile.mlInsights.spontaneityScore * 100;
    const hasSpontaneousNotes = currentPreferences.notes.toLowerCase().includes('flexible') || 
                               currentPreferences.notes.toLowerCase().includes('spontaneous');
    insights.spontaneous = hasSpontaneousNotes ? Math.min(100, spontaneityScore + 20) : spontaneityScore;

    // Explorer: based on mlInsights.riskTolerance and city diversity
    const explorerScore = userProfile.mlInsights.riskTolerance * 100;
    const diverseCities = currentPreferences.cities.length > 2 ? 90 : 
                         currentPreferences.cities.length > 1 ? 70 : 50;
    insights.explorer = (explorerScore + diverseCities) / 2;

    // Personalization Metrics: based on preference matching
    const categoryMatches = Object.keys(userProfile.implicitPreferences.preferredCategories).filter(category => 
      currentPreferences.themes.includes(category) || currentPreferences.interests.includes(category)
    ).length;
    insights.interestMatch = Math.min(100, 70 + (categoryMatches * 10));

    const priceRange = userProfile.implicitPreferences.preferredPriceRange;
    const budgetMatch = currentPreferences.budget >= priceRange.min && currentPreferences.budget <= priceRange.max ? 90 : 60;
    insights.budgetAlignment = budgetMatch;

    const styleMatch = userProfile.implicitPreferences.preferredCategories[currentPreferences.accommodationType] ? 90 : 70;
    insights.stylePreference = styleMatch;

    const locationMatches = currentPreferences.cities.filter((city: string) => 
      userProfile.implicitPreferences.preferredLocations[city]
    ).length;
    insights.destinationMatch = Math.min(100, 60 + (locationMatches * 15));

    return insights;
  };

  const calculateDefaultInsights = (currentPreferences: any) => {
    const insights = { ...mlInsights };
    
    // Calculate based on current preferences only
    const adventureInterests = currentPreferences.interests.filter((interest: string) => 
      ['adventure', 'hiking', 'sports', 'water activities'].some(keyword => 
        interest.toLowerCase().includes(keyword)
      )
    ).length;
    insights.activityLover = 50 + (adventureInterests * 15);

    insights.valueSeeker = currentPreferences.accommodationType === 'budget' ? 80 : 
                          currentPreferences.accommodationType === 'moderate' ? 60 : 40;

    insights.spontaneous = currentPreferences.notes.toLowerCase().includes('flexible') ? 70 : 40;

    insights.explorer = currentPreferences.cities.length > 2 ? 80 : 
                        currentPreferences.cities.length > 1 ? 60 : 40;

    // Default personalization metrics
    insights.interestMatch = currentPreferences.interests.length > 0 ? 80 : 60;
    insights.budgetAlignment = currentPreferences.budget > 0 ? 85 : 60;
    insights.stylePreference = 70;
    insights.destinationMatch = currentPreferences.cities.length > 0 ? 75 : 50;

    return insights;
  };

  const handleGenerate = async () => {
    if (!preferences.startDate || !preferences.days || !preferences.travelers) {
      alert("Mohon lengkapi tanggal, durasi, dan jumlah traveler");
      return;
    }
    
    try {
      console.log('🚀 Starting itinerary generation from optimization page...');
      await generateItinerary();
      console.log('✅ Itinerary generation completed, navigating to plan page...');
      
      // Add a small delay to ensure context updates are propagated
      setTimeout(() => {
        router.push("/dashboard/preferences/insight");
      }, 100);
    } catch (error) {
      console.error('❌ Itinerary generation failed:', error);
      alert("Gagal membuat itinerary. Silakan coba lagi.");
    }
  };

  const handleEditPreferences = () => {
    router.push("/dashboard/preferences/themes");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Optimasi ML</h1>
          <p className="text-gray-600">Tinjau rekomendasi AI sebelum generate itinerary</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Optimization Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Target className="h-5 w-5" />
                Cost Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-3">Up to 25% savings</div>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Smart vendor negotiations</li>
                <li>• Off-peak timing optimization</li>
                <li>• Bundle deal recommendations</li>
                <li>• Dynamic pricing alerts</li>
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
              <div className="text-2xl font-bold text-blue-600 mb-3">30% faster travel</div>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Optimized routing</li>
                <li>• Crowd avoidance</li>
                <li>• Smart scheduling</li>
                <li>• Real-time updates</li>
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
              <div className="text-2xl font-bold text-purple-600 mb-3">40% higher satisfaction</div>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Personalized recommendations</li>
                <li>• Preference matching</li>
                <li>• Hidden gems discovery</li>
                <li>• Mood-based suggestions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* AI Personalization Insights */}
        <Card className="mb-8 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Heart className="h-5 w-5" />
              AI Personalization Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Loading State */}
              {loadingInsights ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-orange-600">Analyzing your travel personality...</p>
                </div>
              ) : (
                <>
                  {/* Travel Personality Traits */}
                  <div>
                    <h5 className="font-semibold mb-4 text-orange-700">Travel Personality Traits</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-medium text-gray-900">Activity Lover</div>
                            <div className="text-sm text-gray-600">Adventure & exploration</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">{mlInsights.activityLover}%</div>
                          <Progress value={mlInsights.activityLover} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium text-gray-900">Value Seeker</div>
                            <div className="text-sm text-gray-600">Smart spending</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{mlInsights.valueSeeker}%</div>
                          <Progress value={mlInsights.valueSeeker} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <Shuffle className="h-5 w-5 text-purple-500" />
                          <div>
                            <div className="font-medium text-gray-900">Spontaneous</div>
                            <div className="text-sm text-gray-600">Flexible planning</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{mlInsights.spontaneous}%</div>
                          <Progress value={mlInsights.spontaneous} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <Star className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium text-gray-900">Explorer</div>
                            <div className="text-sm text-gray-600">New destinations</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{mlInsights.explorer}%</div>
                          <Progress value={mlInsights.explorer} className="h-2 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personalization Metrics */}
                  <div>
                    <h5 className="font-semibold mb-4 text-orange-700">Personalization Metrics</h5>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <Heart className="h-5 w-5 text-pink-500" />
                          <div>
                            <div className="font-medium text-gray-900">Interest Match</div>
                            <div className="text-sm text-gray-600">Your preferences vs recommendations</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-pink-600">{mlInsights.interestMatch}%</div>
                          <Progress value={mlInsights.interestMatch} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-medium text-gray-900">Budget Alignment</div>
                            <div className="text-sm text-gray-600">Cost vs your budget range</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">{mlInsights.budgetAlignment}%</div>
                          <Progress value={mlInsights.budgetAlignment} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-indigo-500" />
                          <div>
                            <div className="font-medium text-gray-900">Style Preference</div>
                            <div className="text-sm text-gray-600">Accommodation & travel style</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-indigo-600">{mlInsights.stylePreference}%</div>
                          <Progress value={mlInsights.stylePreference} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-teal-500" />
                          <div>
                            <div className="font-medium text-gray-900">Destination Match</div>
                            <div className="text-sm text-gray-600">Locations vs your preferences</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-teal-600">{mlInsights.destinationMatch}%</div>
                          <Progress value={mlInsights.destinationMatch} className="h-2 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expected Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Expected ML Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-4">AI-Powered Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Behavioral preference learning</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Dynamic pricing optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Real-time crowd predictions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Weather-aware scheduling</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Local experience recommendations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Transportation optimization</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Personalization Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Interest Match</span>
                      <span>{mlInsights.interestMatch}%</span>
                    </div>
                    <Progress value={mlInsights.interestMatch} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Alignment</span>
                      <span>{mlInsights.budgetAlignment}%</span>
                    </div>
                    <Progress value={mlInsights.budgetAlignment} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Style Preference</span>
                      <span>{mlInsights.stylePreference}%</span>
                    </div>
                    <Progress value={mlInsights.stylePreference} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Destination Match</span>
                      <span>{mlInsights.destinationMatch}%</span>
                    </div>
                    <Progress value={mlInsights.destinationMatch} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Smart Itinerary Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Budget:</span>
                <div className="mt-2 bg-green-50 text-green-700 px-3 py-1 rounded-full inline-block">
                  {formData.budget ? `IDR ${formData.budget.toLocaleString()}` : "Belum diatur"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Destinasi:</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.preferredSpots.length > 0 ? (
                    formData.preferredSpots.slice(0, 3).map(spot => (
                      <span key={spot} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {spot}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">Belum dipilih</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Durasi:</span>
                <div className="mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block">
                  {preferences.days ? `${preferences.days} hari` : "Belum diatur"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Traveler:</span>
                <div className="mt-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full inline-block">
                  {preferences.travelers ? `${preferences.travelers} orang` : "Belum diatur"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handleEditPreferences}
            className="bg-gray-500 text-white px-6 py-3 hover:bg-gray-600"
          >
            Edit Preferensi
          </Button>
          
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/dashboard/preferences/smart-budget")}
              className="bg-gray-300 text-gray-700 px-6 py-3 hover:bg-gray-400"
            >
              Kembali
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !preferences.startDate || !preferences.days || !preferences.travelers}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mempersiapkan...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buat Itinerary Sekarang
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
