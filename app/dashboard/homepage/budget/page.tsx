// Intelligent Budget Planning Page with ML-Powered Auto Recommendations
// Beautiful, user-friendly interface with smart budget optimization

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calculator, 
  ChevronRight, 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb,
  DollarSign,
  PiggyBank,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle2,
  Wallet,
  CreditCard,
  Calendar,
  Users,
  MapPin,
  Home,
  Car,
  UtensilsCrossed,
  Camera,
  ShoppingBag,
  Info,
  Zap,
  Star,
  Gift,
  Crown,
  BarChart3,
  Smartphone
} from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useNotification } from "@/lib/components/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { BehaviorTracker } from "@/lib/ml/behavior-tracker";
import { useBehaviorTracking } from "@/lib/ml/behavior-tracker";
import { budgetEngine, SmartBudgetRecommendation } from "@/lib/ml/intelligent-budget-engine";
import { mlEngine } from "@/lib/ml/ml-engine";
import { cn } from "@/lib/utils";

const paymentOptions = [
  { id: "transfer", name: "Transfer Bank", icon: Wallet, color: "from-blue-500 to-cyan-500" },
  { id: "debit", name: "Debit Card", icon: CreditCard, color: "from-green-500 to-emerald-500" },
  { id: "credit", name: "Credit Card", icon: CreditCard, color: "from-purple-500 to-violet-500" },
  { id: "ewallet", name: "E-Wallet", icon: Smartphone, color: "from-orange-500 to-red-500" }
];

const travelModes = [
  { id: "budget", name: "Budget Traveler", icon: PiggyBank, description: "Hemat & praktis", color: "from-green-500 to-emerald-500" },
  { id: "moderate", name: "Comfort Explorer", icon: Star, description: "Seimbang & nyaman", color: "from-blue-500 to-cyan-500" },
  { id: "luxury", name: "Premium Experience", icon: Crown, description: "Mewah & eksklusif", color: "from-purple-500 to-pink-500" }
];

