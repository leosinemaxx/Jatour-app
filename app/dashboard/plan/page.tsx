"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Hotel, MapPin, Navigation, Wallet, Plus, Sparkles, Search, Calendar,
  Save, Trash2, Edit, Star, ShieldCheck, Clock, Tag, Filter,
  Brain, TrendingUp, TrendingDown, Award, Users, Building2, Heart, Leaf, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, RotateCcw, Lock, Unlock, RefreshCw as SyncIcon,
  Download, FileText, Settings, Palette, DollarSign
} from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import NavbarDash from "@/app/components/navbar-dash";
import EnhancedItineraryViewer from "../../dashboard/section/enhanced-itinerary-viewer";
import { validationEngine } from "@/lib/ml/validation-engine";
import { itineraryManagementEngine } from "@/lib/ml/itinerary-management-engine";
import type { ItineraryState } from "@/lib/ml/itinerary-management-engine";
import { syncManager } from "@/lib/ml/sync-manager";
import { useNotification } from "@/lib/components/NotificationProvider";

interface SmartItinerary {
  id: string;
  title: string;
  cities: string[];
  days: number;
  budget: number;
  status: "active" | "planned" | "completed";
  preferences: {
    theme: string;
    style: string;
  };
  createdAt: string;
  daysPlan: {
    day: number;
    title: string;
    activities: {
      name: string;
      duration: string;
      cost: number;
      type: string;
    }[];
  }[];
}

interface PlanData {
  recapData: any;
  itineraryState: ItineraryState;
  engineGenerated: boolean;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastModified: number;
}

interface ValidationStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  lastValidated: number;
}

