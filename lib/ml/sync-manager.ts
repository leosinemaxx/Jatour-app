// Sync Manager for Cross-Tab Synchronization and State Consistency
// Handles conflict resolution and distributed state management

export interface SyncResult {
  success: boolean;
  hasConflict: boolean;
  conflictResolution?: any;
  error?: string;
  syncedVersion?: number;
}

export interface SyncConfig {
  enableCrossTabSync: boolean;
  enableServerSync: boolean;
  conflictResolutionStrategy: 'server_wins' | 'client_wins' | 'manual';
  syncInterval: number;
  maxRetries: number;
}

export class SyncManager {
  private syncQueue: Map<string, any> = new Map();
  private lastSyncTimestamps: Map<string, number> = new Map();
  private config: SyncConfig;
  private broadcastChannel?: BroadcastChannel;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enableCrossTabSync: true,
      enableServerSync: true,
      conflictResolutionStrategy: 'server_wins',
      syncInterval: 30000,
      maxRetries: 3,
      ...config
    };

    this.initializeBroadcastChannel();
    this.initializeEventListeners();
  }

  async syncItinerary(itineraryState: any): Promise<SyncResult> {
    console.log(`[SyncManager] Syncing itinerary ${itineraryState.id}`);

    try {
      // Check for local conflicts first
      const localConflict = await this.checkLocalConflicts(itineraryState);
      if (localConflict) {
        return {
          success: false,
          hasConflict: true,
          conflictResolution: await this.resolveConflict(itineraryState, localConflict)
        };
      }

      // Attempt server sync
      if (this.config.enableServerSync) {
        const serverResult = await this.syncWithServer(itineraryState);
        if (!serverResult.success) {
          return serverResult;
        }
      }

      // Broadcast to other tabs
      if (this.config.enableCrossTabSync) {
        this.broadcastUpdate(itineraryState);
      }

      this.lastSyncTimestamps.set(itineraryState.id, Date.now());

      return {
        success: true,
        hasConflict: false,
        syncedVersion: itineraryState.version
      };
    } catch (error) {
      console.error(`[SyncManager] Sync failed for itinerary ${itineraryState.id}:`, error);
      return {
        success: false,
        hasConflict: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async checkLocalConflicts(itineraryState: any): Promise<any | null> {
    // Check localStorage for conflicting versions
    try {
      const stored = localStorage.getItem(`itinerary_${itineraryState.id}`);
      if (stored) {
        const storedState = JSON.parse(stored);
        if (storedState.version > itineraryState.version) {
          console.log(`[SyncManager] Local conflict detected for ${itineraryState.id}`);
          return {
            type: 'local',
            conflictingState: storedState
          };
        }
      }
    } catch (error) {
      console.warn(`[SyncManager] Error checking local conflicts:`, error);
    }

    return null;
  }

  private async syncWithServer(itineraryState: any): Promise<SyncResult> {
    // Simulate server sync - in real implementation, this would make HTTP requests
    console.log(`[SyncManager] Syncing with server for itinerary ${itineraryState.id}`);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate occasional server conflicts
      if (Math.random() < 0.1) { // 10% chance of conflict
        return {
          success: false,
          hasConflict: true,
          conflictResolution: {
            strategy: this.config.conflictResolutionStrategy,
            serverVersion: {
              ...itineraryState,
              version: itineraryState.version + 1,
              lastModified: Date.now()
            }
          }
        };
      }

      return { success: true, hasConflict: false };
    } catch (error) {
      return {
        success: false,
        hasConflict: false,
        error: `Server sync failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async resolveConflict(localState: any, conflict: any): Promise<any> {
    console.log(`[SyncManager] Resolving conflict for ${localState.id}`);

    switch (this.config.conflictResolutionStrategy) {
      case 'server_wins':
        return {
          resolvedState: conflict.conflictingState,
          strategy: 'server_wins'
        };

      case 'client_wins':
        return {
          resolvedState: localState,
          strategy: 'client_wins'
        };

      case 'manual':
      default:
        // For manual resolution, return both versions for user decision
        return {
          resolvedState: null, // Requires manual intervention
          strategy: 'manual',
          localVersion: localState,
          serverVersion: conflict.conflictingState
        };
    }
  }

  private initializeBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined' && this.config.enableCrossTabSync) {
      this.broadcastChannel = new BroadcastChannel('itinerary-sync');

      this.broadcastChannel.onmessage = (event) => {
        const { type, itineraryId, data } = event.data;
        console.log(`[SyncManager] Received broadcast: ${type} for ${itineraryId}`);

        if (type === 'itinerary_update') {
          this.handleBroadcastUpdate(itineraryId, data);
        }
      };
    }
  }

  private broadcastUpdate(itineraryState: any): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'itinerary_update',
        itineraryId: itineraryState.id,
        data: {
          version: itineraryState.version,
          lastModified: itineraryState.lastModified,
          syncStatus: itineraryState.syncStatus
        }
      });
    }
  }

  private handleBroadcastUpdate(itineraryId: string, data: any): void {
    // Update local timestamp to prevent unnecessary syncs
    this.lastSyncTimestamps.set(itineraryId, data.lastModified);

    // Emit event for ItineraryManagementEngine to handle
    window.dispatchEvent(new CustomEvent('itinerary-sync-update', {
      detail: { itineraryId, data }
    }));
  }

  private initializeEventListeners(): void {
    // Only add event listeners in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Listen for visibility changes to sync when tab becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('[SyncManager] Tab became active, checking for pending syncs');
        this.processPendingSyncs();
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[SyncManager] Connection restored, processing pending syncs');
      this.processPendingSyncs();
    });
  }

  private async processPendingSyncs(): Promise<void> {
    // Process any queued sync operations
    for (const [itineraryId, state] of this.syncQueue) {
      try {
        await this.syncItinerary(state);
        this.syncQueue.delete(itineraryId);
      } catch (error) {
        console.error(`[SyncManager] Failed to process pending sync for ${itineraryId}:`, error);
      }
    }
  }

  // Queue sync for later if offline or tab inactive
  queueSync(itineraryState: any): void {
    if (!navigator.onLine || document.hidden) {
      console.log(`[SyncManager] Queuing sync for ${itineraryState.id} (offline/inactive)`);
      this.syncQueue.set(itineraryState.id, itineraryState);
    }
  }

  // Get sync status for an itinerary
  getSyncStatus(itineraryId: string): any {
    const lastSync = this.lastSyncTimestamps.get(itineraryId);
    const isQueued = this.syncQueue.has(itineraryId);

    return {
      lastSync,
      isQueued,
      timeSinceLastSync: lastSync ? Date.now() - lastSync : null,
      isOnline: navigator.onLine
    };
  }

  // Force sync all pending items
  async forceSyncAll(): Promise<void> {
    console.log('[SyncManager] Forcing sync of all pending items');
    await this.processPendingSyncs();
  }

  // Cleanup
  destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.syncQueue.clear();
    this.lastSyncTimestamps.clear();
  }
}

// Singleton instance
export const syncManager = new SyncManager();