import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useSmartItinerary } from './SmartItineraryContext';
import { itineraryManagementEngine } from '@/lib/ml/itinerary-management-engine';
import { budgetEngine } from '@/lib/ml/intelligent-budget-engine';
import { validationEngine } from '@/lib/ml/validation-engine';

// Types
export interface Destination {
  id: string;
  name: string;
  location: string;
  category: string;
  estimatedCost: number;
  duration: number;
  rating: number;
  coordinates?: { lat: number; lng: number };
  selected: boolean;
}

export interface Activity {
  id: string;
  name: string;
  destinationId: string;
  scheduledTime: string;
  duration: number;
  cost: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Accommodation {
  id: string;
  name: string;
  type: 'budget' | 'moderate' | 'luxury';
  pricePerNight: number;
  totalNights: number;
  totalCost: number;
  amenities: string[];
  rating: number;
  location: string;
}

export interface Transportation {
  id: string;
  type: string;
  provider: string;
  cost: number;
  duration: string;
  rating: number;
  carbonOffset: number;
}

export interface BudgetAllocation {
  accommodation: number;
  transportation: number;
  food: number;
  activities: number;
  miscellaneous: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  merchant?: string;
  location?: string;
  receipt?: string;
  synced: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'qris' | 'bca' | 'mandiri' | 'gopay' | 'ovo' | 'dana' | 'cash';
  name: string;
  connected: boolean;
  lastSync?: string;
  balance?: number;
}

export interface PlanningTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  category: 'itinerary' | 'budget' | 'payment' | 'validation';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface UnifiedPlanningState {
  // Itinerary planning
  destinations: Destination[];
  activities: Activity[];
  accommodation: Accommodation | null;
  transportation: Transportation | null;

  // Budget management
  totalBudget: number;
  budgetAllocation: BudgetAllocation;
  expenses: Expense[];
  spentAmount: number;
  remainingBudget: number;

  // Payment integration
  paymentMethods: PaymentMethod[];

  // Planning progress and tasks
  completedSteps: string[];
  currentStep: string;
  planningTasks: PlanningTask[];
  validationStatus: 'valid' | 'invalid' | 'pending' | 'error';

  // ML insights and recommendations
  recommendations: any[];
  optimizations: any[];
  riskFactors: string[];

