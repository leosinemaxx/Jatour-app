"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Zap,
  AlertCircle,
  Target,
  CheckCircle2
} from "lucide-react";

interface ValidationResult {
  id: string;
  type: 'success' | 'warning' | 'error';
  category: 'schedule' | 'budget' | 'logic' | 'optimization';
  title: string;
  description: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
}

interface ValidationSummary {
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  recommendations: number;
  optimization: {
    timeEfficiency: number;
    costEfficiency: number;
    routeOptimization: number;
    scheduleOptimization: number;
  };
}

interface ItineraryValidatorProps {
  itineraryBlocks: any[];
  totalBudget: number;
  tripDuration: number;
  onAutoOptimize?: () => void;
  className?: string;
}

export default function ItineraryValidator({
  itineraryBlocks,
  totalBudget,
  tripDuration,
  onAutoOptimize,
  className
}: ItineraryValidatorProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string>('all');

  // Mock validation logic
  const runValidation = () => {
    const results: ValidationResult[] = [];
    let totalScore = 100;
    let criticalCount = 0;

    // Schedule validation
    const scheduleBlocks = itineraryBlocks.filter(block => block.startTime);
    if (scheduleBlocks.length === 0) {
      results.push({
        id: 'schedule-001',
        type: 'warning',
        category: 'schedule',
        title: 'No Scheduled Times',
        description: 'Many activities don\'t have specific times set.',
        suggestion: 'Add start times to improve time management and reduce travel stress.',
        severity: 'medium',
        impact: 'May lead to rushed activities or missed opportunities'
      });
      totalScore -= 10;
    }

    // Check for time conflicts
    const timeConflicts = scheduleBlocks.filter(block => {
      const startTime = block.startTime;
      const endTime = block.endTime || block.startTime;
      return scheduleBlocks.some(other => {
        if (other.id === block.id) return false;
        const otherStart = other.startTime;
        const otherEnd = other.endTime || other.startTime;
        
        return (startTime >= otherStart && startTime < otherEnd) ||
               (endTime > otherStart && endTime <= otherEnd) ||
               (startTime <= otherStart && endTime >= otherEnd);
      });
    });

    if (timeConflicts.length > 0) {
      results.push({
        id: 'schedule-002',
        type: 'error',
        category: 'schedule',
        title: 'Time Conflicts Detected',
        description: `${timeConflicts.length} activities have overlapping times.`,
        suggestion: 'Review and adjust overlapping activities to avoid conflicts.',
        severity: 'high',
        impact: 'Activities cannot be completed as scheduled'
      });
      totalScore -= 25;
      criticalCount++;
    }

    // Travel time validation
    const travelBlocks = itineraryBlocks.filter(block => 
      block.type === 'transportation' || block.type === 'destination'
    );
    
    const cityTransitions = travelBlocks.filter(block => 
      block.type === 'destination' && 
      itineraryBlocks.some(other => 
        other.type === 'destination' && 
        other.city !== block.city &&
        itineraryBlocks.indexOf(other) > itineraryBlocks.indexOf(block)
      )
    );

    if (cityTransitions.length > 0) {
      const hasTransport = itineraryBlocks.some(block => 
        block.type === 'transportation' && 
        travelBlocks.indexOf(block) > travelBlocks.indexOf(cityTransitions[0]) - 1 &&
        travelBlocks.indexOf(block) < travelBlocks.indexOf(cityTransitions[0]) + 1
      );

      if (!hasTransport) {
        results.push({
          id: 'logic-001',
          type: 'error',
          category: 'logic',
          title: 'Missing Transportation',
          description: 'Inter-city travel without transportation details.',
          suggestion: 'Add transportation blocks between different cities.',
          severity: 'high',
          impact: 'Travel between cities may be impossible or problematic'
        });
        totalScore -= 20;
        criticalCount++;
      }
    }

    // Budget validation
    const totalCosts = itineraryBlocks.reduce((sum, block) => sum + (block.cost || 0), 0);
    const budgetUtilization = (totalCosts / totalBudget) * 100;

    if (budgetUtilization > 90) {
      results.push({
        id: 'budget-001',
        type: 'warning',
        category: 'budget',
        title: 'Budget Nearly Exceeded',
        description: `${budgetUtilization.toFixed(1)}% of budget utilized.`,
        suggestion: 'Consider reducing costs or increasing budget for unexpected expenses.',
        severity: 'medium',
        impact: 'Limited flexibility for additional activities or emergency expenses'
      });
      totalScore -= 15;
    } else if (budgetUtilization > 100) {
      results.push({
        id: 'budget-002',
        type: 'error',
        category: 'budget',
        title: 'Budget Exceeded',
        description: `Total costs (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalCosts)}) exceed budget (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalBudget)}).`,
        suggestion: 'Remove expensive activities or increase budget allocation.',
        severity: 'high',
        impact: 'Trip cannot be completed within current budget'
      });
      totalScore -= 30;
      criticalCount++;
    } else if (budgetUtilization < 50) {
      results.push({
        id: 'budget-003',
        type: 'success',
        category: 'budget',
        title: 'Healthy Budget Usage',
        description: `Only ${budgetUtilization.toFixed(1)}% of budget utilized.`,
        suggestion: 'Consider adding more activities or upgrading experiences.',
        severity: 'low',
        impact: 'Good budget management with room for additions'
      });
      totalScore += 5;
    }

    // Logical flow validation
    const hasAccommodation = itineraryBlocks.some(block => block.type === 'accommodation');
    if (tripDuration > 1 && !hasAccommodation) {
      results.push({
        id: 'logic-002',
        type: 'warning',
        category: 'logic',
        title: 'No Accommodation for Multi-Day Trip',
        description: 'Multi-day itinerary without accommodation details.',
        suggestion: 'Add accommodation blocks for overnight stays.',
        severity: 'medium',
        impact: 'May lead to confusion about overnight arrangements'
      });
      totalScore -= 15;
    }

    // Optimization suggestions
    if (itineraryBlocks.length > 0) {
      // Check for sequential days
      const daysWithActivities = [...new Set(
        itineraryBlocks.map(block => {
          const date = new Date(block.date || Date.now());
          return date.toDateString();
        })
      )];

      if (daysWithActivities.length < tripDuration) {
        results.push({
          id: 'optimization-001',
          type: 'warning',
          category: 'optimization',
          title: 'Empty Days in Itinerary',
          description: `${tripDuration - daysWithActivities.length} day(s) without activities.`,
          suggestion: 'Add activities to empty days for a more complete experience.',
          severity: 'low',
          impact: 'May leave some days unused in the trip'
        });
        totalScore -= 5;
      }

      // Time distribution check
      const activitiesPerDay = daysWithActivities.map(day => 
        itineraryBlocks.filter(block => new Date(block.date || Date.now()).toDateString() === day).length
      );
      
      const avgActivitiesPerDay = activitiesPerDay.reduce((a, b) => a + b, 0) / daysWithActivities.length;
      if (avgActivitiesPerDay > 8) {
        results.push({
          id: 'optimization-002',
          type: 'warning',
          category: 'optimization',
          title: 'Overpacked Schedule',
          description: `Average ${avgActivitiesPerDay.toFixed(1)} activities per day.`,
          suggestion: 'Consider reducing activities per day for a more relaxed pace.',
          severity: 'medium',
          impact: 'May lead to rushed experiences and traveler fatigue'
        });
        totalScore -= 10;
      }
    }

    // Success indicators
    if (totalScore >= 80) {
      results.push({
        id: 'success-001',
        type: 'success',
        category: 'schedule',
        title: 'Well-Structured Itinerary',
        description: 'Your itinerary looks great and follows best practices.',
        severity: 'low',
        impact: 'Positive travel experience expected'
      });
    }

    // Calculate optimization metrics
    const timeEfficiency = Math.min(100, (scheduleBlocks.length / itineraryBlocks.length) * 100);
    const costEfficiency = Math.min(100, (100 - budgetUtilization) + (hasAccommodation ? 10 : 0));
    const routeOptimization = Math.min(100, (100 - (cityTransitions.length * 5)));
    const scheduleOptimization = Math.min(100, (100 - (timeConflicts.length * 20)));

    const validationSummary: ValidationSummary = {
      overallScore: Math.max(0, Math.min(100, totalScore)),
      totalIssues: results.length,
      criticalIssues: criticalCount,
      recommendations: results.filter(r => r.type === 'warning').length,
      optimization: {
        timeEfficiency,
        costEfficiency,
        routeOptimization,
        scheduleOptimization
      }
    };

    return { results, summary: validationSummary };
  };

  useEffect(() => {
    if (itineraryBlocks.length === 0) {
      setLoading(false);
      return;
    }

    // Simulate processing time
    const timer = setTimeout(() => {
      const validation = runValidation();
      setValidationResults(validation.results);
      setSummary(validation.summary);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [itineraryBlocks, totalBudget, tripDuration]);

  const getValidationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return AlertCircle;
    }
  };

  const getValidationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low': return <Badge variant="outline" className="text-xs">Low</Badge>;
      default: return null;
    }
  };

  const filteredResults = expandedCategory === 'all' 
    ? validationResults 
    : validationResults.filter(r => r.category === expandedCategory);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-6 w-6 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold">AI Validating Your Itinerary</h3>
                <p className="text-gray-600 text-sm">Analyzing schedule, budget, and logistics...</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
      {/* Header with Overall Score */}
      <Card className={`bg-gradient-to-r ${summary && summary.overallScore >= 80 ? 'from-green-500 to-blue-600' : summary && summary.overallScore >= 60 ? 'from-yellow-500 to-orange-600' : 'from-red-500 to-purple-600'} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">Itinerary Validation Score</h3>
                <p className="text-white/80 text-sm">
                  {(summary?.overallScore ?? 0) >= 80 ? 'Excellent! Ready for travel' :
                   (summary?.overallScore ?? 0) >= 60 ? 'Good, with room for improvement' :
                   'Needs attention before travel'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{summary?.overallScore ?? 0}/100</div>
              <div className="text-sm text-white/80">
                {summary?.totalIssues ?? 0} issues found
              </div>
            </div>
          </div>
          
          {summary && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Overall Quality</span>
                <span className="text-sm font-semibold">{summary.overallScore ?? 0}%</span>
              </div>
              <Progress value={summary.overallScore ?? 0} className="bg-white/20" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{summary.criticalIssues}</div>
              <div className="text-xs text-gray-600">Critical Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.recommendations}</div>
              <div className="text-xs text-gray-600">Suggestions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(summary.optimization.timeEfficiency)}%</div>
              <div className="text-xs text-gray-600">Time Efficiency</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(summary.optimization.costEfficiency)}%</div>
              <div className="text-xs text-gray-600">Budget Usage</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'schedule', 'budget', 'logic', 'optimization'].map((category) => (
          <Button
            key={category}
            variant={expandedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setExpandedCategory(category)}
            className="whitespace-nowrap capitalize"
          >
            {category === 'all' ? 'All Results' : `${category} (${validationResults.filter(r => r.category === category).length})`}
          </Button>
        ))}
      </div>

      {/* Optimization Metrics */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Optimization Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time Management</span>
                  <span>{Math.round(summary.optimization.timeEfficiency)}%</span>
                </div>
                <Progress value={summary.optimization.timeEfficiency} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cost Efficiency</span>
                  <span>{Math.round(summary.optimization.costEfficiency)}%</span>
                </div>
                <Progress value={summary.optimization.costEfficiency} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Route Planning</span>
                  <span>{Math.round(summary.optimization.routeOptimization)}%</span>
                </div>
                <Progress value={summary.optimization.routeOptimization} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Schedule Flow</span>
                  <span>{Math.round(summary.optimization.scheduleOptimization)}%</span>
                </div>
                <Progress value={summary.optimization.scheduleOptimization} className="h-2" />
              </div>
            </div>
            
            {onAutoOptimize && summary.overallScore < 80 && (
              <Button onClick={onAutoOptimize} className="w-full mt-4">
                <Zap className="h-4 w-4 mr-2" />
                Auto-Optimize Itinerary
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Good!</h3>
              <p className="text-gray-600">No issues found in this category.</p>
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((result, index) => {
            const Icon = getValidationIcon(result.type);
            const colorClass = getValidationColor(result.type);

            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  result.type === 'success' ? 'border-l-green-400' :
                  result.type === 'warning' ? 'border-l-yellow-400' :
                  'border-l-red-400'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">{result.title}</h4>
                          <div className="flex items-center space-x-2">
                            {getSeverityBadge(result.severity)}
                            <Badge variant="outline" className="text-xs capitalize">
                              {result.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                        {result.suggestion && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                            <p className="text-xs text-blue-700">
                              <Zap className="h-3 w-3 inline mr-1" />
                              {result.suggestion}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{result.impact}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Action Items */}
      {summary && summary.criticalIssues > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Action Required</h4>
                <p className="text-sm text-red-700">
                  Please address {summary.criticalIssues} critical issue(s) before proceeding with your trip.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