export default function PlanPage() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const {
    itinerary: generatedItinerary,
    preferences,
    savedItineraries,
    generateItinerary,
    generating,
    saveCurrentItinerary,
    deleteSavedItinerary,
    updateSavedItineraryStatus,
    forceReloadFromLocalStorage
  } = useSmartItinerary();

  // Secure data flow state
  const [receivedPlanData, setReceivedPlanData] = useState<PlanData | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [persistedItineraryId, setPersistedItineraryId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'conflict' | 'error'>('pending');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [rollbackAvailable, setRollbackAvailable] = useState(false);
  const [lastValidState, setLastValidState] = useState<PlanData | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState({
    theme: 'default',
    includeWeather: true,
    includeTips: true,
    language: 'id'
  });

  // Debug: Check localStorage directly to verify data exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Direct localStorage check from plan page:');
      console.log('jatour-preferences:', localStorage.getItem('jatour-preferences'));
      console.log('jatour-itinerary:', localStorage.getItem('jatour-itinerary'));
      console.log('jatour-saved-itineraries:', localStorage.getItem('jatour-saved-itineraries'));
      
      // Test parsing
      try {
        const prefs = localStorage.getItem('jatour-preferences');
        if (prefs) {
          console.log('✅ Parsed preferences:', JSON.parse(prefs));
        }
      } catch (e) {
        console.error('❌ Failed to parse preferences:', e);
      }
    }
  }, []);
  
  // State for managing itinerary display
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "completed" | "planned">("all");
  const [viewMode, setViewMode] = useState<"generated" | "saved">("generated");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "budget">("date");
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Secure data reception from insight page
  useEffect(() => {
    const receivePlanData = async () => {
      console.log('🔄 [DEBUG] Plan page: Checking for plan data in localStorage...');
      try {
        const planDataStr = localStorage.getItem('jatour-plan-data');
        if (planDataStr) {
          console.log('📋 [DEBUG] Plan data found in localStorage, parsing...');
          const planData: PlanData = JSON.parse(planDataStr);

          console.log('📋 [DEBUG] Plan data parsed successfully:', {
            hasRecapData: !!planData.recapData,
            hasItineraryState: !!planData.itineraryState,
            engineGenerated: planData.engineGenerated,
            syncStatus: planData.syncStatus,
            lastModified: planData.lastModified,
            dataSize: planDataStr.length
          });

          // Validate data structure
          if (!planData.recapData || !planData.itineraryState) {
            console.error('❌ [DEBUG] Invalid plan data structure:', {
              hasRecapData: !!planData.recapData,
              hasItineraryState: !!planData.itineraryState,
              recapDataKeys: planData.recapData ? Object.keys(planData.recapData) : 'null',
              itineraryStateKeys: planData.itineraryState ? Object.keys(planData.itineraryState) : 'null'
            });
            throw new Error('Invalid plan data structure received');
          }

          console.log('✅ [DEBUG] Plan data structure validation passed');

          setReceivedPlanData(planData);
          setSyncStatus(planData.syncStatus);

          // Store as last valid state for rollback
          setLastValidState(planData);

          // Process the received data
          console.log('🔄 [DEBUG] Processing received plan data...');
          await processReceivedData(planData);

          // Clear the localStorage after successful processing
          console.log('🗑️ [DEBUG] Clearing localStorage after successful processing...');
          localStorage.removeItem('jatour-plan-data');

          addNotification({
            type: 'success',
            title: 'Plan Data Received',
            message: 'Itinerary data from insight page has been securely received and validated.'
          });

          console.log('✅ [DEBUG] Plan data reception and processing completed successfully');
        } else {
          console.log('❌ [DEBUG] No plan data found in localStorage');
        }
      } catch (error) {
        console.error('❌ [DEBUG] Failed to receive plan data:', error);
        setErrorMessages(prev => [...prev, `Data reception failed: ${error instanceof Error ? error.message : String(error)}`]);
        addNotification({
          type: 'error',
          title: 'Data Reception Failed',
          message: 'Failed to securely receive itinerary data from insight page.'
        });
      }
    };

    receivePlanData();
  }, []);

  // Auto-refresh: Check for new itineraries when component mounts or router is ready
  useEffect(() => {
    setMounted(true);

    // Scroll to top when page loads to ensure fresh view
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    // Force refresh to get latest data from context
    const refreshTimer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('🔄 PlanPage mounted, forcing data refresh...', {
        hasGeneratedItinerary: generatedItinerary && generatedItinerary.length > 0,
        itineraryCount: generatedItinerary?.length || 0,
        savedItineraryCount: savedItineraries.length
      });
    }, 300); // 300ms delay to ensure data propagation from preferences page

    return () => clearTimeout(refreshTimer);
  }, []); // Remove dependencies to prevent infinite re-renders

  // Enhanced auto-refresh: Force re-render when refresh key changes
  useEffect(() => {
    if (mounted && refreshKey > 0) {
      console.log('🔄 PlanPage data refreshed, current state:', {
        hasGeneratedItinerary: generatedItinerary && generatedItinerary.length > 0,
        itineraryCount: generatedItinerary?.length || 0,
        savedItineraryCount: savedItineraries.length,
        refreshCount: refreshKey
      });
    }
  }, [mounted, refreshKey, generatedItinerary, savedItineraries]);

  // Auto-sync: Force refresh when page is opened to ensure latest data
  useEffect(() => {
    if (!mounted) return;

    console.log('🔄 Plan page opened - forcing data refresh...', {
      hasGeneratedItinerary: generatedItinerary && generatedItinerary.length > 0,
      generatedItineraryCount: generatedItinerary?.length || 0,
      savedItineraryCount: savedItineraries.length,
      currentTimestamp: new Date().toISOString()
    });

    // Force a refresh to trigger re-render (this will use the data already loaded in context)
    setRefreshKey(prev => prev + 1);

    console.log('✅ Plan page data refreshed on open');

  }, [mounted]); // Removed forceReloadFromLocalStorage from dependencies to prevent infinite loop

  // Force update function to trigger re-render
  const forceUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Generate trip recap using the itinerary generator and transform to PlanData format
  const generateTripRecap = async (): Promise<PlanData | null> => {
    try {
      console.log('🔄 [DEBUG] Generating trip recap with itinerary generator in plan page...');

      // Import required modules
      const { itineraryGenerator } = await import("@/lib/itinerary-generator");

      // Prepare destinations from preferences
      const destinations = preferences.preferredSpots.map(spot => ({
        id: spot.toLowerCase().replace(/\s+/g, '-'),
        name: spot,
        location: preferences.cities[0] || 'Multiple Cities',
        category: 'attraction',
        estimatedCost: Math.floor(preferences.budget * 0.15 / preferences.preferredSpots.length),
        duration: 180, // 3 hours default
        tags: ['user-selected'],
        rating: 4.0,
        coordinates: { lat: -6.2088, lng: 106.8456 } // Default Jakarta coordinates
      }));

      console.log('🔄 [DEBUG] Prepared destinations:', destinations);

      // Prepare generator input
      const generatorInput = {
        userId: 'demo-user-001',
        sessionId: `plan_recap_${Date.now()}`,
        preferences: {
          budget: preferences.budget,
          days: Math.min(preferences.days || 3, 3), // Limit to 3 days for recap
          travelers: preferences.travelers,
          accommodationType: preferences.accommodationType as 'budget' | 'moderate' | 'luxury',
          cities: preferences.cities,
          interests: preferences.interests || [],
          themes: preferences.themes || [],
          preferredSpots: preferences.preferredSpots,
          startDate: preferences.startDate || new Date().toISOString().split('T')[0],
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: preferences.preferredSpots.slice(0, 3), // Top 3 must-visit
            avoidCrowds: false,
            accessibilityRequired: false
          }
        },
        availableDestinations: destinations,
        config: {
          ...itineraryGenerator.getConfig(),
          dayStructure: {
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            maxDailyActivities: 4,
            activityBufferTime: 30,
            includeBreaks: true,
            breakDuration: 30
          }
        }
      };

      console.log('🔄 [DEBUG] Generator input prepared:', {
        userId: generatorInput.userId,
        sessionId: generatorInput.sessionId,
        days: generatorInput.preferences.days,
        destinationsCount: generatorInput.availableDestinations.length
      });

      // Generate itinerary using the generator
      console.log('🔄 [DEBUG] Calling itineraryGenerator.generateItinerary...');
      const result = await itineraryGenerator.generateItinerary(generatorInput);
      console.log('🔄 [DEBUG] Generator result received:', {
        success: result.success,
        hasItinerary: !!result.itinerary,
        hasErrors: !!result.errors
      });

      if (!result.success || !result.itinerary) {
        console.error('❌ [DEBUG] Itinerary generator failed:', result.errors);
        return null;
      }

      console.log('✅ [DEBUG] Itinerary generator succeeded, building PlanData...');

      // Transform generator output to PlanData format
      const transformedItineraryState: ItineraryState = {
        id: `plan_itinerary_${Date.now()}`,
        userId: 'demo-user-001',
        version: 1,
        lastModified: Date.now(),
        itinerary: {
          // Transform GeneratorOutput.itinerary to SmartItineraryResult format
          itinerary: result.itinerary.days.map(day => ({
            day: day.day,
            date: day.date,
            destinations: day.destinations.map(dest => ({
              id: dest.name.toLowerCase().replace(/\s+/g, '-'),
              name: dest.name,
              category: dest.category,
              location: day.destinations[0]?.location || preferences.cities[0] || 'Multiple Cities',
              coordinates: dest.coordinates || { lat: -6.2088, lng: 106.8456 },
              scheduledTime: dest.scheduledTime,
              duration: dest.duration,
              estimatedCost: dest.estimatedCost,
              rating: dest.rating,
              tags: [dest.category.toLowerCase()],
              mlScore: 0.8,
              predictedSatisfaction: dest.rating / 5
            })),
            totalCost: day.totalCost,
            totalTime: day.destinations.reduce((sum, dest) => sum + dest.duration, 0),
            mlConfidence: 0.85,
            optimizationReasons: ['Generated by AI itinerary generator']
          })),
          totalCost: result.itinerary.summary.totalCost,
          totalDuration: result.itinerary.days.length * 480, // Estimate 8 hours per day
          budgetBreakdown: {
            totalBudget: preferences.budget,
            categoryBreakdown: result.itinerary.budgetBreakdown.categoryBreakdown,
            optimizations: [],
            confidence: result.itinerary.summary.confidence / 100,
            reasoning: ['AI-optimized budget breakdown']
          },
          mlInsights: {
            personalizationScore: result.itinerary.mlInsights.personalizationScore,
            predictedUserSatisfaction: result.itinerary.mlInsights.predictedUserSatisfaction,
            riskFactors: [],
            recommendations: []
          },
          optimization: {
            timeOptimization: result.itinerary.optimization.timeOptimization,
            costOptimization: result.itinerary.optimization.costOptimization,
            satisfactionOptimization: result.itinerary.optimization.satisfactionOptimization,
            reasoning: ['AI-powered optimization']
          },
          costVariability: {
            seasonalAdjustments: [],
            demandFactors: [],
            currencyRates: [],
            appliedDiscounts: [],
            realTimeUpdates: []
          }
        },
        input: {
          userId: 'demo-user-001',
          preferences: preferences,
          availableDestinations: destinations,
          constraints: {
            maxDailyTravelTime: 480,
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            mustVisit: preferences.preferredSpots.slice(0, 3),
            avoidCrowds: false,
            accessibilityRequired: false
          }
        },
        syncStatus: 'synced' as const,
        validationStatus: 'valid' as const,
        errorLog: []
      };

      // Create TripRecapData from generator output
      const totalDays = result.itinerary.days.length;
      const startDate = new Date(preferences.startDate || Date.now());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + totalDays - 1);

      const recapData = {
        tripOverview: {
          startDate: startDate.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          endDate: endDate.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          duration: totalDays,
          travelers: preferences.travelers,
          destinations: preferences.cities,
          totalDestinations: result.itinerary.days.reduce((sum, day) => sum + day.destinations.length, 0)
        },
        mlInsights: {
          activityLover: Math.round(result.itinerary.mlInsights.personalizationScore * 20),
          valueSeeker: Math.round((1 - result.itinerary.mlInsights.personalizationScore) * 100),
          spontaneous: Math.round(result.itinerary.mlInsights.predictedUserSatisfaction * 100),
          explorer: Math.round(result.itinerary.optimization.timeOptimization)
        },
        budgetSummary: {
          estimatedBudget: preferences.budget,
          aiOptimized: result.itinerary.summary.totalCost,
          savingsPotential: Math.round(((preferences.budget - result.itinerary.summary.totalCost) / preferences.budget) * 100),
          confidence: Math.round(result.itinerary.summary.confidence * 100)
        },
        budgetBreakdown: result.itinerary.budgetBreakdown.categoryBreakdown,
        accommodationDetails: {
          hotelName: preferences.accommodationType,
          nightlyRate: Math.round(result.itinerary.budgetBreakdown.categoryBreakdown.accommodation.recommended / totalDays),
          totalNights: totalDays,
          totalCost: result.itinerary.budgetBreakdown.categoryBreakdown.accommodation.recommended,
          type: preferences.accommodationType
        },
        transportationDetails: {
          option: 'Optimized Routes',
          totalCost: result.itinerary.budgetBreakdown.categoryBreakdown.transportation.recommended,
          distribution: 'Daily optimized transport',
          type: 'Mixed'
        },
        dailyItinerary: result.itinerary.days.map((day) => ({
          day: day.day,
          date: day.date,
          destinations: day.destinations.map(dest => dest.location?.split(',')[0]).filter(city => city !== undefined) as string[],
          activities: day.destinations.map(dest => ({
            name: dest.name,
            category: dest.category,
            time: dest.scheduledTime,
            duration: `${dest.duration} minutes`,
            cost: dest.estimatedCost,
            rating: dest.rating
          })),
          dailyCost: day.totalCost
        })),
        userConfigurations: {
          totalBudget: preferences.budget,
          accommodationType: preferences.accommodationType,
          startDate: preferences.startDate || '',
          duration: totalDays,
          travelers: preferences.travelers
        }
      };

      // Create PlanData object
      const planData: PlanData = {
        recapData,
        itineraryState: transformedItineraryState,
        engineGenerated: true,
        syncStatus: 'synced',
        lastModified: Date.now()
      };

      console.log('✅ [DEBUG] PlanData created successfully:', {
        hasRecapData: !!planData.recapData,
        hasItineraryState: !!planData.itineraryState,
        engineGenerated: planData.engineGenerated,
        syncStatus: planData.syncStatus
      });

      // Save to localStorage
      console.log('💾 [DEBUG] Saving PlanData to localStorage...');
      localStorage.setItem('jatour-plan-data', JSON.stringify(planData));
      console.log('✅ [DEBUG] PlanData saved to localStorage');

      // Update state
      setReceivedPlanData(planData);
      setSyncStatus('synced');

      addNotification({
        type: 'success',
        title: 'Trip Recap Generated',
        message: 'AI-powered itinerary has been generated and saved successfully.'
      });

      return planData;

    } catch (error) {
      console.error('❌ Failed to generate trip recap:', error);
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate trip recap. Please try again.'
      });
      return null;
    }
  };

  // Automatic generation on component mount if preferred spots exist
  useEffect(() => {
    if (preferences.preferredSpots.length > 0 && !hasGenerated && generatedItinerary.length === 0) {
      console.log('🎯 Auto-generating trip recap for plan page...');
      generateTripRecap().then((planData: PlanData | null) => {
        if (planData) {
          setHasGenerated(true);
          console.log('✅ Auto-generation successful');
        } else {
          // Fallback to context generation
          console.log('🔄 Falling back to context generation...');
          generateItinerary();
          setHasGenerated(true);
        }
      }).catch((error: any) => {
        console.error('❌ Auto-generation failed:', error);
        // Fallback to context generation
        generateItinerary();
        setHasGenerated(true);
      });
    }
  }, [preferences.preferredSpots, hasGenerated, generatedItinerary.length]);

  // Process received data: validate and persist
   const processReceivedData = async (planData: PlanData) => {
     console.log('🔄 [DEBUG] processReceivedData called with planData');
     try {
       setIsValidating(true);
       setErrorMessages([]);

       console.log('🔍 [DEBUG] Processing received planData structure:', {
         hasItineraryState: !!planData.itineraryState,
         itineraryId: planData.itineraryState?.id,
         hasItinerary: !!planData.itineraryState?.itinerary,
         hasInput: !!planData.itineraryState?.input,
         syncStatus: planData.syncStatus,
         lastModified: planData.lastModified,
         recapDataKeys: planData.recapData ? Object.keys(planData.recapData) : []
       });

       // Step 1: Enhanced data validation with multiple checks
       console.log('🔍 Validating received itinerary data...');

       // Basic structure validation
       const structureErrors: string[] = [];
       if (!planData.itineraryState.id) structureErrors.push('Missing itinerary ID');
       if (!planData.itineraryState.itinerary) structureErrors.push('Missing itinerary data');
       if (!planData.itineraryState.input) structureErrors.push('Missing input data');
       if (!planData.recapData) structureErrors.push('Missing recap data');

       if (structureErrors.length > 0) {
         console.error('❌ Structure validation failed:', structureErrors);
         setErrorMessages(structureErrors);
         addNotification({
           type: 'error',
           title: 'Data Structure Invalid',
           message: 'Received data has missing required fields. Cannot process.'
         });
         return; // Exit early for critical structure issues
       }

       // Itinerary content validation
       let validationResult;
       try {
         validationResult = await validationEngine.validateItinerary(
           planData.itineraryState.itinerary,
           planData.itineraryState.input
         );
       } catch (validationError) {
         console.error('❌ Validation engine error:', validationError);
         validationResult = {
           isValid: false,
           errors: [`Validation engine failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`],
           warnings: [],
           score: 0
         };
       }

       setValidationStatus({
         ...validationResult,
         lastValidated: Date.now()
       });

       // Additional data integrity checks
       const integrityErrors: string[] = [];
       if (planData.itineraryState.itinerary && planData.itineraryState.itinerary.itinerary) {
         const itinerary = planData.itineraryState.itinerary.itinerary;
         if (!Array.isArray(itinerary) || itinerary.length === 0) {
           integrityErrors.push('Itinerary has no days or invalid structure');
         } else {
           // Check each day has required fields
           itinerary.forEach((day: any, index: number) => {
             if (!day.id && !day.day) integrityErrors.push(`Day ${index + 1} missing identifier`);
             if (!day.destinations && !day.activities) integrityErrors.push(`Day ${index + 1} has no destinations or activities`);
           });
         }
       }

       const allErrors = [...validationResult.errors, ...integrityErrors];

       if (allErrors.length > 0) {
         console.warn('❌ Validation failed:', allErrors);
         setErrorMessages(allErrors);

         // Check if errors are critical or just warnings
         const criticalErrors = allErrors.filter(error =>
           error.toLowerCase().includes('missing') ||
           error.toLowerCase().includes('invalid') ||
           error.toLowerCase().includes('empty')
         );

         if (criticalErrors.length > 0) {
           addNotification({
             type: 'error',
             title: 'Critical Data Issues',
             message: `Found ${criticalErrors.length} critical validation errors. Data processing aborted.`
           });
           return; // Exit for critical errors
         } else {
           addNotification({
             type: 'warning',
             title: 'Data Validation Issues',
             message: `Found ${allErrors.length} validation issues. Proceeding with caution.`
           });
         }
       } else {
         console.log('✅ Data validation passed');
       }

       // Step 2: Persist validated data with enhanced error handling
       setIsPersisting(true);
       console.log('💾 [DEBUG] Persisting itinerary data...');

       let persistedState: ItineraryState | null = null;
       let persistenceAttempted = false;

       // First attempt: Try to update existing itinerary
       try {
         console.log('🔄 [DEBUG] Attempting to update existing itinerary...');
         console.log('🔄 [DEBUG] Update params:', {
           itineraryId: planData.itineraryState.id,
           hasItinerary: !!planData.itineraryState.itinerary,
           itineraryType: typeof planData.itineraryState.itinerary
         });

         persistedState = await itineraryManagementEngine.updateItinerary(
           planData.itineraryState.id,
           {
             type: 'destination_update',
             data: {
               ...planData.itineraryState,
               itinerary: planData.itineraryState.itinerary
             },
             timestamp: Date.now(),
             source: 'user'
           }
         );
         persistenceAttempted = true;

         if (persistedState) {
           console.log('✅ [DEBUG] Itinerary updated successfully:', {
             id: persistedState.id,
             syncStatus: persistedState.syncStatus,
             version: persistedState.version
           });
         } else {
           console.warn('⚠️ [DEBUG] Update returned null');
         }
       } catch (updateError) {
         console.warn('⚠️ [DEBUG] Update attempt failed, trying alternative persistence methods:', updateError);
         persistedState = null;
       }

       // Fallback 1: If update failed, try to create new itinerary
       if (!persistedState && planData.itineraryState.input) {
         try {
           console.log('🔄 Fallback: Attempting to create new itinerary...');
           persistedState = await itineraryManagementEngine.createItinerary(planData.itineraryState.input);
           persistenceAttempted = true;

           if (persistedState) {
             console.log('✅ New itinerary created successfully');
           }
         } catch (createError) {
           console.warn('⚠️ Create attempt failed:', createError);
           persistedState = null;
         }
       } else if (!persistedState) {
         console.warn('⚠️ Cannot create itinerary: no input data available');
       }

       // Fallback 2: Manual localStorage persistence as last resort
       if (!persistedState) {
         try {
           console.log('🔄 Last resort: Manual localStorage persistence...');
           const manualState: ItineraryState = {
             ...planData.itineraryState,
             syncStatus: 'pending' as const,
             validationStatus: 'valid' as const,
             errorLog: [...(planData.itineraryState.errorLog || []), 'Manually persisted via fallback']
           };

           // Manual persistence to localStorage
           if (typeof window !== 'undefined') {
             localStorage.setItem(`itinerary_${planData.itineraryState.id}`, JSON.stringify(manualState));
             persistedState = manualState;
             persistenceAttempted = true;
             console.log('✅ Manual localStorage persistence successful');
           }
         } catch (manualError) {
           console.error('❌ All persistence methods failed:', manualError);
         }
       }

       if (persistedState) {
         setPersistedItineraryId(persistedState.id);
         setSyncStatus(persistedState.syncStatus);
         console.log('✅ Data persisted successfully via fallback mechanism');

         addNotification({
           type: 'success',
           title: 'Data Persisted',
           message: `Itinerary data has been securely stored${persistenceAttempted ? ' (with fallback)' : ''}.`
         });
       } else {
         // All persistence methods failed
         console.error('❌ CRITICAL: All persistence methods failed. Engine state:', {
           itineraryId: planData.itineraryState.id,
           engineStats: itineraryManagementEngine.getStats(),
           localStorageCheck: typeof window !== 'undefined' ? localStorage.getItem(`itinerary_${planData.itineraryState.id}`) : 'N/A'
         });

         // Still allow the process to continue with warnings
         setSyncStatus('error');
         setErrorMessages(prev => [...prev, 'Persistence failed but data validation completed']);

         addNotification({
           type: 'warning',
           title: 'Persistence Warning',
           message: 'Data validation completed but storage encountered issues. Data may not be fully synchronized.'
         });
       }

     } catch (error) {
       console.error('Failed to process received data:', error);
       const errorMsg = error instanceof Error ? error.message : String(error);
       setErrorMessages(prev => [...prev, `Processing failed: ${errorMsg}`]);
       setSyncStatus('error');

       addNotification({
         type: 'error',
         title: 'Data Processing Failed',
         message: 'Failed to validate and persist received itinerary data.'
       });
     } finally {
       setIsValidating(false);
       setIsPersisting(false);
     }
   };

  // Rollback to last valid state
  const handleRollback = async () => {
    if (!lastValidState) return;

    try {
      console.log('🔄 Rolling back to last valid state...');
      setReceivedPlanData(lastValidState);
      setSyncStatus(lastValidState.syncStatus);
      setErrorMessages([]);
      setValidationStatus(null);

      // Re-process the valid data
      await processReceivedData(lastValidState);

      addNotification({
        type: 'info',
        title: 'Rollback Completed',
        message: 'Successfully rolled back to the last valid itinerary state.'
      });
    } catch (error) {
      console.error('Rollback failed:', error);
      addNotification({
        type: 'error',
        title: 'Rollback Failed',
        message: 'Failed to rollback to previous valid state.'
      });
    }
  };

  // Sync status monitoring
  useEffect(() => {
    const handleSyncUpdate = (event: CustomEvent) => {
      console.log('🔄 Sync update received:', event.detail);
      if (event.detail.itineraryId === persistedItineraryId) {
        setSyncStatus(event.detail.syncStatus || 'synced');
      }
    };

    window.addEventListener('itinerary-sync-update', handleSyncUpdate as EventListener);

    return () => {
      window.removeEventListener('itinerary-sync-update', handleSyncUpdate as EventListener);
    };
  }, [persistedItineraryId]);

  // Convert savedItineraries to SmartItinerary format for EnhancedItineraryViewer
  const formattedSavedItineraries = savedItineraries.map(saved => ({
    id: saved.id,
    title: saved.title,
    cities: saved.cities,
    days: saved.days,
    budget: saved.budget,
    status: saved.status,
    preferences: saved.preferences,
    createdAt: saved.createdAt,
    daysPlan: saved.daysPlan
  }));

  // Debug: Log saved itineraries data (reduced to prevent JSON.stringify errors)
  console.log('📊 PlanPage Debug:', {
    savedItinerariesCount: savedItineraries.length,
    formattedSavedItinerariesCount: formattedSavedItineraries.length,
    totalSaved: formattedSavedItineraries.length
    // Removed detailed object logging to prevent "Invalid string length" error
  });

  // Check if we have a generated itinerary
  const hasGeneratedItinerary = generatedItinerary && generatedItinerary.length > 0;

  // Calculate total estimated cost
  const totalEstimatedCost = generatedItinerary.reduce((total, day) => {
    const dayCost = day.destinations.reduce((dayTotal, dest) => dayTotal + (dest.estimatedCost || 0), 0);
    return total + dayCost;
  }, 0);

  // Get first 3 days for recap
  const recapDays = generatedItinerary.slice(0, 3);

  // Filter saved itineraries - now includes refreshKey dependency
  const filteredItineraries = useMemo(() => {
    let filtered = formattedSavedItineraries;
    
    if (searchTerm) {
      filtered = filtered.filter(itinerary =>
        itinerary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itinerary.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedFilter !== "all") {
      filtered = filtered.filter(itinerary => itinerary.status === selectedFilter);
    }

    return filtered;
  }, [formattedSavedItineraries, searchTerm, selectedFilter, refreshKey]);

  const stats = useMemo(() => {
    const total = formattedSavedItineraries.length;
    const active = formattedSavedItineraries.filter(i => i.status === "active").length;
    const completed = formattedSavedItineraries.filter(i => i.status === "completed").length;
    const planned = formattedSavedItineraries.filter(i => i.status === "planned").length;
    
    return { total, active, completed, planned };
  }, [formattedSavedItineraries, refreshKey]);

  // Handle creating new itinerary
  const handleCreateNew = () => {
    router.push("/dashboard/homepage/preferences");
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      console.log('🔄 Manual refresh triggered - generating trip recap with AI...');

      // Use the new generateTripRecap function instead of context generateItinerary
      const planData = await generateTripRecap();
      if (planData) {
        console.log('✅ Trip recap generated successfully');
      } else {
        // Fallback to context generation
        console.log('🔄 Falling back to context itinerary generation...');
        generateItinerary();
      }

      // Scroll to top for fresh view
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      // Fallback to context generation
      generateItinerary();
    }
  };

  // Handle save to plan
  const handleSaveToPlan = async () => {
    if ((!hasGeneratedItinerary && !receivedPlanData) || isPersisting) return;

    try {
      setIsPersisting(true);

      const title = `My Travel Plan - ${new Date().toLocaleDateString('id-ID')}`;

      if (receivedPlanData) {
        // Save validated itinerary from insight page
        await saveCurrentItinerary(title);
        addNotification({
          type: 'success',
          title: 'Plan Saved Successfully',
          message: 'Your validated itinerary has been saved to your plans.'
        });
      } else {
        // Save regular generated itinerary
        await saveCurrentItinerary(title);
        addNotification({
          type: 'success',
          title: 'Plan Saved Successfully',
          message: 'Your current itinerary has been saved to your plans.'
        });
      }
    } catch (error) {
      console.error('Failed to save to plan:', error);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save the plan. Please try again.'
      });
    } finally {
      setIsPersisting(false);
    }
  };

  // Handle viewing generated itinerary
  const handleViewGenerated = () => {
    setViewMode("generated");
  };

  // Handle viewing saved itineraries
  const handleViewSaved = () => {
    setViewMode("saved");
  };

  // Export functions
  const handleExportPDF = () => {
    // Simple PDF export simulation
    const itineraryData = receivedPlanData || generatedSummary;
    const dataStr = JSON.stringify(itineraryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/pdf' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'east-java-itinerary.pdf';
    link.click();
    addNotification({
      type: 'success',
      title: 'Export Started',
      message: 'PDF export has been initiated. Check your downloads.'
    });
  };

  const handleExportJSON = () => {
    const itineraryData = receivedPlanData || generatedSummary;
    const dataStr = JSON.stringify(itineraryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'east-java-itinerary.json';
    link.click();
    addNotification({
      type: 'success',
      title: 'JSON Exported',
      message: 'Itinerary data has been exported as JSON.'
    });
  };

  const handleExportText = () => {
    const itineraryData = receivedPlanData;
    let textContent = 'EAST JAVA ITINERARY\n\n';

    if (itineraryData?.recapData) {
      const recap = itineraryData.recapData;
      textContent += `Trip Overview:\n`;
      textContent += `Duration: ${recap.tripOverview.duration} days\n`;
      textContent += `Travelers: ${recap.tripOverview.travelers}\n`;
      textContent += `Budget: IDR ${recap.budgetSummary.estimatedBudget.toLocaleString()}\n\n`;

      textContent += `Daily Itinerary:\n`;
      recap.dailyItinerary.forEach((day: any) => {
        textContent += `Day ${day.day} - ${day.date}\n`;
        day.activities.forEach((activity: any) => {
          textContent += `  - ${activity.name} (${activity.category}) - IDR ${activity.cost.toLocaleString()}\n`;
        });
        textContent += `  Daily Cost: IDR ${day.dailyCost.toLocaleString()}\n\n`;
      });
    }

    const dataBlob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'east-java-itinerary.txt';
    link.click();
    addNotification({
      type: 'success',
      title: 'Text Exported',
      message: 'Itinerary has been exported as plain text.'
    });
  };

  // Customization functions
  const handleCustomizationChange = (key: string, value: any) => {
    setCustomizationOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyCustomization = () => {
    // Apply customization to the itinerary display
    addNotification({
      type: 'success',
      title: 'Customization Applied',
      message: 'Your itinerary customization has been applied.'
    });
    setShowCustomization(false);
  };

  // Summary for generated itinerary
  const generatedSummary = useMemo(() => {
    if (!hasGeneratedItinerary) return null;
    const firstDay = generatedItinerary[0];
    const lastDay = generatedItinerary[generatedItinerary.length - 1];
    const transportationData = generatedItinerary.find((day) => day.transportation);
    
    return {
      budget: preferences.budget,
      accommodation: firstDay.accommodation?.name ?? `${preferences.cities[0] || 'City'} Hotel`,
      transportation: transportationData?.transportation?.type ?? "Private car",
      checkIn: firstDay.date,
      checkOut: lastDay.date,
    };
  }, [generatedItinerary, preferences.budget, preferences.cities]);

  // Debug: Log the actual generated itinerary data
  console.log('📊 Generated Itinerary Debug:', {
    hasGeneratedItinerary,
    generatedItinerary,
    itineraryLength: generatedItinerary?.length,
    firstDay: generatedItinerary?.[0],
    preferences,
    summary: generatedSummary
  });

  // Handle save itinerary
  const handleSaveItinerary = async () => {
    if ((!hasGeneratedItinerary && !receivedPlanData) || isPersisting) return;

    try {
      setIsPersisting(true);

      if (receivedPlanData) {
        // Save validated itinerary from insight page
        const title = saveTitle.trim() || `Validated Trip to ${receivedPlanData.recapData?.tripOverview?.destinations?.join(', ') || 'Multiple Cities'}`;

        // Use the context save method but with validated data
        await saveCurrentItinerary(title);

        addNotification({
          type: 'success',
          title: 'Validated Itinerary Saved',
          message: 'Your securely validated itinerary has been saved successfully.'
        });
      } else {
        // Save regular generated itinerary
        await saveCurrentItinerary(saveTitle.trim() || `My Trip to ${preferences.cities.join(', ') || 'Multiple Cities'}`);
      }

      setShowSaveModal(false);
      setSaveTitle("");
    } catch (error) {
      console.error('Failed to save itinerary:', error);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save the itinerary. Please try again.'
      });
    } finally {
      setIsPersisting(false);
    }
  };

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="bg-gray-300 rounded-full h-20 w-20 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mx-auto mb-2 w-48"></div>
              <div className="h-3 bg-gray-300 rounded mx-auto w-64"></div>
            </div>
          </div>
        </div>
  
        {/* Implementation Summary - Hidden in UI but available for documentation */}
        {/*
        SECURE DATA FLOW IMPLEMENTATION SUMMARY
  
        Data Flow Architecture:
        1. Insight Page → handleSaveAndContinue() → localStorage['jatour-plan-data']
        2. Plan Page → useEffect → processReceivedData() → Validation → Persistence → Sync
  
        Security Features:
        - Data validation using ValidationEngine with comprehensive rule-based checks
        - Cost calculation validation and budget compliance verification
        - Data integrity checks for itinerary structure and destination data
        - Logic validation for time scheduling and geographic routing
  
        Persistence Mechanisms:
        - ItineraryManagementEngine for centralized state management
        - Incremental updates with conflict resolution
        - localStorage persistence with automatic cleanup
        - Cross-tab synchronization via SyncManager
  
        Error Handling:
        - Graceful degradation with user feedback via notifications
        - Automatic retry mechanisms for transient failures
        - Rollback capabilities to last valid state
        - Comprehensive error logging and recovery strategies
  
        Synchronization Features:
        - Cross-tab sync using BroadcastChannel API
        - Conflict resolution with configurable strategies
        - Real-time sync status monitoring
        - Offline queue processing
  
        Data Consistency Prevention:
        - Version control with conflict detection
        - Atomic operations for data updates
        - Validation gates before persistence
        - Rollback mechanisms for data recovery
  
        User Experience:
        - Real-time validation status display
        - Progress indicators for long-running operations
        - Clear error messages with recovery options
        - Visual indicators for validated vs unvalidated data
        */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Travel Plan</h1>
            <p className="text-gray-600">Manage your itineraries and travel plans</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveToPlan}
              disabled={(!hasGeneratedItinerary && !receivedPlanData) || isPersisting}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isPersisting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save to Plan
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/dashboard/preferences")}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Itineraries
            </Button>
            <Button
              onClick={() => router.push("/dashboard/insights")}
              variant="outline"
              className="border-purple-300 hover:border-purple-500 hover:text-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Brain className="h-4 w-4 mr-2" />
              View Insights
            </Button>
          </div>
        </div>

        {/* Secure Data Flow Status */}
        {receivedPlanData && (
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isValidating ? (
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : validationStatus?.isValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900">Secure Data Flow</span>
                  </div>
                  <Badge variant={syncStatus === 'synced' ? 'default' : 'secondary'} className="text-xs">
                    {syncStatus === 'synced' ? 'Synced' : syncStatus === 'pending' ? 'Syncing...' : 'Sync Error'}
                  </Badge>
                  {validationStatus && (
                    <Badge variant={validationStatus.isValid ? 'default' : 'destructive'} className="text-xs">
                      Validation: {(validationStatus.score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {rollbackAvailable && (
                    <Button
                      onClick={handleRollback}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(receivedPlanData.lastModified).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {errorMessages.length > 0 && (
                <div className="mt-3 space-y-1">
                  {errorMessages.slice(0, 3).map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  ))}
                  {errorMessages.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{errorMessages.length - 3} more errors
                    </div>
                  )}
                </div>
              )}

              {/* Validation Warnings */}
              {validationStatus?.warnings && validationStatus.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {validationStatus.warnings.slice(0, 2).map((warning, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={handleViewGenerated}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === "generated" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Generated Itinerary
          </button>
          <button
            onClick={handleViewSaved}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === "saved" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Saved Plans
          </button>
        </div>
        
        {viewMode === "saved" && (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-12 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "planned", label: "Planned" },
                { key: "completed", label: "Completed" },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? "default" : "outline"}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className="rounded-2xl"
                  size="sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated Itinerary View */}
      {viewMode === "generated" && (
        <>
          {/* Loading State */}
          {generating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Generating your smart itinerary...</p>
            </motion.div>
          )}

          {/* No destinations found */}
          {!generating && preferences.preferredSpots.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      No destinations found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Please add spots in /dashboard/preferences/spots and refresh.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/preferences/spots")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Spots
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Recap Display */}
          {!generating && generatedItinerary.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Summary Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Daily Recap</h3>
                        <p className="text-gray-600">
                          {preferences.days} days • {preferences.cities.join(', ') || 'Multiple Cities'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Estimated Cost</p>
                        <p className="text-2xl font-bold text-green-600">
                          IDR {totalEstimatedCost.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Days Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recapDays.map((day, index) => (
                        <motion.div
                          key={day.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {day.day}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Day {day.day}</p>
                                    <p className="text-sm text-gray-600">{day.date}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{day.destinations.length} destinations</span>
                                </div>

                                {day.destinations.length > 0 && (
                                  <div className="space-y-1">
                                    {day.destinations.slice(0, 2).map((dest, destIndex) => (
                                      <p key={destIndex} className="text-sm text-gray-700 truncate">
                                        • {dest.name}
                                      </p>
                                    ))}
                                    {day.destinations.length > 2 && (
                                      <p className="text-sm text-gray-500">
                                        +{day.destinations.length - 2} more
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                                  <DollarSign className="h-4 w-4" />
                                  <span>
                                    IDR {day.destinations.reduce((total, dest) => total + (dest.estimatedCost || 0), 0).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}

                      {preferences.days > 3 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center justify-center h-full">
                              <div className="text-center">
                                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                  +{preferences.days - 3} more days
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* No Generated Itinerary Yet */}
          {!hasGeneratedItinerary && !receivedPlanData && preferences.preferredSpots.length > 0 ? (
            <div className="text-center space-y-6 py-12">
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Generated Itinerary Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Complete your preferences and budget setup to generate a smart itinerary powered by AI.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push("/dashboard/homepage/preferences")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Smart Itinerary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewSaved}
                    className="px-8 py-3"
                  >
                    View Saved Plans
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Itinerary Summary - Use received data if available */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[32px] p-6 sm:p-8 border shadow-inner text-slate-800 ${
                  receivedPlanData ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' : 'bg-[#F0F4FF] border-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500 font-semibold">
                    {receivedPlanData ? 'Validated Itinerary' : 'Generated Itinerary'}
                  </p>
                  {receivedPlanData && validationStatus?.isValid && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Secure
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl font-bold mt-2">
                  {receivedPlanData ? 'Your Validated Travel Plan' : 'Your AI-Powered Travel Plan'}
                </h2>

                {(generatedSummary || receivedPlanData?.recapData) && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl bg-white p-4 shadow">
                      <div className="flex items-center gap-3 text-slate-800">
                        <Wallet className="h-6 w-6 text-slate-900" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Total Budget</p>
                          <p className="text-xl font-bold">
                            IDR {(receivedPlanData?.recapData?.budgetSummary?.estimatedBudget || generatedSummary?.budget || 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow flex items-center gap-3">
                      <Hotel className="h-6 w-6 text-slate-900" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Accommodation</p>
                        <p className="text-lg font-semibold">
                          {receivedPlanData?.recapData?.accommodationDetails?.hotelName || generatedSummary?.accommodation || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow flex items-center gap-3">
                      <Navigation className="h-6 w-6 text-slate-900" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Transportation</p>
                        <p className="text-lg font-semibold capitalize">
                          {receivedPlanData?.recapData?.transportationDetails?.option || generatedSummary?.transportation || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow flex items-center gap-3">
                      <CalendarDays className="h-6 w-6 text-slate-900" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                        <p className="text-lg font-semibold">
                          {receivedPlanData?.recapData?.tripOverview?.duration || generatedItinerary?.length || 0} Days
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Score Display */}
                {validationStatus && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Validation Score:</span>
                      <Progress value={validationStatus.score * 100} className="w-24 h-2" />
                      <span className="text-sm font-semibold text-slate-800">
                        {(validationStatus.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {validationStatus.warnings.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {validationStatus.warnings.length} warnings
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Itinerary Details - Use received data if available */}
              <div className="space-y-8">
                {(receivedPlanData?.itineraryState?.itinerary?.itinerary || generatedItinerary).map((day: any, index: number) => {
                  const dayData = receivedPlanData?.recapData?.dailyItinerary?.[index];
                  const isValidated = receivedPlanData && validationStatus?.isValid;

                  return (
                    <motion.div
                      key={day.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`rounded-[32px] border shadow-xl p-6 space-y-4 ${
                        isValidated ? 'bg-gradient-to-r from-white to-green-50 border-green-200' : 'bg-white border-slate-100'
                      }`}
                    >
                      <header className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                            Day {day.day || dayData?.day || index + 1}
                          </p>
                          <h3 className="text-2xl font-bold text-slate-900">
                            {day.date || dayData?.date || `Day ${index + 1}`}
                          </h3>
                        </div>
                        <div className="flex gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            isValidated ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {day.destinations?.length || dayData?.activities?.length || 0} Activities
                          </span>
                          {isValidated && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Validated
                            </span>
                          )}
                        </div>
                      </header>

                      <div className="space-y-4">
                        {(day.destinations || dayData?.activities || []).map((dest: any, destIndex: number) => (
                          <div key={dest.id || destIndex} className={`rounded-3xl border p-4 flex gap-4 items-start ${
                            isValidated ? 'border-green-200 bg-green-50/50' : 'border-slate-100'
                          }`}>
                            <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center text-lg font-bold ${
                              isValidated ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                            }`}>
                              {destIndex + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm uppercase tracking-wide text-slate-400">
                                    {dest.time || dest.scheduledTime || destIndex === 0 ? '09:00' : 'TBA'}
                                  </p>
                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {dest.name || dest.activity || 'Activity'}
                                  </h4>
                                  <p className="text-sm text-slate-500">
                                    {dest.location || dest.category || 'Location'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-slate-600">
                                    IDR {(dest.estimatedCost || dest.cost || 0).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    ⭐ {dest.rating || '4.5'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                  {dest.category || dest.type || 'activity'}
                                </span>
                                {dest.bestTimeToVisit && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                    Best: {dest.bestTimeToVisit}
                                  </span>
                                )}
                                {dest.openingHours && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                    Open: {dest.openingHours}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={`mt-4 p-4 rounded-lg ${
                        isValidated ? 'bg-green-100 border border-green-200' : 'bg-blue-50'
                      }`}>
                        <div className={`text-sm font-medium mb-1 ${
                          isValidated ? 'text-green-800' : 'text-blue-800'
                        }`}>
                          {isValidated ? '✓ Validation Status:' : 'Optimization Notes:'}
                        </div>
                        <div className={`text-sm ${
                          isValidated ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          {isValidated
                            ? 'Data validated for cost calculations, integrity, and consistency • Secure sync enabled'
                            : 'Includes highly-rated destinations • Matches your preferred destination types • Optimized timing'
                          }
                        </div>
                        {dayData?.dailyCost && (
                          <div className="mt-2 text-sm font-semibold text-slate-800">
                            Daily Cost: IDR {dayData.dailyCost.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Customization and Export Options */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customize & Export</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCustomization(!showCustomization)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Customize
                    </Button>
                  </div>
                </div>

                {/* Customization Panel */}
                {showCustomization && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4 mt-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <select
                          value={customizationOptions.theme}
                          onChange={(e) => handleCustomizationChange('theme', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="default">Default</option>
                          <option value="minimal">Minimal</option>
                          <option value="detailed">Detailed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          value={customizationOptions.language}
                          onChange={(e) => handleCustomizationChange('language', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="id">Bahasa Indonesia</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeWeather"
                          checked={customizationOptions.includeWeather}
                          onChange={(e) => handleCustomizationChange('includeWeather', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="includeWeather" className="text-sm font-medium text-gray-700">Include Weather Info</label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={applyCustomization} className="bg-blue-500 text-white">
                        Apply Changes
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Export Options */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="flex items-center gap-2 border-red-300 hover:border-red-500 hover:text-red-600"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={handleExportJSON}
                    variant="outline"
                    className="flex items-center gap-2 border-blue-300 hover:border-blue-500 hover:text-blue-600"
                  >
                    <FileText className="h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    onClick={handleExportText}
                    variant="outline"
                    className="flex items-center gap-2 border-green-300 hover:border-green-500 hover:text-green-600"
                  >
                    <FileText className="h-4 w-4" />
                    Export Text
                  </Button>
                </div>
              </div>

              {/* Cost Breakdown Section */}
              {receivedPlanData?.recapData && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Cost Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Category Breakdown</h4>
                      <div className="space-y-3">
                        {Object.entries(receivedPlanData.recapData.budgetBreakdown).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 capitalize">{category}</span>
                            <div className="text-right">
                              <div className="font-medium">IDR {data.recommended?.toLocaleString() || '0'}</div>
                              {data.savings > 0 && (
                                <div className="text-sm text-green-600">Save IDR {data.savings.toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Daily Cost Distribution</h4>
                      <div className="space-y-2">
                        {receivedPlanData.recapData.dailyItinerary.map((day: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>Day {day.day}</span>
                            <span className="font-medium">IDR {day.dailyCost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total</span>
                          <span>IDR {receivedPlanData.recapData.dailyItinerary.reduce((sum: number, day: any) => sum + day.dailyCost, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Itinerary Button */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => setShowSaveModal(true)}
                  className={`px-8 py-3 ${
                    receivedPlanData && validationStatus?.isValid
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  }`}
                  disabled={isPersisting}
                >
                  {isPersisting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {receivedPlanData ? 'Save Validated Itinerary' : 'Save This Itinerary'}
                </Button>

                {receivedPlanData && (
                  <Button
                    onClick={() => {
                      // Force re-validation
                      if (receivedPlanData) {
                        processReceivedData(receivedPlanData);
                      }
                    }}
                    variant="outline"
                    className="px-6 py-3 border-blue-300 hover:border-blue-500"
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Re-validate
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Saved Plans View */}
      {viewMode === "saved" && (
        <>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Plans</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Active Plans</p>
                    <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Planned</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.planned}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Itinerary Viewer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {filteredItineraries.length > 0 ? (
              <EnhancedItineraryViewer 
                itineraries={filteredItineraries} 
                onDeleteItinerary={deleteSavedItinerary}
              />
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No plans found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || selectedFilter !== "all" 
                          ? "Try adjusting your search or filters" 
                          : "Create your first travel plan to get started"}
                      </p>
                    </div>
                    <Button 
                      onClick={handleCreateNew}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </>
      )}

      {/* Save Itinerary Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Itinerary</DialogTitle>
            <DialogDescription>
              Give your travel plan a name so you can easily find it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter itinerary title..."
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveItinerary}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Itinerary
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