  // UI state
  activeSection: 'itinerary' | 'budget' | 'payment';
  isLoading: boolean;
  error: string | null;
}

type UnifiedPlanningAction =
  | { type: 'SET_DESTINATIONS'; payload: Destination[] }
  | { type: 'ADD_DESTINATION'; payload: Destination }
  | { type: 'REMOVE_DESTINATION'; payload: string }
  | { type: 'UPDATE_DESTINATION'; payload: { id: string; updates: Partial<Destination> } }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'UPDATE_ACTIVITY'; payload: { id: string; updates: Partial<Activity> } }
  | { type: 'REMOVE_ACTIVITY'; payload: string }
  | { type: 'SET_ACCOMMODATION'; payload: Accommodation | null }
  | { type: 'SET_TRANSPORTATION'; payload: Transportation | null }
  | { type: 'SET_BUDGET'; payload: { total: number; allocation: BudgetAllocation } }
  | { type: 'UPDATE_BUDGET_ALLOCATION'; payload: Partial<BudgetAllocation> }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: { id: string; updates: Partial<Expense> } }
  | { type: 'REMOVE_EXPENSE'; payload: string }
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: { id: string; updates: Partial<PaymentMethod> } }
  | { type: 'COMPLETE_STEP'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: string }
  | { type: 'ADD_TASK'; payload: PlanningTask }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<PlanningTask> } }
  | { type: 'SET_VALIDATION_STATUS'; payload: UnifiedPlanningState['validationStatus'] }
  | { type: 'SET_ACTIVE_SECTION'; payload: UnifiedPlanningState['activeSection'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RECOMMENDATIONS'; payload: any[] }
  | { type: 'SET_OPTIMIZATIONS'; payload: any[] }
  | { type: 'SET_RISK_FACTORS'; payload: string[] }
  | { type: 'RESET_PLANNING' }
  | { type: 'LOAD_FROM_PREFERENCES' };

const initialState: UnifiedPlanningState = {
  destinations: [],
  activities: [],
  accommodation: null,
  transportation: null,
  totalBudget: 0,
  budgetAllocation: {
    accommodation: 0,
    transportation: 0,
    food: 0,
    activities: 0,
    miscellaneous: 0
  },
  expenses: [],
  spentAmount: 0,
  remainingBudget: 0,
  paymentMethods: [
    { id: 'qris', type: 'qris', name: 'QRIS', connected: false },
    { id: 'bca', type: 'bca', name: 'BCA', connected: false },
    { id: 'mandiri', type: 'mandiri', name: 'Mandiri', connected: false },
    { id: 'gopay', type: 'gopay', name: 'GoPay', connected: false },
    { id: 'ovo', type: 'ovo', name: 'OVO', connected: false },
    { id: 'dana', type: 'dana', name: 'DANA', connected: false },
    { id: 'cash', type: 'cash', name: 'Cash/Tunai', connected: true }
  ],
  completedSteps: [],
  currentStep: 'destinations',
  planningTasks: [],
  validationStatus: 'pending',
  recommendations: [],
  optimizations: [],
  riskFactors: [],
  activeSection: 'itinerary',
  isLoading: false,
  error: null
};

function unifiedPlanningReducer(state: UnifiedPlanningState, action: UnifiedPlanningAction): UnifiedPlanningState {
  switch (action.type) {
    case 'SET_DESTINATIONS':
      return { ...state, destinations: action.payload };

    case 'ADD_DESTINATION':
      return { ...state, destinations: [...state.destinations, action.payload] };

    case 'REMOVE_DESTINATION':
      return {
        ...state,
        destinations: state.destinations.filter(d => d.id !== action.payload),
        activities: state.activities.filter(a => a.destinationId !== action.payload)
      };

    case 'UPDATE_DESTINATION':
      return {
        ...state,
        destinations: state.destinations.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload.updates } : d
        )
      };

    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };

    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
        )
      };

    case 'REMOVE_ACTIVITY':
      return { ...state, activities: state.activities.filter(a => a.id !== action.payload) };

    case 'SET_ACCOMMODATION':
      return { ...state, accommodation: action.payload };

    case 'SET_TRANSPORTATION':
      return { ...state, transportation: action.payload };

    case 'SET_BUDGET':
      return {
        ...state,
        totalBudget: action.payload.total,
        budgetAllocation: action.payload.allocation,
        remainingBudget: action.payload.total - state.spentAmount
      };

    case 'UPDATE_BUDGET_ALLOCATION':
      const newAllocation = { ...state.budgetAllocation, ...action.payload };
      return { ...state, budgetAllocation: newAllocation };

    case 'ADD_EXPENSE':
      const newExpenses = [...state.expenses, action.payload];
      const newSpentAmount = newExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        ...state,
        expenses: newExpenses,
        spentAmount: newSpentAmount,
        remainingBudget: state.totalBudget - newSpentAmount
      };

    case 'UPDATE_EXPENSE':
      const updatedExpenses = state.expenses.map(exp =>
        exp.id === action.payload.id ? { ...exp, ...action.payload.updates } : exp
      );
      const updatedSpentAmount = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        ...state,
        expenses: updatedExpenses,
        spentAmount: updatedSpentAmount,
        remainingBudget: state.totalBudget - updatedSpentAmount
      };

    case 'REMOVE_EXPENSE':
      const filteredExpenses = state.expenses.filter(exp => exp.id !== action.payload);
      const filteredSpentAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        ...state,
        expenses: filteredExpenses,
        spentAmount: filteredSpentAmount,
        remainingBudget: state.totalBudget - filteredSpentAmount
      };

    case 'SET_PAYMENT_METHODS':
      return { ...state, paymentMethods: action.payload };

    case 'UPDATE_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: state.paymentMethods.map(pm =>
          pm.id === action.payload.id ? { ...pm, ...action.payload.updates } : pm
        )
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: [...new Set([...state.completedSteps, action.payload])]
      };

    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    case 'ADD_TASK':
      return { ...state, planningTasks: [...state.planningTasks, action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state,
        planningTasks: state.planningTasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        )
      };

    case 'SET_VALIDATION_STATUS':
      return { ...state, validationStatus: action.payload };

    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };

    case 'SET_OPTIMIZATIONS':
      return { ...state, optimizations: action.payload };

    case 'SET_RISK_FACTORS':
      return { ...state, riskFactors: action.payload };

    case 'RESET_PLANNING':
      return { ...initialState };

    case 'LOAD_FROM_PREFERENCES':
      // This will be handled by the provider
      return state;

    default:
      return state;
  }
}

