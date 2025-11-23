// Itinerary Management Engine - Central Orchestrator
// Handles incremental sync, validation pipeline, error recovery, and dynamic updates

import { SmartItineraryEngine, SmartItineraryInput, SmartItineraryResult, SmartItineraryDay } from './smart-itinerary-engine';
import { SyncManager } from './sync-manager';
import { ValidationEngine } from './validation-engine';
import { TestingFramework } from './testing-framework';
import { PersistenceManager, GeneratorOutput, ItineraryGeneratorConfig } from '../itinerary-generator/itinerary-generator';

export interface ItineraryState {
  id: string;
  userId: string;
  version: number;
  lastModified: number;
  itinerary: SmartItineraryResult | null;
  input: SmartItineraryInput | null;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  validationStatus: 'valid' | 'invalid' | 'pending';
  errorLog: string[];
}

export interface ItineraryUpdate {
  type: 'destination_add' | 'destination_remove' | 'destination_update' | 'budget_change' | 'date_change' | 'preference_update';
  data: any;
  timestamp: number;
  source: 'user' | 'sync' | 'auto';
}

export interface ItineraryManagementConfig {
  enableIncrementalUpdates: boolean;
  enableAutoSync: boolean;
  enableValidation: boolean;
  maxRetryAttempts: number;
  syncInterval: number;
  cacheTimeout: number;
  // Scalability features
  enableLazyLoading: boolean;
  maxDestinationsInMemory: number;
  destinationBatchSize: number;
  enableAdvancedCaching: boolean;
  memoryCleanupInterval: number;
  backgroundSyncEnabled: boolean;
  batchProcessingSize: number;
  // Enhanced persistence configuration
  persistence: {
    primaryStorage: 'localStorage' | 'database' | 'hybrid';
    backupEnabled: boolean;
    syncInterval: number;
    maxRetries: number;
  };
}

export class ItineraryManagementEngine {
  private itineraryStates: Map<string, ItineraryState> = new Map();
  private updateQueue: Map<string, ItineraryUpdate[]> = new Map();
  private config: ItineraryManagementConfig;
  private syncManager: SyncManager;
  private validationEngine: ValidationEngine;
  private testingFramework: TestingFramework;
  private persistenceManager: PersistenceManager;