export default function BudgetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { trackInteraction } = useBehaviorTracking();
  
  const { 
    preferences, 
    updatePreferences, 
    generateItinerary, 
    calculateBudget, 
    itinerary, 
    budgetBreakdown, 
    loading, 
    generating 
  } = useSmartItinerary();

  const [selectedPayment, setSelectedPayment] = useState("transfer");
  const [selectedMode, setSelectedMode] = useState("moderate");
  const [smartBudget, setSmartBudget] = useState<SmartBudgetRecommendation | null>(null);
  const [isCalculatingSmart, setIsCalculatingSmart] = useState(false);
  const [budgetInsights, setBudgetInsights] = useState<any>(null);

  // ML-powered budget calculation
  const calculateSmartBudget = async () => {
    if (!user) return;
    
    setIsCalculatingSmart(true);
    trackInteraction('click', 'budget', 'smart-calculate', {
      category: 'budget-calculation',
      price: preferences.budget
    });

    try {
      // Get ML insights for current user
      const profile = mlEngine.getUserProfile(user.id);
      
      // Create budget calculation input
      const budgetInput = {
        userId: user.id,
        preferences: {
          budget: preferences.budget || 0,
          days: preferences.days,
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType,
          cities: preferences.cities,
          interests: preferences.interests
        },
        destinations: itinerary.map(day => 
          day.destinations.map(dest => ({
            id: dest.id,
            name: dest.name,
            location: (dest as any).location || dest.name,
            category: (dest as any).category || 'general',
            estimatedCost: (dest as any).estimatedCost || 100000,
            duration: parseInt((dest as any).duration?.toString()?.replace(/\D/g, '') || '120')
          }))
        ).flat()
      };

      const recommendation = budgetEngine.calculateSmartBudget(budgetInput);
      setSmartBudget(recommendation);
      
      // Generate ML insights
      const insights = generateBudgetInsights(profile, recommendation);
      setBudgetInsights(insights);

      addNotification({
        title: 'Smart Budget Calculated!',
        message: 'AI has optimized your budget based on your preferences and behavior.',
        type: 'success'
      });

    } catch (error) {
      addNotification({
        title: 'Calculation Failed',
        message: 'Unable to calculate smart budget. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCalculatingSmart(false);
    }
  };

  const generateBudgetInsights = (profile: any, budget: SmartBudgetRecommendation) => {
    const insights = [];
    
    if (profile?.mlInsights?.priceSensitivity > 0.6) {
      insights.push({
        type: 'saving',
        icon: <PiggyBank className="h-4 w-4" />,
        title: 'Budget-Conscious Traveler',
        description: 'You tend to prefer cost-effective options. We\'ve optimized your allocation accordingly.',
        color: 'text-green-600'
      });
    }

    if (profile?.mlInsights?.activityPreference > 0.7) {
      insights.push({
        type: 'experience',
        icon: <Zap className="h-4 w-4" />,
        title: 'Experience Focused',
        description: 'You prioritize unique experiences. We\'ve allocated more for activities and attractions.',
        color: 'text-purple-600'
      });
    }

    if (budget.confidence > 0.8) {
      insights.push({
        type: 'confidence',
        icon: <Award className="h-4 w-4" />,
        title: 'High Confidence Calculation',
        description: `Our AI is ${Math.round(budget.confidence * 100)}% confident in this budget allocation.`,
        color: 'text-blue-600'
      });
    }

    return insights;
  };

  const handleGenerate = async () => {
    trackInteraction('click', 'budget', 'generate-itinerary', {
      category: 'itinerary-generation',
      price: preferences.budget
    });
    
    await generateItinerary();
    router.push("/dashboard/homepage/itinerary");
  };

  const handleCalculate = async () => {
    if (itinerary.length === 0) {
      await generateItinerary();
    }
    await calculateBudget();
  };

  const getRecommendationColor = (category: string) => {
    const colors = {
      accommodation: 'from-blue-500 to-cyan-500',
      transportation: 'from-green-500 to-emerald-500',
      food: 'from-orange-500 to-yellow-500',
      activities: 'from-purple-500 to-pink-500',
      miscellaneous: 'from-gray-500 to-slate-500'
    };
    return colors[category as keyof typeof colors] || 'from-gray-400 to-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      accommodation: Home,
      transportation: Car,
      food: UtensilsCrossed,
      activities: Camera,
      miscellaneous: ShoppingBag
    };
    return icons[category as keyof typeof icons] || DollarSign;
  };

  return (
    <BehaviorTracker targetType="route" targetId="smart-budget-planning">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-6xl mx-auto px-6 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-semibold">
                  AI-Powered Budget Intelligence
                </Badge>
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-4">
                Smart Budget Planning
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Get AI-powered budget recommendations tailored to your travel style and preferences
              </p>
            </motion.div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 animate-float">
            <DollarSign className="h-6 w-6 text-white/30" />
          </div>
          <div className="absolute top-32 right-20 animate-float-delay">
            <Target className="h-8 w-8 text-white/20" />
          </div>
          <div className="absolute bottom-20 left-20 animate-float">
            <TrendingUp className="h-7 w-7 text-white/25" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Budget Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Budget Calculator</CardTitle>
                    <p className="text-gray-600">Set your travel parameters for intelligent recommendations</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Total Budget (IDR)</Label>
                    <Input
                      type="number"
                      placeholder="5,000,000"
                      value={preferences.budget || ""}
                      onChange={(e) => updatePreferences({ budget: Number(e.target.value) })}
                      className="text-lg font-semibold border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Travelers</Label>
                    <Input
                      type="number"
                      min={1}
                      value={preferences.travelers}
                      onChange={(e) => updatePreferences({ travelers: Number(e.target.value) })}
                      className="text-lg font-semibold border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Duration (Days)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={preferences.days}
                      onChange={(e) => updatePreferences({ days: Number(e.target.value) })}
                      className="text-lg font-semibold border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Start Date</Label>
                    <Input
                      type="date"
                      value={preferences.startDate}
                      onChange={(e) => updatePreferences({ startDate: e.target.value })}
                      className="text-lg font-semibold border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Accommodation Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Accommodation Type</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['budget', 'moderate', 'luxury'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updatePreferences({ accommodationType: type })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-center transition-all duration-300",
                          preferences.accommodationType === type
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        )}
                      >
                        <div className="text-lg font-semibold capitalize">{type}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {type === 'budget' && 'Ekonomis'}
                          {type === 'moderate' && 'Menengah'}
                          {type === 'luxury' && 'Mewah'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Mode */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Travel Style</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {travelModes.map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = selectedMode === mode.id;
                      
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setSelectedMode(mode.id)}
                          className={cn(
                            "p-6 rounded-2xl border-2 text-left transition-all duration-300",
                            isSelected
                              ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                          )}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={cn(
                              "p-2 rounded-xl",
                              isSelected ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gray-100"
                            )}>
                              <Icon className={cn(
                                "h-5 w-5",
                                isSelected ? "text-white" : "text-gray-600"
                              )} />
                            </div>
                            <div className="font-semibold text-gray-900">{mode.name}</div>
                          </div>
                          <p className="text-sm text-gray-600">{mode.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Payment Method</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {paymentOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedPayment === option.id;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelectedPayment(option.id)}
                          className={cn(
                            "p-4 rounded-2xl border-2 text-center transition-all duration-300",
                            isSelected
                              ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-xl mx-auto mb-2 w-fit",
                            isSelected ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-gray-100"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              isSelected ? "text-white" : "text-gray-600"
                            )} />
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{option.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    onClick={calculateSmartBudget}
                    disabled={isCalculatingSmart || !preferences.budget || preferences.budget === 0}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-2xl shadow-lg"
                  >
                    {isCalculatingSmart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Calculating Smart Budget...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-5 w-5" />
                        Get Smart Recommendations
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !preferences.startDate || preferences.budget === 0}
                    variant="outline"
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-4 text-lg font-semibold rounded-2xl"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                        Generating Itinerary...
                      </>
                    ) : (
                      <>
                        Generate Smart Itinerary
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Smart Budget Results */}
          <AnimatePresence>
            {smartBudget && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 mb-12"
              >
                {/* ML Insights */}
                {budgetInsights && budgetInsights.length > 0 && (
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-blue-900">
                        <Lightbulb className="h-6 w-6" />
                        AI Budget Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {budgetInsights.map((insight: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-4 bg-white/60 rounded-2xl backdrop-blur-sm"
                          >
                            <div className={cn("text-blue-600 mt-1")}>
                              {insight.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900">{insight.title}</h4>
                              <p className="text-sm text-blue-700">{insight.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Budget Breakdown */}
                <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="h-6 w-6" />
                        <span>Smart Budget Breakdown</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {Math.round(smartBudget.confidence * 100)}% Confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {Object.entries(smartBudget.categoryBreakdown).map(([category, breakdown]) => {
                        const Icon = getCategoryIcon(category);
                        const colorClass = getRecommendationColor(category);
                        const savings = breakdown.savings || 0;
                        
                        return (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="relative p-6 rounded-3xl bg-white border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className={cn(
                                "p-3 rounded-2xl bg-gradient-to-br text-white",
                                colorClass
                              )}>
                                <Icon className="h-6 w-6" />
                              </div>
                              {savings > 0 && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  <PiggyBank className="h-3 w-3 mr-1" />
                                  Save IDR {savings.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mb-2 capitalize">
                              {category === 'accommodation' && 'Accommodation'}
                              {category === 'transportation' && 'Transportation'}
                              {category === 'food' && 'Food & Dining'}
                              {category === 'activities' && 'Activities'}
                              {category === 'miscellaneous' && 'Miscellaneous'}
                            </h3>
                            
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-gray-900">
                                IDR {breakdown.recommended.toLocaleString()}
                              </div>
                              {breakdown.allocated !== breakdown.recommended && (
                                <div className="text-sm text-gray-600">
                                  Originally allocated: IDR {breakdown.allocated.toLocaleString()}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Recommended</span>
                                <span>{Math.round((breakdown.recommended / smartBudget.totalBudget) * 100)}%</span>
                              </div>
                              <Progress 
                                value={(breakdown.recommended / smartBudget.totalBudget) * 100} 
                                className="h-2 bg-gray-100" 
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Total Budget Summary */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-6 border-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Total Smart Budget</h3>
                          <p className="text-gray-600">
                            AI-optimized allocation based on your preferences and behavior patterns
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-gray-900">
                            IDR {smartBudget.totalBudget.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            for {preferences.days} days • {preferences.travelers} travelers
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optimization Reasons */}
                    {smartBudget.reasoning.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          AI Optimization Reasoning
                        </h4>
                        <ul className="space-y-1">
                          {smartBudget.reasoning.map((reason, index) => (
                            <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Smart Optimizations */}
                    {smartBudget.optimizations.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          Smart Optimizations
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {smartBudget.optimizations.map((opt, index) => (
                            <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Target className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-purple-900 capitalize">{opt.type} Optimization</div>
                                  <div className="text-sm text-purple-700 mt-1">{opt.description}</div>
                                  {opt.potentialSavings > 0 && (
                                    <div className="text-sm font-semibold text-green-600 mt-2">
                                      Potential savings: IDR {opt.potentialSavings.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {opt.impact} impact
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Traditional Budget Overview (Legacy) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-white shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-gray-700" />
                  Traditional Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-600">Calculate breakdown once itinerary exists</p>
                  </div>
                  <Button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {loading ? "Calculating..." : "Calculate"}
                  </Button>
                </div>

                {budgetBreakdown ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: "Accommodation", value: budgetBreakdown.accommodation, color: "from-slate-900 to-slate-700" },
                      { label: "Transportation", value: budgetBreakdown.transportation, color: "from-green-500 to-emerald-500" },
                      { label: "Food & Drinks", value: budgetBreakdown.food, color: "from-blue-500 to-indigo-500" },
                      { label: "Activities", value: budgetBreakdown.activities, color: "from-orange-500 to-pink-500" },
                      { label: "Miscellaneous", value: budgetBreakdown.miscellaneous, color: "from-slate-400 to-slate-500" },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-3xl p-6 text-white bg-gradient-to-br ${item.color}`}>
                        <p className="text-sm uppercase tracking-wide font-semibold">{item.label}</p>
                        <p className="text-2xl font-bold mt-2">IDR {item.value.toLocaleString("id-ID")}</p>
                        <p className="text-xs mt-2 text-white/80">
                          {((item.value / budgetBreakdown.total) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-semibold mb-2">No Budget Breakdown Yet</p>
                    <p className="text-sm">
                      Generate an itinerary first, then click "Calculate" to see the traditional budget breakdown.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </BehaviorTracker>
  );
}