interface UnifiedPlanningContextType {
  state: UnifiedPlanningState;
  dispatch: React.Dispatch<UnifiedPlanningAction>;

  // Helper functions
  addDestination: (destination: Omit<Destination, 'id' | 'selected'>) => void;
  removeDestination: (id: string) => void;
  updateDestination: (id: string, updates: Partial<Destination>) => void;

  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;

  setAccommodation: (accommodation: Accommodation | null) => void;
  setTransportation: (transportation: Transportation | null) => void;

  setBudget: (total: number, allocation?: Partial<BudgetAllocation>) => void;
  updateBudgetAllocation: (allocation: Partial<BudgetAllocation>) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'synced'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  connectPaymentMethod: (id: string) => Promise<void>;
  syncTransactions: () => Promise<void>;

  completeStep: (stepId: string) => void;
  setCurrentStep: (stepId: string) => void;

  addPlanningTask: (task: Omit<PlanningTask, 'id' | 'createdAt'>) => void;
  updatePlanningTask: (id: string, updates: Partial<PlanningTask>) => void;

  validatePlanning: () => Promise<void>;
  generateRecommendations: () => Promise<void>;
  optimizePlanning: () => Promise<void>;

  savePlanning: () => Promise<void>;
  loadPlanning: () => Promise<void>;
  resetPlanning: () => void;
}

const UnifiedPlanningContext = createContext<UnifiedPlanningContextType | undefined>(undefined);