  // Scalability enhancements
  private destinationCache: Map<string, any> = new Map(); // LRU-style cache for destinations
  private memoryUsageTracker: Map<string, number> = new Map(); // Track memory usage per itinerary
  private lazyLoadQueue: Set<string> = new Set(); // Queue for lazy loading
  private batchProcessingQueue: Array<{ itineraryId: string; updates: ItineraryUpdate[] }> = [];
  private backgroundSyncWorker: Worker | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ItineraryManagementConfig> = {}) {
    this.config = {
      enableIncrementalUpdates: true,
      enableAutoSync: true,
      enableValidation: true,
      maxRetryAttempts: 3,
      syncInterval: 30000, // 30 seconds
      cacheTimeout: 3600000, // 1 hour
      // Scalability defaults
      enableLazyLoading: true,
      maxDestinationsInMemory: 100,
      destinationBatchSize: 20,
      enableAdvancedCaching: true,
      memoryCleanupInterval: 300000, // 5 minutes
      backgroundSyncEnabled: true,
      batchProcessingSize: 10,
      // Enhanced persistence defaults
      persistence: {
        primaryStorage: 'hybrid',
        backupEnabled: true,
        syncInterval: 30000,
        maxRetries: 3
      },
      ...config
    };

    this.syncManager = new SyncManager();
    this.validationEngine = new ValidationEngine();
    this.testingFramework = new TestingFramework();
    this.persistenceManager = new PersistenceManager(this.config.persistence);

    this.initializeScalabilityFeatures();
    this.initializeEventListeners();
    this.startAutoSync();
  }

  // Scalability feature initialization
  private initializeScalabilityFeatures(): void {
    if (this.config.enableAdvancedCaching) {
      this.startMemoryCleanup();
    }

    if (this.config.backgroundSyncEnabled) {
      this.initializeBackgroundSync();
    }

    if (this.config.enableLazyLoading) {
      this.startLazyLoadingProcessor();
    }
  }

  // Core itinerary management methods
  async createItinerary(input: SmartItineraryInput): Promise<ItineraryState> {
    console.log(`[ItineraryManagementEngine] Creating new itinerary for user ${input.userId}`);

    const itineraryId = this.generateItineraryId(input.userId);
    const state: ItineraryState = {
      id: itineraryId,
      userId: input.userId,
      version: 1,
      lastModified: Date.now(),
      itinerary: null,
      input,
      syncStatus: 'pending',
      validationStatus: 'pending',
      errorLog: []
    };

    this.itineraryStates.set(itineraryId, state);
    this.updateQueue.set(itineraryId, []);

    try {
      // Generate initial itinerary
      const result = await this.generateItinerary(input);
      state.itinerary = result;
      state.validationStatus = 'valid';
      state.syncStatus = 'synced';

      // Persist using advanced persistence manager
      await this.persistItinerary(itineraryId, state);

      console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} created successfully`);
      return state;
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Failed to create itinerary:`, error);
      state.errorLog.push(`Creation failed: ${error instanceof Error ? error.message : String(error)}`);
      state.syncStatus = 'error';
      return state;
    }
  }

  // Enhanced method to create itinerary from generator output
  async createItineraryFromGenerator(generatorOutput: GeneratorOutput): Promise<ItineraryState> {
    console.log(`[ItineraryManagementEngine] Creating itinerary from generator output: ${generatorOutput.itineraryId}`);

    const itineraryId = generatorOutput.itineraryId;
    const state: ItineraryState = {
      id: itineraryId,
      userId: 'generator_user', // Will be updated when more context is available
      version: 1,
      lastModified: generatorOutput.itinerary.summary.generatedAt,
      itinerary: {
        itinerary: [], // Simplified - full conversion would require type alignment
        totalCost: generatorOutput.itinerary.summary.totalCost,
        totalDuration: generatorOutput.itinerary.summary.totalDuration,
        budgetBreakdown: {
          totalBudget: generatorOutput.itinerary.budgetBreakdown.totalBudget,
          categoryBreakdown: generatorOutput.itinerary.budgetBreakdown.categoryBreakdown,
          optimizations: [],
          confidence: generatorOutput.itinerary.budgetBreakdown.confidence,
          reasoning: generatorOutput.itinerary.budgetBreakdown.reasoning
        } as any, // Type assertion for compatibility
        mlInsights: generatorOutput.itinerary.mlInsights,
        optimization: generatorOutput.itinerary.optimization,
        costVariability: generatorOutput.itinerary.costVariability as any // Type assertion for compatibility
      },
      input: null, // Generator output doesn't include input
      syncStatus: 'synced',
      validationStatus: 'valid',
      errorLog: []
    };

    this.itineraryStates.set(itineraryId, state);
    this.updateQueue.set(itineraryId, []);

    try {
      // Persist using advanced persistence manager
      await this.persistItinerary(itineraryId, state);

      console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} created from generator output successfully`);
      return state;
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Failed to create itinerary from generator output:`, error);
      state.errorLog.push(`Creation from generator failed: ${error instanceof Error ? error.message : String(error)}`);
      state.syncStatus = 'error';
      return state;
    }
  }

  // Migration method to upgrade existing itineraries to new persistence
  async migrateItineraryToAdvancedPersistence(itineraryId: string): Promise<boolean> {
    console.log(`[ItineraryManagementEngine] Migrating itinerary ${itineraryId} to advanced persistence`);

    try {
      // Load from old storage
      const existingState = this.loadFromLocalStorage(itineraryId);
      if (!existingState) {
        console.warn(`[ItineraryManagementEngine] No existing itinerary found for migration: ${itineraryId}`);
        return false;
      }

      // Save using new persistence manager
      await this.persistItinerary(itineraryId, existingState);

      console.log(`[ItineraryManagementEngine] Successfully migrated itinerary ${itineraryId}`);
      return true;
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Migration failed for ${itineraryId}:`, error);
      return false;
    }
  }

  // Batch migration for all existing itineraries
  async migrateAllItinerariesToAdvancedPersistence(): Promise<{ migrated: number; failed: number }> {
    console.log('[ItineraryManagementEngine] Starting batch migration to advanced persistence');

    let migrated = 0;
    let failed = 0;

    // Get all itinerary keys from localStorage
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('itinerary_')) {
          keys.push(key.replace('itinerary_', ''));
        }
      }
    } catch (error) {
      console.error('[ItineraryManagementEngine] Failed to enumerate localStorage keys:', error);
      return { migrated: 0, failed: keys.length };
    }

    for (const itineraryId of keys) {
      const success = await this.migrateItineraryToAdvancedPersistence(itineraryId);
      if (success) {
        migrated++;
      } else {
        failed++;
      }
    }

    console.log(`[ItineraryManagementEngine] Migration complete: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
  }

  // Legacy createItinerary method (keeping for backward compatibility)
  async createItineraryLegacy(input: SmartItineraryInput): Promise<ItineraryState> {
    console.log(`[ItineraryManagementEngine] Creating new itinerary for user ${input.userId}`);

    const itineraryId = this.generateItineraryId(input.userId);
    const state: ItineraryState = {
      id: itineraryId,
      userId: input.userId,
      version: 1,
      lastModified: Date.now(),
      itinerary: null,
      input,
      syncStatus: 'pending',
      validationStatus: 'pending',
      errorLog: []
    };

    this.itineraryStates.set(itineraryId, state);
    this.updateQueue.set(itineraryId, []);

    try {
      // Generate initial itinerary
      const result = await this.generateItinerary(input);
      state.itinerary = result;
      state.validationStatus = 'valid';
      state.syncStatus = 'synced';

      // Persist using advanced persistence manager
      await this.persistItinerary(itineraryId, state);

      console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} created successfully`);
      return state;
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Failed to create itinerary:`, error);
      state.errorLog.push(`Creation failed: ${error instanceof Error ? error.message : String(error)}`);
      state.syncStatus = 'error';
      return state;
    }
  }

  async updateItinerary(itineraryId: string, update: ItineraryUpdate): Promise<ItineraryState | null> {
    console.log(`[ItineraryManagementEngine] Processing update for itinerary ${itineraryId}:`, update.type);
    let state = this.itineraryStates.get(itineraryId);

    if (!state) {
      console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} not found in memory. Checking localStorage...`);

      // Try to load from localStorage
      const loadedState = this.loadFromLocalStorage(itineraryId);
      if (loadedState) {
        console.log(`[ItineraryManagementEngine] Found itinerary ${itineraryId} in localStorage, loading into memory`);
        this.itineraryStates.set(itineraryId, loadedState);
        state = loadedState;
      } else {
        // Itinerary not found anywhere - check if this is a full itinerary replacement that should create a new state
        if (update.type === 'destination_update' && update.data && typeof update.data === 'object' && update.data.itinerary) {
          console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} not found, but received full itinerary data. Creating new state from update data.`);
          try {
            // Extract data from the update to create a new itinerary state
            const itineraryData = update.data;
            const newState: ItineraryState = {
              id: itineraryId,
              userId: itineraryData.userId || 'unknown',
              version: itineraryData.version || 1,
              lastModified: update.timestamp,
              itinerary: itineraryData.itinerary,
              input: itineraryData.input,
              syncStatus: 'pending',
              validationStatus: 'pending',
              errorLog: []
            };

            this.itineraryStates.set(itineraryId, newState);
            this.updateQueue.set(itineraryId, []);
            state = newState;

            console.log(`[ItineraryManagementEngine] Created new itinerary state ${itineraryId} from update data`);
          } catch (error) {
            console.error(`[ItineraryManagementEngine] Failed to create itinerary state from update data:`, error);
            return null;
          }
        } else {
          console.warn(`[ItineraryManagementEngine] Itinerary ${itineraryId} not found and cannot create from update data. Engine stats:`, this.getStats());
          return null;
        }
      }
    }

    // Add to update queue for tracking
    const queue = this.updateQueue.get(itineraryId) || [];
    queue.push(update);
    this.updateQueue.set(itineraryId, queue);

    try {
      // Determine update strategy based on configuration and update type
      let updateSuccessful = false;

      if (this.config.enableIncrementalUpdates && this.isIncrementalUpdate(update)) {
        console.log(`[ItineraryManagementEngine] Applying incremental update for ${itineraryId}`);
        await this.processIncrementalUpdate(state, update);
        updateSuccessful = true;
      } else {
        console.log(`[ItineraryManagementEngine] Regenerating full itinerary for ${itineraryId}`);
        await this.regenerateFullItinerary(state);
        updateSuccessful = true;
      }

      if (updateSuccessful) {
        state.version++;
        state.lastModified = Date.now();
        state.syncStatus = 'pending';

        // Validate updated itinerary with enhanced error handling
        if (this.config.enableValidation) {
          try {
            await this.validateItinerary(state);
          } catch (validationError) {
            console.warn(`[ItineraryManagementEngine] Validation failed but continuing with update:`, validationError);
            state.errorLog.push(`Validation warning: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
            // Don't fail the entire update due to validation issues
          }
        }

        // Persist changes with retry mechanism
        try {
          await this.persistItinerary(itineraryId, state);
          console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} updated and persisted successfully`);
        } catch (persistError) {
          console.error(`[ItineraryManagementEngine] Failed to persist ${itineraryId}, but update completed:`, persistError);
          state.errorLog.push(`Persistence warning: ${persistError instanceof Error ? persistError.message : String(persistError)}`);
          // Update is still successful even if persistence fails temporarily
        }

        return state;
      } else {
        throw new Error('Update processing failed');
      }
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Update failed for itinerary ${itineraryId}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      state.errorLog.push(`Update failed: ${errorMessage}`);

      // Enhanced error recovery
      try {
        await this.recoverFromUpdateError(state, update, error);
      } catch (recoveryError) {
        console.error(`[ItineraryManagementEngine] Error recovery failed for ${itineraryId}:`, recoveryError);
        state.errorLog.push(`Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
      }

      state.syncStatus = 'error';
      return state;
    }
  }

  async getItinerary(itineraryId: string): Promise<ItineraryState | null> {
    let state = this.itineraryStates.get(itineraryId);

    // Try to load from localStorage if not in memory
    if (!state) {
      const loadedState = this.loadFromLocalStorage(itineraryId);
      if (loadedState) {
        state = loadedState;
        this.itineraryStates.set(itineraryId, state);
      }
    }

    if (!state) {
      console.warn(`[ItineraryManagementEngine] Itinerary ${itineraryId} not found`);
      return null;
    }

    // Check if cache is expired
    if (Date.now() - state.lastModified > this.config.cacheTimeout) {
      console.log(`[ItineraryManagementEngine] Cache expired for itinerary ${itineraryId}, refreshing`);
      await this.refreshItinerary(state);
    }

    return state;
  }

  // Incremental update processing
  private async processIncrementalUpdate(state: ItineraryState, update: ItineraryUpdate): Promise<void> {
    if (!state.input || !state.itinerary) {
      throw new Error('Invalid itinerary state for incremental update');
    }

    const updatedInput = { ...state.input };
    let needsRegeneration = false;

    switch (update.type) {
      case 'destination_add':
        updatedInput.availableDestinations.push(update.data);
        needsRegeneration = true;
        break;

      case 'destination_remove':
        updatedInput.availableDestinations = updatedInput.availableDestinations.filter(
          dest => dest.id !== update.data.id
        );
        needsRegeneration = true;
        break;

      case 'destination_update':
        const destIndex = updatedInput.availableDestinations.findIndex(
          dest => dest.id === update.data.id
        );
        if (destIndex >= 0) {
          updatedInput.availableDestinations[destIndex] = {
            ...updatedInput.availableDestinations[destIndex],
            ...update.data
          };
          needsRegeneration = true;
        }
        break;

      case 'budget_change':
        updatedInput.preferences.budget = update.data.budget;
        // Can optimize incrementally without full regeneration
        await this.optimizeBudgetOnly(state);
        break;

      case 'date_change':
        updatedInput.preferences.startDate = update.data.startDate;
        updatedInput.preferences.days = update.data.days;
        needsRegeneration = true;
        break;

      case 'preference_update':
        updatedInput.preferences = { ...updatedInput.preferences, ...update.data };
        needsRegeneration = true;
        break;
    }

    if (needsRegeneration) {
      state.input = updatedInput;
      const result = await this.generateItinerary(updatedInput);
      state.itinerary = result;
    }
  }

  // Full itinerary regeneration
  private async regenerateFullItinerary(state: ItineraryState): Promise<void> {
    if (!state.input) {
      throw new Error('No input data available for regeneration');
    }

    console.log(`[ItineraryManagementEngine] Regenerating full itinerary for ${state.id}`);
    const result = await this.generateItinerary(state.input);
    state.itinerary = result;
  }

  // Budget-only optimization
  private async optimizeBudgetOnly(state: ItineraryState): Promise<void> {
    if (!state.itinerary || !state.input) return;

    console.log(`[ItineraryManagementEngine] Optimizing budget only for ${state.id}`);

    // Update the budget in the input before recalculating
    // The budget was already updated in processIncrementalUpdate, so just recalculate
    const engine = new SmartItineraryEngine();
    const result = engine.createSmartItinerary(state.input);
    state.itinerary.budgetBreakdown = result.budgetBreakdown;
    state.itinerary.optimization = result.optimization;

    // Ensure the total budget is correctly set
    state.itinerary.totalCost = result.totalCost;
  }

  // Enhanced validation pipeline with auto-regeneration
  private async validateItinerary(state: ItineraryState): Promise<void> {
    if (!state.itinerary) {
      console.log(`[ItineraryManagementEngine] No itinerary to validate for ${state.id}, regenerating`);
      await this.autoRegenerateItinerary(state);
      return;
    }

    try {
      const validationResult = await this.validationEngine.validateItinerary(state.itinerary, state.input);

      if (validationResult.isValid) {
        state.validationStatus = 'valid';
        console.log(`[ItineraryManagementEngine] Itinerary ${state.id} validation passed`);
      } else {
        console.warn(`[ItineraryManagementEngine] Itinerary ${state.id} validation failed:`, validationResult.errors);
        state.errorLog.push(...validationResult.errors);

        // Check if auto-regeneration is warranted
        const shouldAutoRegenerate = this.shouldAutoRegenerate(validationResult.errors);

        if (shouldAutoRegenerate) {
          console.log(`[ItineraryManagementEngine] Auto-regenerating invalid itinerary ${state.id}`);
          await this.autoRegenerateItinerary(state);
        } else {
          state.validationStatus = 'invalid';
        }
      }
    } catch (error) {
      state.validationStatus = 'invalid';
      state.errorLog.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[ItineraryManagementEngine] Validation error for ${state.id}:`, error);

      // Attempt auto-regeneration on validation errors
      console.log(`[ItineraryManagementEngine] Attempting auto-regeneration due to validation error for ${state.id}`);
      await this.autoRegenerateItinerary(state);
    }
  }

  // Determine if auto-regeneration should be attempted
  private shouldAutoRegenerate(errors: string[]): boolean {
    // Auto-regenerate for critical issues that can be fixed
    const criticalErrors = [
      'empty itinerary',
      'missing destinations',
      'invalid destination data',
      'inconsistent day structure',
      'missing required fields'
    ];

    return errors.some(error =>
      criticalErrors.some(critical => error.toLowerCase().includes(critical))
    );
  }

  // Determine if an update can be processed incrementally
  private isIncrementalUpdate(update: ItineraryUpdate): boolean {
    const incrementalTypes = ['destination_add', 'destination_remove', 'destination_update', 'budget_change', 'date_change', 'preference_update'];
    return incrementalTypes.includes(update.type);
  }

  // Enhanced error recovery for update operations with PersistenceManager fallbacks
  private async recoverFromUpdateError(state: ItineraryState, update: ItineraryUpdate, originalError: any): Promise<void> {
    console.log(`[ItineraryManagementEngine] Attempting error recovery for itinerary ${state.id}`);

    const recentErrors = state.errorLog.slice(-3);
    let recoverySuccessful = false;

    // Special handling for "Failed to persist itinerary data" error
    if (originalError instanceof Error && originalError.message === 'Failed to persist itinerary data') {
      console.log(`[ItineraryManagementEngine] Detected persistence error, attempting PersistenceManager recovery`);

      // Try PersistenceManager fallback mechanisms
      for (let attempt = 1; attempt <= Math.min(this.config.persistence.maxRetries, 3); attempt++) {
        try {
          console.log(`[ItineraryManagementEngine] Persistence recovery attempt ${attempt}`);
          await this.persistItinerary(state.id, state);
          recoverySuccessful = true;
          state.errorLog.push(`Persistence recovered using advanced manager at ${new Date().toISOString()}`);
          break;
        } catch (persistError) {
          console.warn(`[ItineraryManagementEngine] Persistence recovery attempt ${attempt} failed:`, persistError);
        }
      }

      if (recoverySuccessful) {
        state.lastModified = Date.now();
        console.log(`[ItineraryManagementEngine] Successfully recovered persistence for ${state.id}`);
        return;
      }
    }

    // Try different recovery strategies based on error type
    for (let attempt = 1; attempt <= Math.min(this.config.maxRetryAttempts, 2); attempt++) {
      try {
        if (recentErrors.some(error => error.includes('validation'))) {
          // Try to fix validation issues by regenerating
          if (state.input) {
            console.log(`[ItineraryManagementEngine] Recovery attempt ${attempt}: Regenerating itinerary`);
            const result = await this.generateItinerary(state.input);
            state.itinerary = result;
            state.validationStatus = 'valid';
            recoverySuccessful = true;
            break;
          }
        } else if (recentErrors.some(error => error.includes('sync'))) {
          // Try to reset sync status
          console.log(`[ItineraryManagementEngine] Recovery attempt ${attempt}: Resetting sync status`);
          state.syncStatus = 'pending';
          recoverySuccessful = true;
          break;
        } else {
          // General recovery - try to refresh the itinerary
          console.log(`[ItineraryManagementEngine] Recovery attempt ${attempt}: Refreshing itinerary`);
          await this.refreshItinerary(state);
          recoverySuccessful = true;
          break;
        }
      } catch (recoveryError) {
        console.warn(`[ItineraryManagementEngine] Recovery attempt ${attempt} failed:`, recoveryError);
      }
    }

    if (recoverySuccessful) {
      state.lastModified = Date.now();
      state.errorLog.push(`Recovered from error at ${new Date().toISOString()}`);
      await this.persistItinerary(state.id, state);
      console.log(`[ItineraryManagementEngine] Successfully recovered itinerary ${state.id}`);
    } else {
      console.error(`[ItineraryManagementEngine] All recovery attempts failed for ${state.id}`);
      state.errorLog.push(`Recovery failed: ${originalError instanceof Error ? originalError.message : String(originalError)}`);
    }
  }

  // Auto-regenerate invalid itinerary
  private async autoRegenerateItinerary(state: ItineraryState): Promise<void> {
    if (!state.input) {
      console.error(`[ItineraryManagementEngine] Cannot auto-regenerate ${state.id}: no input data`);
      state.validationStatus = 'invalid';
      return;
    }

    try {
      console.log(`[ItineraryManagementEngine] Auto-regenerating itinerary ${state.id}`);

      // Create new itinerary with the same input
      const result = await this.generateItinerary(state.input);
      state.itinerary = result;
      state.version++;
      state.lastModified = Date.now();
      state.validationStatus = 'valid';
      state.errorLog.push(`Auto-regenerated at ${new Date().toISOString()}`);

      // Persist the regenerated itinerary
      await this.persistItinerary(state.id, state);

      console.log(`[ItineraryManagementEngine] Successfully auto-regenerated itinerary ${state.id}`);
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Auto-regeneration failed for ${state.id}:`, error);
      state.validationStatus = 'invalid';
      state.errorLog.push(`Auto-regeneration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Sync management
  private async syncItinerary(state: ItineraryState): Promise<void> {
    try {
      const syncResult = await this.syncManager.syncItinerary(state);

      if (syncResult.success) {
        state.syncStatus = 'synced';
        console.log(`[ItineraryManagementEngine] Itinerary ${state.id} synced successfully`);
      } else {
        state.syncStatus = syncResult.hasConflict ? 'conflict' : 'error';
        if (syncResult.conflictResolution) {
          await this.resolveSyncConflict(state, syncResult.conflictResolution);
        }
        console.warn(`[ItineraryManagementEngine] Sync failed for ${state.id}:`, syncResult.error);
      }
    } catch (error) {
      state.syncStatus = 'error';
      state.errorLog.push(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[ItineraryManagementEngine] Sync error for ${state.id}:`, error);
    }
  }

  private async resolveSyncConflict(state: ItineraryState, resolution: any): Promise<void> {
    // Implement conflict resolution logic
    console.log(`[ItineraryManagementEngine] Resolving sync conflict for ${state.id}`);

    // For now, prefer server version
    if (resolution.serverVersion) {
      state.itinerary = resolution.serverVersion.itinerary;
      state.version = resolution.serverVersion.version;
      state.syncStatus = 'synced';
    }
  }

  // Error recovery
  private async recoverFromError(state: ItineraryState): Promise<void> {
    console.log(`[ItineraryManagementEngine] Attempting error recovery for ${state.id}`);

    const recentErrors = state.errorLog.slice(-5);
    let recoverySuccessful = false;

    // Try different recovery strategies
    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      try {
        if (recentErrors.some(error => error.includes('validation'))) {
          await this.validateItinerary(state);
        } else if (recentErrors.some(error => error.includes('sync'))) {
          await this.syncItinerary(state);
        } else {
          // General recovery - regenerate itinerary
          await this.regenerateFullItinerary(state);
        }

        if (state.validationStatus === 'valid' && state.syncStatus !== 'error') {
          recoverySuccessful = true;
          break;
        }
      } catch (error) {
        console.warn(`[ItineraryManagementEngine] Recovery attempt ${attempt} failed:`, error);
      }
    }

    if (!recoverySuccessful) {
      console.error(`[ItineraryManagementEngine] All recovery attempts failed for ${state.id}`);
      // Could implement fallback to cached version or notify user
    }
  }

  // Enhanced data persistence using PersistenceManager with robust fallbacks
  private async persistItinerary(itineraryId: string, state: ItineraryState): Promise<void> {
    let persistenceAttempted = false;
    let persistenceSuccessful = false;

    try {
      // Convert ItineraryState to GeneratorOutput format for PersistenceManager
      const generatorOutput: GeneratorOutput = {
        success: true,
        itineraryId,
        itinerary: {
          summary: {
            totalDays: 1, // Simplified for management engine
            totalCost: state.itinerary?.totalCost || 0,
            totalDuration: state.itinerary?.totalDuration || 0,
            confidence: 0.8,
            generatedAt: state.lastModified
          },
          days: [], // Simplified - management engine doesn't use detailed day structure
          budgetBreakdown: state.itinerary?.budgetBreakdown || {
            totalBudget: 0,
            categoryBreakdown: {
              accommodation: { allocated: 0, recommended: 0, savings: 0 },
              transportation: { allocated: 0, recommended: 0, savings: 0 },
              food: { allocated: 0, recommended: 0, savings: 0 },
              activities: { allocated: 0, recommended: 0, savings: 0 },
              miscellaneous: { allocated: 0, recommended: 0, savings: 0 }
            },
            optimizations: [],
            confidence: 0.5,
            reasoning: ['Converted from management engine state']
          },
          mlInsights: state.itinerary?.mlInsights || {
            personalizationScore: 0.5,
            predictedUserSatisfaction: 0.7,
            riskFactors: [],
            recommendations: []
          },
          optimization: state.itinerary?.optimization || {
            timeOptimization: 0,
            costOptimization: 0,
            satisfactionOptimization: 0,
            reasoning: ['Converted from management engine state']
          },
          costVariability: state.itinerary?.costVariability || {
            seasonalAdjustments: [],
            demandFactors: [],
            currencyRates: [],
            appliedDiscounts: [],
            realTimeUpdates: []
          }
        },
        metadata: {
          generationTime: 0,
          configUsed: {
            dayStructure: {
              preferredStartTime: '08:00',
              preferredEndTime: '18:00',
              maxDailyActivities: 4,
              activityBufferTime: 30,
              includeBreaks: true,
              breakDuration: 30
            },
            costDistribution: {
              budgetAllocationStrategy: 'equal',
              costVariabilityTolerance: 0.2,
              emergencyFundPercentage: 10,
              currency: 'IDR'
            },
            activityDensity: {
              densityLevel: 'moderate',
              maxActivitiesPerDay: 4,
              preferredActivityTypes: [],
              avoidOverScheduling: true,
              includeFreeTime: true,
              freeTimePercentage: 30
            },
            transportation: {
              preferredModes: ['walking', 'public', 'taxi'],
              maxWalkingDistance: 2,
              budgetPriority: true,
              ecoFriendly: false,
              accessibilityRequired: false
            },
            meals: {
              includeMeals: true,
              mealBudget: 150000,
              preferredCuisine: [],
              dietaryRestrictions: [],
              mealTiming: {
                breakfast: '07:00-09:00',
                lunch: '12:00-14:00',
                dinner: '18:00-20:00'
              }
            },
            performance: {
              enableCaching: true,
              cacheTimeout: 3600000,
              maxConcurrentGenerations: 5,
              timeoutMs: 30000,
              enableBackgroundProcessing: false
            },
            persistence: this.config.persistence
          },
          engineVersions: {
            itinerary: '1.0.0',
            budget: '1.0.0',
            ml: '1.0.0'
          },
          performanceMetrics: {
            cacheHits: 0,
            apiCalls: 0,
            processingTime: 0
          }
        }
      };

      // Attempt persistence with retry mechanism
      persistenceAttempted = true;
      for (let attempt = 1; attempt <= Math.min(this.config.persistence.maxRetries, 3); attempt++) {
        try {
          await this.persistenceManager.save(itineraryId, generatorOutput);
          persistenceSuccessful = true;
          console.log(`[ItineraryManagementEngine] Persisted itinerary ${itineraryId} using advanced persistence (attempt ${attempt})`);
          break;
        } catch (persistError) {
          console.warn(`[ItineraryManagementEngine] Persistence attempt ${attempt} failed for ${itineraryId}:`, persistError);

          if (attempt === Math.min(this.config.persistence.maxRetries, 3)) {
            throw persistError;
          }

          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));

          // Try switching storage strategy on retry
          if (attempt === 2 && this.config.persistence.primaryStorage === 'hybrid') {
            console.log(`[ItineraryManagementEngine] Switching to fallback storage strategy for ${itineraryId}`);
            // The PersistenceManager will handle fallback internally
          }
        }
      }

    } catch (error) {
      console.error(`[ItineraryManagementEngine] All persistence attempts failed for ${itineraryId}:`, error);

      // Enhanced fallback mechanism
      try {
        await this.persistWithFallbackStrategy(itineraryId, state);
        persistenceSuccessful = true;
        state.errorLog.push(`Persistence recovered using fallback at ${new Date().toISOString()}`);
      } catch (fallbackError) {
        console.error(`[ItineraryManagementEngine] Fallback persistence also failed for ${itineraryId}:`, fallbackError);
        state.errorLog.push(`Critical persistence failure: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);

        // Final emergency fallback - try to save minimal state
        try {
          await this.persistMinimalState(itineraryId, state);
          persistenceSuccessful = true;
          state.errorLog.push(`Emergency persistence succeeded at ${new Date().toISOString()}`);
        } catch (emergencyError) {
          console.error(`[ItineraryManagementEngine] Emergency persistence failed for ${itineraryId}:`, emergencyError);
          throw new Error('Failed to persist itinerary data');
        }
      }
    }

    if (persistenceAttempted && !persistenceSuccessful) {
      throw new Error('Failed to persist itinerary data');
    }
  }

  // Enhanced fallback persistence strategy
  private async persistWithFallbackStrategy(itineraryId: string, state: ItineraryState): Promise<void> {
    console.log(`[ItineraryManagementEngine] Attempting fallback persistence for ${itineraryId}`);

    const fallbackStrategies = [
      // Strategy 1: Try alternative storage configuration
      async () => {
        const tempConfig = { ...this.config.persistence, primaryStorage: 'localStorage' as const };
        const tempManager = new PersistenceManager(tempConfig);
        const generatorOutput = this.convertStateToGeneratorOutput(state, itineraryId);
        await tempManager.save(itineraryId, generatorOutput);
      },

      // Strategy 2: Direct localStorage with compression
      async () => {
        const compressed = this.compressItineraryState(state);
        localStorage.setItem(`itinerary_fallback_${itineraryId}`, compressed);
      },

      // Strategy 3: Session storage as last resort
      async () => {
        const data = JSON.stringify({
          ...state,
          fallback: true,
          savedAt: Date.now()
        });
        sessionStorage.setItem(`itinerary_emergency_${itineraryId}`, data);
      }
    ];

    for (const strategy of fallbackStrategies) {
      try {
        await strategy();
        console.log(`[ItineraryManagementEngine] Fallback persistence succeeded for ${itineraryId}`);
        return;
      } catch (error) {
        console.warn(`[ItineraryManagementEngine] Fallback strategy failed:`, error);
      }
    }

    throw new Error('All fallback persistence strategies failed');
  }

  // Emergency minimal state persistence
  private async persistMinimalState(itineraryId: string, state: ItineraryState): Promise<void> {
    const minimalState = {
      id: state.id,
      userId: state.userId,
      version: state.version,
      lastModified: state.lastModified,
      syncStatus: state.syncStatus,
      validationStatus: state.validationStatus,
      errorLog: state.errorLog.slice(-5), // Keep only last 5 errors
      emergency: true,
      savedAt: Date.now()
    };

    try {
      localStorage.setItem(`itinerary_minimal_${itineraryId}`, JSON.stringify(minimalState));
      console.log(`[ItineraryManagementEngine] Minimal state persisted for ${itineraryId}`);
    } catch (error) {
      // Try sessionStorage as absolute last resort
      try {
        sessionStorage.setItem(`itinerary_minimal_${itineraryId}`, JSON.stringify(minimalState));
        console.log(`[ItineraryManagementEngine] Minimal state persisted to sessionStorage for ${itineraryId}`);
      } catch (sessionError) {
        throw new Error('Cannot persist even minimal state');
      }
    }
  }

  // Utility method to convert state to generator output
  private convertStateToGeneratorOutput(state: ItineraryState, itineraryId: string): GeneratorOutput {
    return {
      success: true,
      itineraryId,
      itinerary: {
        summary: {
          totalDays: 1,
          totalCost: state.itinerary?.totalCost || 0,
          totalDuration: state.itinerary?.totalDuration || 0,
          confidence: 0.8,
          generatedAt: state.lastModified
        },
        days: [],
        budgetBreakdown: state.itinerary?.budgetBreakdown || {
          totalBudget: 0,
          categoryBreakdown: {
            accommodation: { allocated: 0, recommended: 0, savings: 0 },
            transportation: { allocated: 0, recommended: 0, savings: 0 },
            food: { allocated: 0, recommended: 0, savings: 0 },
            activities: { allocated: 0, recommended: 0, savings: 0 },
            miscellaneous: { allocated: 0, recommended: 0, savings: 0 }
          },
          optimizations: [],
          confidence: 0.5,
          reasoning: ['Converted from management engine state']
        },
        mlInsights: state.itinerary?.mlInsights || {
          personalizationScore: 0.5,
          predictedUserSatisfaction: 0.7,
          riskFactors: [],
          recommendations: []
        },
        optimization: state.itinerary?.optimization || {
          timeOptimization: 0,
          costOptimization: 0,
          satisfactionOptimization: 0,
          reasoning: ['Converted from management engine state']
        },
        costVariability: state.itinerary?.costVariability || {
          seasonalAdjustments: [],
          demandFactors: [],
          currencyRates: [],
          appliedDiscounts: [],
          realTimeUpdates: []
        }
      },
      metadata: {
        generationTime: 0,
        configUsed: {
          dayStructure: {
            preferredStartTime: '08:00',
            preferredEndTime: '18:00',
            maxDailyActivities: 4,
            activityBufferTime: 30,
            includeBreaks: true,
            breakDuration: 30
          },
          costDistribution: {
            budgetAllocationStrategy: 'equal',
            costVariabilityTolerance: 0.2,
            emergencyFundPercentage: 10,
            currency: 'IDR'
          },
          activityDensity: {
            densityLevel: 'moderate',
            maxActivitiesPerDay: 4,
            preferredActivityTypes: [],
            avoidOverScheduling: true,
            includeFreeTime: true,
            freeTimePercentage: 30
          },
          transportation: {
            preferredModes: ['walking', 'public', 'taxi'],
            maxWalkingDistance: 2,
            budgetPriority: true,
            ecoFriendly: false,
            accessibilityRequired: false
          },
          meals: {
            includeMeals: true,
            mealBudget: 150000,
            preferredCuisine: [],
            dietaryRestrictions: [],
            mealTiming: {
              breakfast: '07:00-09:00',
              lunch: '12:00-14:00',
              dinner: '18:00-20:00'
            }
          },
          performance: {
            enableCaching: true,
            cacheTimeout: 3600000,
            maxConcurrentGenerations: 5,
            timeoutMs: 30000,
            enableBackgroundProcessing: false
          },
          persistence: this.config.persistence
        },
        engineVersions: {
          itinerary: '1.0.0',
          budget: '1.0.0',
          ml: '1.0.0'
        },
        performanceMetrics: {
          cacheHits: 0,
          apiCalls: 0,
          processingTime: 0
        }
      }
    };
  }

  // Compress itinerary state for fallback storage
  private compressItineraryState(state: ItineraryState): string {
    // Remove non-essential data and compress
    const compressed = {
      id: state.id,
      userId: state.userId,
      version: state.version,
      lastModified: state.lastModified,
      syncStatus: state.syncStatus,
      validationStatus: state.validationStatus,
      itinerary: state.itinerary ? {
        totalCost: state.itinerary.totalCost,
        totalDuration: state.itinerary.totalDuration,
        budgetBreakdown: state.itinerary.budgetBreakdown
      } : null,
      input: state.input,
      compressed: true,
      savedAt: Date.now()
    };

    return JSON.stringify(compressed);
  }

  // Backward compatibility fallback
  private persistToLocalStorage(itineraryId: string, state: ItineraryState): void {
    try {
      const serialized = JSON.stringify({
        ...state,
        lastModified: Date.now()
      });
      localStorage.setItem(`itinerary_${itineraryId}`, serialized);
    } catch (error) {
      console.warn(`[ItineraryManagementEngine] Failed to persist itinerary ${itineraryId}:`, error);
    }
  }

  // Fallback persistence method
  private persistToLocalStorageFallback(itineraryId: string, state: ItineraryState): void {
    this.persistToLocalStorage(itineraryId, state);
  }

  private async loadItinerary(itineraryId: string): Promise<ItineraryState | null> {
    // For now, use the existing localStorage method
    // Advanced persistence integration will be implemented in future updates
    return this.loadFromLocalStorage(itineraryId);
  }

  private loadFromLocalStorage(itineraryId: string): ItineraryState | null {
    try {
      const data = localStorage.getItem(`itinerary_${itineraryId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`[ItineraryManagementEngine] Failed to load itinerary ${itineraryId}:`, error);
    }
    return null;
  }

  // Utility methods
  private async generateItinerary(input: SmartItineraryInput): Promise<SmartItineraryResult> {
    const engine = new SmartItineraryEngine();
    return engine.createSmartItinerary(input);
  }

  private generateItineraryId(userId: string): string {
    return `itinerary_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshItinerary(state: ItineraryState): Promise<void> {
    if (!state.input) return;

    try {
      const result = await this.generateItinerary(state.input);
      state.itinerary = result;
      state.lastModified = Date.now();
      await this.persistItinerary(state.id, state);
    } catch (error) {
      console.error(`[ItineraryManagementEngine] Failed to refresh itinerary ${state.id}:`, error);
    }
  }

  // Event handling and auto-sync
  private initializeEventListeners(): void {
    // Only add event listeners in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Listen for storage events (cross-tab sync)
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('itinerary_')) {
        const itineraryId = event.key.replace('itinerary_', '');
        console.log(`[ItineraryManagementEngine] Storage event detected for ${itineraryId}`);
        // Handle cross-tab updates
        this.handleCrossTabUpdate(itineraryId);
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[ItineraryManagementEngine] Connection restored, syncing pending itineraries');
      this.syncAllPendingItineraries();
    });
  }

  private startAutoSync(): void {
    if (!this.config.enableAutoSync) return;

    setInterval(() => {
      this.syncAllPendingItineraries();
    }, this.config.syncInterval);
  }

  private async syncAllPendingItineraries(): Promise<void> {
    const pendingStates = Array.from(this.itineraryStates.values())
      .filter(state => state.syncStatus === 'pending');

    for (const state of pendingStates) {
      await this.syncItinerary(state);
    }
  }

  private async handleCrossTabUpdate(itineraryId: string): Promise<void> {
    const state = this.itineraryStates.get(itineraryId);
    if (state) {
      // Reload from localStorage to get latest version
      const updatedState = this.loadFromLocalStorage(itineraryId);
      if (updatedState && updatedState.version > state.version) {
        this.itineraryStates.set(itineraryId, updatedState);
        console.log(`[ItineraryManagementEngine] Updated itinerary ${itineraryId} from cross-tab sync`);
      }
    }
  }

  // Testing and monitoring
  async runTests(): Promise<any> {
    console.log('[ItineraryManagementEngine] Running comprehensive tests');
    return await this.testingFramework.runAllTests(this);
  }

  // Public access to testing framework for API endpoints
  get testingFrameworkInstance() {
    return this.testingFramework;
  }

  getStats(): any {
    return {
      totalItineraries: this.itineraryStates.size,
      pendingSync: Array.from(this.itineraryStates.values()).filter(s => s.syncStatus === 'pending').length,
      invalidItineraries: Array.from(this.itineraryStates.values()).filter(s => s.validationStatus === 'invalid').length,
      errorCount: Array.from(this.itineraryStates.values()).reduce((sum, s) => sum + s.errorLog.length, 0),
      persistenceConfig: this.config.persistence
    };
  }

  // Get persistence health status with enhanced monitoring
  async getPersistenceHealth(): Promise<{
    primaryStorage: 'healthy' | 'degraded' | 'failed';
    backupStorage: 'healthy' | 'degraded' | 'failed';
    indexedDBAvailable: boolean;
    localStorageAvailable: boolean;
    sessionStorageAvailable: boolean;
    lastSync: number;
    retryCount: number;
    totalItineraries: number;
    persistenceConfig: any;
  }> {
    try {
      // Use the enhanced PersistenceManager health check
      const persistenceHealth = await (this.persistenceManager as any).getHealthStatus();

      return {
        primaryStorage: persistenceHealth.primaryStorage,
        backupStorage: persistenceHealth.backupStorage,
        indexedDBAvailable: persistenceHealth.indexedDBAvailable,
        localStorageAvailable: persistenceHealth.localStorageAvailable,
        sessionStorageAvailable: persistenceHealth.sessionStorageAvailable,
        lastSync: Date.now(),
        retryCount: this.config.persistence.maxRetries,
        totalItineraries: this.itineraryStates.size,
        persistenceConfig: this.config.persistence
      };
    } catch (error) {
      console.error('[ItineraryManagementEngine] Enhanced health check failed, falling back to basic check:', error);

      // Fallback to basic health check
      let primaryStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';
      let backupStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';

      // Test primary storage
      try {
        const testId = `health_check_${Date.now()}`;
        const testData = { test: true, timestamp: Date.now() };
        await this.persistenceManager.save(testId, testData as any);
        await this.persistenceManager.load(testId);
        await this.persistenceManager.delete(testId);
      } catch (error) {
        primaryStatus = 'failed';
        console.warn('[ItineraryManagementEngine] Primary storage health check failed:', error);
      }

      // Test backup storage (simplified check)
      try {
        const backupTest = sessionStorage.getItem('backup_health_test');
        if (!backupTest) {
          sessionStorage.setItem('backup_health_test', Date.now().toString());
        }
      } catch (error) {
        backupStatus = 'failed';
        console.warn('[ItineraryManagementEngine] Backup storage health check failed:', error);
      }

      return {
        primaryStorage: primaryStatus,
        backupStorage: backupStatus,
        indexedDBAvailable: false, // Unknown in fallback mode
        localStorageAvailable: primaryStatus !== 'failed',
        sessionStorageAvailable: backupStatus !== 'failed',
        lastSync: Date.now(),
        retryCount: this.config.persistence.maxRetries,
        totalItineraries: this.itineraryStates.size,
        persistenceConfig: this.config.persistence
      };
    }
  }

  // Public method for manual itinerary validation
  async validateItineraryManually(itineraryId: string): Promise<{ isValid: boolean; errors: string[]; regenerated: boolean }> {
    const state = this.itineraryStates.get(itineraryId);
    if (!state) {
      return { isValid: false, errors: ['Itinerary not found'], regenerated: false };
    }

    const previousStatus = state.validationStatus;
    await this.validateItinerary(state);

    const regenerated = previousStatus === 'invalid' && state.validationStatus === 'valid';

    return {
      isValid: state.validationStatus === 'valid',
      errors: state.errorLog.slice(-10), // Return last 10 errors
      regenerated
    };
  }

  // Enhanced data recovery with PersistenceManager backup support
  async recoverItineraryWithBackup(itineraryId: string): Promise<ItineraryState | null> {
    console.log(`[ItineraryManagementEngine] Attempting enhanced recovery for itinerary ${itineraryId}`);

    // First try PersistenceManager recovery
    try {
      const generatorOutput = await this.persistenceManager.load(itineraryId);
      if (generatorOutput) {
        console.log(`[ItineraryManagementEngine] Recovered ${itineraryId} from PersistenceManager`);
        return await this.createItineraryFromGenerator(generatorOutput);
      }
    } catch (error) {
      console.warn(`[ItineraryManagementEngine] PersistenceManager recovery failed:`, error);
    }

    // Fallback to existing recovery method
    return this.recoverItinerary(itineraryId);
  }

  // Enhanced data recovery method for missing itineraries
  async recoverItinerary(itineraryId: string): Promise<ItineraryState | null> {
    console.log(`[ItineraryManagementEngine] Attempting to recover itinerary ${itineraryId}`);

    // Check if already in memory
    let state = this.itineraryStates.get(itineraryId);
    if (state) {
      console.log(`[ItineraryManagementEngine] Itinerary ${itineraryId} already in memory`);
      return state;
    }

    // Try localStorage recovery
    const loadedState = this.loadFromLocalStorage(itineraryId);
    if (loadedState) {
      console.log(`[ItineraryManagementEngine] Recovered itinerary ${itineraryId} from localStorage`);
      this.itineraryStates.set(itineraryId, loadedState);
      return loadedState;
    }

    // Try to reconstruct from partial data in localStorage
    if (typeof window !== 'undefined') {
      try {
        // Look for related data that might help reconstruct the itinerary
        const preferences = localStorage.getItem('jatour-preferences');
        const savedItineraries = localStorage.getItem('jatour-saved-itineraries');

        if (preferences && savedItineraries) {
          const prefs = JSON.parse(preferences);
          const saved = JSON.parse(savedItineraries);

          // Look for a matching saved itinerary
          const matchingItinerary = saved.find((it: any) => it.id === itineraryId);
          if (matchingItinerary) {
            console.log(`[ItineraryManagementEngine] Reconstructing itinerary ${itineraryId} from saved data`);

            // Reconstruct the itinerary state
            const reconstructedState: ItineraryState = {
              id: itineraryId,
              userId: prefs.userId || 'recovered',
              version: 1,
              lastModified: Date.now(),
              itinerary: {
                itinerary: matchingItinerary.daysPlan,
                totalCost: matchingItinerary.budget,
                totalDuration: matchingItinerary.days * 480, // Estimate 8 hours per day
                budgetBreakdown: {
                  totalBudget: matchingItinerary.budget,
                  categoryBreakdown: {
                    accommodation: { allocated: 0, recommended: 0, savings: 0 },
                    transportation: { allocated: 0, recommended: 0, savings: 0 },
                    food: { allocated: 0, recommended: 0, savings: 0 },
                    activities: { allocated: matchingItinerary.budget, recommended: matchingItinerary.budget, savings: 0 },
                    miscellaneous: { allocated: 0, recommended: 0, savings: 0 }
                  },
                  optimizations: [],
                  confidence: 0.5,
                  reasoning: ['Recovered from saved itineraries']
                },
                mlInsights: {
                  personalizationScore: 0.5,
                  predictedUserSatisfaction: 0.7,
                  riskFactors: ['Recovered data - may be incomplete'],
                  recommendations: ['Review and update itinerary preferences']
                },
                optimization: {
                  timeOptimization: 0,
                  costOptimization: 0,
                  satisfactionOptimization: 0,
                  reasoning: ['Recovered from saved itineraries']
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
                userId: prefs.userId || 'recovered',
                availableDestinations: prefs.preferredSpots || [],
                preferences: prefs
              },
              syncStatus: 'pending',
              validationStatus: 'pending',
              errorLog: ['Recovered from saved itineraries']
            };

            this.itineraryStates.set(itineraryId, reconstructedState);
            await this.persistItinerary(itineraryId, reconstructedState);
            console.log(`[ItineraryManagementEngine] Successfully reconstructed itinerary ${itineraryId}`);
            return reconstructedState;
          }
        }
      } catch (reconstructionError) {
        console.warn(`[ItineraryManagementEngine] Reconstruction failed for ${itineraryId}:`, reconstructionError);
      }
    }

    console.warn(`[ItineraryManagementEngine] Could not recover itinerary ${itineraryId}`);
    return null;
  }

  // Cleanup
  cleanup(): void {
    // Clear expired itineraries from memory and localStorage
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, state] of this.itineraryStates) {
      if (now - state.lastModified > this.config.cacheTimeout * 2) {
        expiredIds.push(id);
      }
    }

    expiredIds.forEach(id => {
      this.itineraryStates.delete(id);
      this.updateQueue.delete(id);
      localStorage.removeItem(`itinerary_${id}`);
    });

    console.log(`[ItineraryManagementEngine] Cleaned up ${expiredIds.length} expired itineraries`);
  }

  // === SCALABILITY ENHANCEMENTS ===

  // Advanced caching with LRU eviction
  private getDestinationFromCache(destinationId: string): any | null {
    if (!this.config.enableAdvancedCaching) return null;

    const cached = this.destinationCache.get(destinationId);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }

    // Remove expired entry
    if (cached) {
      this.destinationCache.delete(destinationId);
    }
    return null;
  }

  private setDestinationInCache(destinationId: string, data: any): void {
    if (!this.config.enableAdvancedCaching) return;

    // Simple LRU: if cache is full, remove oldest entry
    if (this.destinationCache.size >= this.config.maxDestinationsInMemory) {
      const oldestKey = this.destinationCache.keys().next().value;
      if (oldestKey) {
        this.destinationCache.delete(oldestKey);
      }
    }

    this.destinationCache.set(destinationId, {
      data,
      timestamp: Date.now()
    });
  }

  // Lazy loading processor
  private startLazyLoadingProcessor(): void {
    setInterval(() => {
      if (this.lazyLoadQueue.size > 0) {
        const destinationIds = Array.from(this.lazyLoadQueue).slice(0, this.config.destinationBatchSize);
        this.processLazyLoadBatch(destinationIds);
      }
    }, 1000); // Process every second
  }

  private async processLazyLoadBatch(destinationIds: string[]): Promise<void> {
    try {
      // In a real implementation, this would fetch from a data source
      // For now, we'll simulate lazy loading
      for (const id of destinationIds) {
        if (!this.getDestinationFromCache(id)) {
          // Simulate fetching destination data
          const destinationData = await this.fetchDestinationData(id);
          this.setDestinationInCache(id, destinationData);
        }
        this.lazyLoadQueue.delete(id);
      }
    } catch (error) {
      console.error('[ItineraryManagementEngine] Lazy loading batch failed:', error);
    }
  }

  private async fetchDestinationData(destinationId: string): Promise<any> {
    // Placeholder for actual data fetching logic
    // This would integrate with external APIs or databases
    return {
      id: destinationId,
      name: `Destination ${destinationId}`,
      loaded: true,
      timestamp: Date.now()
    };
  }

  // Memory management and cleanup
  private startMemoryCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performMemoryCleanup();
    }, this.config.memoryCleanupInterval);
  }

  private performMemoryCleanup(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    // Clean expired cache entries
    for (const [key, value] of this.destinationCache) {
      if (now - value.timestamp > this.config.cacheTimeout) {
        toRemove.push(key);
      }
    }

    toRemove.forEach(key => this.destinationCache.delete(key));

    // Clean memory usage tracker
    for (const [id, lastAccess] of this.memoryUsageTracker) {
      if (now - lastAccess > this.config.cacheTimeout * 2) {
        this.memoryUsageTracker.delete(id);
      }
    }

    if (toRemove.length > 0) {
      console.log(`[ItineraryManagementEngine] Cleaned up ${toRemove.length} expired cache entries`);
    }
  }

  // Background sync worker
  private initializeBackgroundSync(): void {
    if (typeof Worker !== 'undefined') {
      // In a real implementation, you'd create a web worker
      // For now, we'll use setInterval for background processing
      setInterval(() => {
        this.processBackgroundSync();
      }, this.config.syncInterval);
    }
  }

  private async processBackgroundSync(): Promise<void> {
    const pendingStates = Array.from(this.itineraryStates.values())
      .filter(state => state.syncStatus === 'pending')
      .slice(0, this.config.batchProcessingSize);

    if (pendingStates.length === 0) return;

    console.log(`[ItineraryManagementEngine] Processing ${pendingStates.length} background sync items`);

    for (const state of pendingStates) {
      try {
        await this.syncItinerary(state);
      } catch (error) {
        console.error(`[ItineraryManagementEngine] Background sync failed for ${state.id}:`, error);
      }
    }
  }

  // Batch processing for updates
  async processBatchUpdates(updates: Array<{ itineraryId: string; update: ItineraryUpdate }>): Promise<void> {
    const batches = this.groupUpdatesByItinerary(updates);

    for (const [itineraryId, batchUpdates] of batches) {
      try {
        const state = this.itineraryStates.get(itineraryId);
        if (!state) continue;

        for (const update of batchUpdates) {
          await this.processIncrementalUpdate(state, update);
        }

        state.version++;
        state.lastModified = Date.now();
        await this.persistItinerary(itineraryId, state);

        console.log(`[ItineraryManagementEngine] Processed batch of ${batchUpdates.length} updates for ${itineraryId}`);
      } catch (error) {
        console.error(`[ItineraryManagementEngine] Batch processing failed for ${itineraryId}:`, error);
      }
    }
  }

  private groupUpdatesByItinerary(updates: Array<{ itineraryId: string; update: ItineraryUpdate }>): Map<string, ItineraryUpdate[]> {
    const groups = new Map<string, ItineraryUpdate[]>();

    for (const { itineraryId, update } of updates) {
      if (!groups.has(itineraryId)) {
        groups.set(itineraryId, []);
      }
      groups.get(itineraryId)!.push(update);
    }

    return groups;
  }

  // Destination management methods
  async addDestinations(itineraryId: string, destinations: any[]): Promise<void> {
    const state = this.itineraryStates.get(itineraryId);
    if (!state || !state.input) {
      throw new Error(`Itinerary ${itineraryId} not found or invalid`);
    }

    // Cache new destinations
    for (const dest of destinations) {
      this.setDestinationInCache(dest.id, dest);
    }

    // Add to itinerary input
    state.input.availableDestinations.push(...destinations);

    // Trigger re-optimization
    await this.regenerateFullItinerary(state);
    state.lastModified = Date.now();
    await this.persistItinerary(itineraryId, state);

    console.log(`[ItineraryManagementEngine] Added ${destinations.length} destinations to ${itineraryId}`);
  }

  async removeDestinations(itineraryId: string, destinationIds: string[]): Promise<void> {
    const state = this.itineraryStates.get(itineraryId);
    if (!state || !state.input) {
      throw new Error(`Itinerary ${itineraryId} not found or invalid`);
    }

    // Remove from cache
    destinationIds.forEach(id => this.destinationCache.delete(id));

    // Remove from itinerary input
    state.input.availableDestinations = state.input.availableDestinations.filter(
      dest => !destinationIds.includes(dest.id)
    );

    // Trigger re-optimization
    await this.regenerateFullItinerary(state);
    state.lastModified = Date.now();
    await this.persistItinerary(itineraryId, state);

    console.log(`[ItineraryManagementEngine] Removed ${destinationIds.length} destinations from ${itineraryId}`);
  }

  // Enhanced getItinerary with lazy loading
  async getItineraryWithLazyLoading(itineraryId: string, requiredDestinationIds?: string[]): Promise<ItineraryState | null> {
    let state = await this.getItinerary(itineraryId);
    if (!state) return null;

    if (requiredDestinationIds && this.config.enableLazyLoading) {
      // Ensure required destinations are loaded
      const missingDestinations = requiredDestinationIds.filter(id => !this.getDestinationFromCache(id));
      missingDestinations.forEach(id => this.lazyLoadQueue.add(id));

      // Wait for lazy loading to complete (with timeout)
      await this.waitForLazyLoading(missingDestinations, 5000);
    }

    return state;
  }

  private async waitForLazyLoading(destinationIds: string[], timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (destinationIds.some(id => this.lazyLoadQueue.has(id))) {
      if (Date.now() - startTime > timeoutMs) {
        console.warn('[ItineraryManagementEngine] Lazy loading timeout');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Performance monitoring
  getPerformanceStats(): any {
    return {
      cacheSize: this.destinationCache.size,
      memoryTrackedItineraries: this.memoryUsageTracker.size,
      lazyLoadQueueSize: this.lazyLoadQueue.size,
      batchQueueSize: this.batchProcessingQueue.length,
      totalItineraries: this.itineraryStates.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    const totalRequests = this.destinationCache.size;
    const cacheHits = Array.from(this.destinationCache.values())
      .filter(entry => Date.now() - entry.timestamp < this.config.cacheTimeout).length;

    return totalRequests > 0 ? cacheHits / totalRequests : 0;
  }

  // Shutdown method for cleanup
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.backgroundSyncWorker) {
      this.backgroundSyncWorker.terminate();
      this.backgroundSyncWorker = null;
    }

    this.destinationCache.clear();
    this.memoryUsageTracker.clear();
    this.lazyLoadQueue.clear();
    this.batchProcessingQueue = [];

    console.log('[ItineraryManagementEngine] Scalability features shut down');
  }
}

// Singleton instance
export const itineraryManagementEngine = new ItineraryManagementEngine();