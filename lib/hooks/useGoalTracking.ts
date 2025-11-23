import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface TripGoal {
  id: string;
  type: 'budget_optimization' | 'experience_maximization' | 'cultural_immersion' | 'adventure_seeking' | 'relaxation_focused' | 'family_friendly';
  title: string;
  description: string;
  targetMetrics: {
    maxBudget: number;
    minRating: number;
    maxDailyActivities: number;
    preferredCategories: string[];
    timeConstraints?: any;
  };
  progress: {
    currentBudget: number;
    activitiesCompleted: number;
    averageRating: number;
    destinationsVisited: number;
    milestonesAchieved: number;
  };
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

interface GoalProgressUpdate {
  goalId: string;
  metric: string;
  value: number;
  timestamp: number;
  reason?: string;
}

interface GoalRecommendation {
  type: TripGoal['type'];
  title: string;
  description: string;
  estimatedBudget: number;
  expectedRating: number;
  confidence: number;
  reasoning: string[];
}

export function useGoalTracking(userId: string) {
  const [goals, setGoals] = useState<TripGoal[]>([]);
  const [activeGoal, setActiveGoal] = useState<TripGoal | null>(null);
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connectToGoals = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const wsUrl = backendUrl.replace(/^http/, 'ws') + '/goals';

      socketRef.current = io(wsUrl, {
        query: { userId },
        transports: ['websocket', 'polling'],
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('🔗 Connected to goals WebSocket');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from goals WebSocket');
        setIsConnected(false);
      });

      socket.on('active_goals', (data: { goals: TripGoal[] }) => {
        console.log('🎯 Active goals received:', data.goals);
        setGoals(data.goals);
        // Set first active goal as current
        const active = data.goals.find(g => g.status === 'active');
        if (active) setActiveGoal(active);
      });

      socket.on('goal_status', (data: { goal: TripGoal }) => {
        console.log('📊 Goal status update:', data.goal);
        setGoals(prev => prev.map(g => g.id === data.goal.id ? data.goal : g));
        if (activeGoal?.id === data.goal.id) {
          setActiveGoal(data.goal);
        }
      });

      socket.on('progress_updated', (data: any) => {
        console.log('📈 Progress updated:', data);
        // Update local goal state
        if (data.goalId) {
          setGoals(prev => prev.map(g =>
            g.id === data.goalId
              ? { ...g, progress: data.progress, updatedAt: Date.now() }
              : g
          ));
        }
      });

      socket.on('itinerary_adapted', (data: any) => {
        console.log('🔄 Itinerary adapted based on goal:', data);
        // Could trigger itinerary regeneration
      });

      socket.on('goal_recommendations', (data: { recommendations: GoalRecommendation[] }) => {
        console.log('💡 Goal recommendations:', data.recommendations);
        setRecommendations(data.recommendations);
      });

      socket.on('error', (error: any) => {
        console.error('🚨 Goals WebSocket error:', error);
        setError(error.message || 'Goals connection error');
      });

    } catch (err) {
      console.error('Failed to connect to goals WebSocket:', err);
      setError('Failed to connect to goals service');
    }
  };

  useEffect(() => {
    connectToGoals();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  const createGoal = async (goalType: TripGoal['type'], customMetrics?: Partial<TripGoal['targetMetrics']>) => {
    if (!socketRef.current) return;

    setLoading(true);
    try {
      // This would typically call an API endpoint
      // For now, we'll simulate goal creation
      const newGoal: TripGoal = {
        id: `goal-${Date.now()}`,
        type: goalType,
        title: getGoalTitle(goalType),
        description: getGoalDescription(goalType),
        targetMetrics: {
          maxBudget: customMetrics?.maxBudget || 5000000,
          minRating: customMetrics?.minRating || 4.0,
          maxDailyActivities: customMetrics?.maxDailyActivities || 4,
          preferredCategories: customMetrics?.preferredCategories || getDefaultCategories(goalType),
          ...customMetrics
        },
        progress: {
          currentBudget: 0,
          activitiesCompleted: 0,
          averageRating: 0,
          destinationsVisited: 0,
          milestonesAchieved: 0
        },
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setGoals(prev => [...prev, newGoal]);
      setActiveGoal(newGoal);

      // Emit to WebSocket for server-side processing
      socketRef.current.emit('create_goal', { goal: newGoal });

    } catch (err) {
      console.error('Failed to create goal:', err);
      setError('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (goalId: string, updates: GoalProgressUpdate[]) => {
    if (!socketRef.current) return;

    try {
      updates.forEach(update => {
        socketRef.current!.emit('update_progress', update);
      });
    } catch (err) {
      console.error('Failed to update progress:', err);
      setError('Failed to update progress');
    }
  };

  const subscribeToGoal = (goalId: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit('subscribe_goal', { goalId });
  };

  const getGoalRecommendations = () => {
    if (!socketRef.current) return;

    socketRef.current.emit('get_goal_recommendations');
  };

  const getGoalProgressPercentage = (goal: TripGoal): number => {
    const metrics = goal.targetMetrics;
    const progress = goal.progress;

    // Calculate weighted progress
    const budgetProgress = Math.min(progress.currentBudget / metrics.maxBudget, 1) * 0.3;
    const activityProgress = Math.min(progress.activitiesCompleted / (metrics.maxDailyActivities * 7), 1) * 0.3;
    const ratingProgress = Math.min(progress.averageRating / metrics.minRating, 1) * 0.2;
    const destinationProgress = Math.min(progress.destinationsVisited / 10, 1) * 0.2; // Assume 10 destinations target

    return (budgetProgress + activityProgress + ratingProgress + destinationProgress) * 100;
  };

  const getGoalBudgetEfficiency = (goal: TripGoal): number => {
    if (goal.progress.currentBudget === 0) return 0;

    const efficiency = (goal.progress.averageRating / 5) / (goal.progress.currentBudget / goal.targetMetrics.maxBudget);
    return Math.min(efficiency * 100, 100);
  };

  const getGoalAdaptationSuggestions = (goal: TripGoal): string[] => {
    const suggestions: string[] = [];
    const progressPercent = getGoalProgressPercentage(goal);

    if (progressPercent < 30 && goal.progress.currentBudget > goal.targetMetrics.maxBudget * 0.8) {
      suggestions.push('Consider reducing daily spending to meet budget goals');
    }

    if (goal.progress.averageRating < goal.targetMetrics.minRating) {
      suggestions.push('Try higher-rated destinations to improve satisfaction');
    }

    if (goal.progress.activitiesCompleted < goal.targetMetrics.maxDailyActivities * 3) {
      suggestions.push('Add more activities to achieve your goal targets');
    }

    return suggestions;
  };

  // Helper functions
  const getGoalTitle = (type: TripGoal['type']): string => {
    const titles = {
      budget_optimization: 'Budget Optimization Trip',
      experience_maximization: 'Experience Maximization Trip',
      cultural_immersion: 'Cultural Immersion Journey',
      adventure_seeking: 'Adventure Seeking Expedition',
      relaxation_focused: 'Relaxation Focused Getaway',
      family_friendly: 'Family Friendly Adventure'
    };
    return titles[type] || 'Custom Trip Goal';
  };

  const getGoalDescription = (type: TripGoal['type']): string => {
    const descriptions = {
      budget_optimization: 'Maximize travel value while staying within budget constraints',
      experience_maximization: 'Focus on high-quality experiences and memorable activities',
      cultural_immersion: 'Deep dive into local culture, traditions, and authentic experiences',
      adventure_seeking: 'Seek thrilling adventures and outdoor activities',
      relaxation_focused: 'Prioritize rest, wellness, and peaceful experiences',
      family_friendly: 'Create memorable experiences suitable for all family members'
    };
    return descriptions[type] || 'Custom trip goal description';
  };

  const getDefaultCategories = (type: TripGoal['type']): string[] => {
    const categories = {
      budget_optimization: ['accommodation', 'transportation', 'food'],
      experience_maximization: ['activities', 'attractions', 'entertainment'],
      cultural_immersion: ['cultural_sites', 'museums', 'local_experiences'],
      adventure_seeking: ['outdoor_activities', 'sports', 'adventure'],
      relaxation_focused: ['spa', 'beaches', 'wellness'],
      family_friendly: ['family_activities', 'educational', 'entertainment']
    };
    return categories[type] || ['activities'];
  };

  return {
    goals,
    activeGoal,
    recommendations,
    isConnected,
    loading,
    error,
    createGoal,
    updateProgress,
    subscribeToGoal,
    getGoalRecommendations,
    getGoalProgressPercentage,
    getGoalBudgetEfficiency,
    getGoalAdaptationSuggestions,
  };
}