export function UnifiedPlanningProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(unifiedPlanningReducer, initialState);
  const { preferences } = useSmartItinerary();

  // Load from preferences on mount
  useEffect(() => {
    if (preferences.preferredSpots && preferences.preferredSpots.length > 0) {
      const destinations: Destination[] = preferences.preferredSpots.map((spot, index) => ({
        id: `dest_${index}`,
        name: spot,
        location: preferences.cities[0] || 'Multiple Cities',
        category: 'attraction',
        estimatedCost: Math.floor((preferences.budget || 0) * 0.15 / preferences.preferredSpots.length),
        duration: 180,
        rating: 4.0,
        selected: true
      }));

      dispatch({ type: 'SET_DESTINATIONS', payload: destinations });
      dispatch({ type: 'SET_BUDGET', payload: {
        total: preferences.budget || 0,
        allocation: {
          accommodation: (preferences.budget || 0) * 0.3,
          transportation: (preferences.budget || 0) * 0.2,
          food: (preferences.budget || 0) * 0.25,
          activities: (preferences.budget || 0) * 0.15,
          miscellaneous: (preferences.budget || 0) * 0.1
        }
      }});
    }
  }, [preferences]);

  // Helper functions
  const addDestination = (destination: Omit<Destination, 'id' | 'selected'>) => {
    const newDestination: Destination = {
      ...destination,
      id: `dest_${Date.now()}`,
      selected: true
    };
    dispatch({ type: 'ADD_DESTINATION', payload: newDestination });
  };

  const removeDestination = (id: string) => {
    dispatch({ type: 'REMOVE_DESTINATION', payload: id });
  };

  const updateDestination = (id: string, updates: Partial<Destination>) => {
    dispatch({ type: 'UPDATE_DESTINATION', payload: { id, updates } });
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `activity_${Date.now()}`
    };
    dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { id, updates } });
  };

  const removeActivity = (id: string) => {
    dispatch({ type: 'REMOVE_ACTIVITY', payload: id });
  };

  const setAccommodation = (accommodation: Accommodation | null) => {
    dispatch({ type: 'SET_ACCOMMODATION', payload: accommodation });
  };

  const setTransportation = (transportation: Transportation | null) => {
    dispatch({ type: 'SET_TRANSPORTATION', payload: transportation });
  };

  const setBudget = (total: number, allocation?: Partial<BudgetAllocation>) => {
    const defaultAllocation: BudgetAllocation = {
      accommodation: total * 0.3,
      transportation: total * 0.2,
      food: total * 0.25,
      activities: total * 0.15,
      miscellaneous: total * 0.1,
      ...allocation
    };
    dispatch({ type: 'SET_BUDGET', payload: { total, allocation: defaultAllocation } });
  };

  const updateBudgetAllocation = (allocation: Partial<BudgetAllocation>) => {
    dispatch({ type: 'UPDATE_BUDGET_ALLOCATION', payload: allocation });
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'synced'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `expense_${Date.now()}`,
      synced: false
    };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: { id, updates } });
  };

  const removeExpense = (id: string) => {
    dispatch({ type: 'REMOVE_EXPENSE', payload: id });
  };

  const connectPaymentMethod = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate API call to connect payment method
      await new Promise(resolve => setTimeout(resolve, 1000));
      dispatch({ type: 'UPDATE_PAYMENT_METHOD', payload: {
        id,
        updates: { connected: true, lastSync: new Date().toISOString() }
      }});
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect payment method' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncTransactions = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // This would integrate with the expense-sync-manager
      // For now, simulate syncing
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Add mock synced expenses
      const mockExpense: Expense = {
        id: `synced_${Date.now()}`,
        amount: Math.floor(Math.random() * 100000) + 10000,
        category: 'food',
        description: 'Synced transaction',
        date: new Date().toISOString(),
        paymentMethod: 'qris',
        synced: true
      };
      dispatch({ type: 'ADD_EXPENSE', payload: mockExpense });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync transactions' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const completeStep = (stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', payload: stepId });
  };

  const setCurrentStep = (stepId: string) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: stepId });
  };

  const addPlanningTask = (task: Omit<PlanningTask, 'id' | 'createdAt'>) => {
    const newTask: PlanningTask = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const updatePlanningTask = (id: string, updates: Partial<PlanningTask>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  };

  const validatePlanning = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Use validation engine
      const validationResult = await validationEngine.validateItinerary(
        {
          itinerary: state.activities.map(activity => ({
            day: 1,
            date: new Date().toISOString().split('T')[0],
            destinations: [{
              id: activity.id,
              name: activity.name,
              category: activity.category,
              location: 'Location',
              coordinates: { lat: 0, lng: 0 },
              scheduledTime: activity.scheduledTime,
              duration: activity.duration,
              estimatedCost: activity.cost,
              rating: 4.0,
              tags: [activity.category],
              mlScore: 0.8,
              predictedSatisfaction: 0.8
            }],
            totalCost: state.activities.reduce((sum, a) => sum + a.cost, 0),
            totalTime: state.activities.reduce((sum, a) => sum + a.duration, 0),
            mlConfidence: 0.8,
            optimizationReasons: []
          })),
          totalCost: state.spentAmount,
          totalDuration: 1,
          budgetBreakdown: {
            totalBudget: state.totalBudget,
            categoryBreakdown: state.budgetAllocation,
            optimizations: [],
            confidence: 0.8,
            reasoning: []
          },
          mlInsights: {
            personalizationScore: 0.7,
            predictedUserSatisfaction: 0.8,
            riskFactors: state.riskFactors,
            recommendations: state.recommendations
          },
          optimization: {
            timeOptimization: 0.8,
            costOptimization: 0.7,
            satisfactionOptimization: 0.9,
            reasoning: []
          },
          costVariability: {
            seasonalAdjustments: [],
            demandFactors: [],
            currencyRates: [],
            appliedDiscounts: [],
            realTimeUpdates: []
          }
        },
        {
          userId: 'user',
          preferences: preferences,
          availableDestinations: state.destinations,
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: state.destinations.filter(d => d.selected).map(d => d.name),
            avoidCrowds: false,
            accessibilityRequired: false
          }
        }
      );

      dispatch({ type: 'SET_VALIDATION_STATUS',
        payload: validationResult.isValid ? 'valid' : 'invalid' });
    } catch (error) {
      dispatch({ type: 'SET_VALIDATION_STATUS', payload: 'error' });
      dispatch({ type: 'SET_ERROR', payload: 'Validation failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateRecommendations = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Use ML engines to generate recommendations
      const recommendations = [
        {
          type: 'budget',
          title: 'Optimize Accommodation Budget',
          description: 'Consider budget hotels to save 20% on accommodation costs',
          impact: 'high'
        },
        {
          type: 'timing',
          title: 'Adjust Activity Schedule',
          description: 'Schedule high-priority activities during optimal times',
          impact: 'medium'
        }
      ];
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate recommendations' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const optimizePlanning = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Use budget engine for optimization
      const input = {
        userId: 'user',
        preferences: {
          budget: state.totalBudget,
          days: preferences.days || 3,
          travelers: preferences.travelers || 2,
          accommodationType: preferences.accommodationType as 'budget' | 'moderate' | 'luxury',
          cities: preferences.cities || [],
          interests: preferences.interests || [],
          themes: preferences.themes || [],
          preferredSpots: state.destinations.map(d => d.name),
          startDate: preferences.startDate || new Date().toISOString().split('T')[0],
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: state.destinations.filter(d => d.selected).map(d => d.name),
            avoidCrowds: false,
            accessibilityRequired: false
          }
        },
        destinations: state.destinations.map(d => ({
          id: d.id,
          name: d.name,
          location: d.location,
          category: d.category,
          estimatedCost: d.estimatedCost,
          duration: d.duration,
          coordinates: d.coordinates,
          tags: [d.category],
          rating: d.rating
        }))
      };

      const optimizations = await budgetEngine.calculateSmartBudget(input);
      dispatch({ type: 'SET_OPTIMIZATIONS', payload: [optimizations] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to optimize planning' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const savePlanning = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Save to itinerary management engine
      const itineraryInput = {
        userId: 'user',
        availableDestinations: state.destinations.map(d => ({
          id: d.id,
          name: d.name,
          location: d.location,
          category: d.category,
          estimatedCost: d.estimatedCost,
          duration: d.duration,
          coordinates: d.coordinates,
          tags: [d.category],
          rating: d.rating
        })),
        preferences,
        constraints: {
          maxDailyTravelTime: 480,
          preferredStartTime: '08:00',
          preferredEndTime: '18:00',
          mustVisit: state.destinations.filter(d => d.selected).map(d => d.name),
          avoidCrowds: false,
          accessibilityRequired: false
        }
      };

      await itineraryManagementEngine.createItinerary(itineraryInput);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save planning' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadPlanning = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Load from itinerary management engine
      const itineraryState = await itineraryManagementEngine.getItinerary('latest');
      if (itineraryState) {
        // Convert back to unified planning state
        // This would require mapping logic
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load planning' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetPlanning = () => {
    dispatch({ type: 'RESET_PLANNING' });
  };

  const contextValue: UnifiedPlanningContextType = {
    state,
    dispatch,
    addDestination,
    removeDestination,
    updateDestination,
    addActivity,
    updateActivity,
    removeActivity,
    setAccommodation,
    setTransportation,
    setBudget,
    updateBudgetAllocation,
    addExpense,
    updateExpense,
    removeExpense,
    connectPaymentMethod,
    syncTransactions,
    completeStep,
    setCurrentStep,
    addPlanningTask,
    updatePlanningTask,
    validatePlanning,
    generateRecommendations,
    optimizePlanning,
    savePlanning,
    loadPlanning,
    resetPlanning
  };

  return (
    <UnifiedPlanningContext.Provider value={contextValue}>
      {children}
    </UnifiedPlanningContext.Provider>
  );
}

export function useUnifiedPlanning() {
  const context = useContext(UnifiedPlanningContext);
  if (context === undefined) {
    throw new Error('useUnifiedPlanning must be used within a UnifiedPlanningProvider');
  }
  return context;
}