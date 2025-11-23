// Expense Sync Manager for external API polling (QRIS, banking, e-wallets)
// Handles automatic synchronization of transactions from external sources

export interface SyncConfig {
  enabled: boolean;
  pollingInterval: number; // in minutes
  maxRetries: number;
  supportedSources: string[];
  apiEndpoints: Record<string, string>;
  apiKeys: Record<string, string>;
}

export interface SyncResult {
  success: boolean;
  transactionsSynced: number;
  errors: string[];
  lastSyncAt: Date;
}

export interface ExternalTransaction {
  externalId: string;
  source: string;
  amount: number;
  currency: string;
  date: Date;
  merchant?: string;
  location?: string;
  description?: string;
  status: string;
  userIdentifier: string; // Could be account number, phone, etc.
}

export class ExpenseSyncManager {
  private config: SyncConfig;
  private syncQueue: Map<string, ExternalTransaction[]> = new Map();
  private lastSyncTimestamps: Map<string, Date> = new Map();
  private isPolling = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enabled: true,
      pollingInterval: 15, // 15 minutes
      maxRetries: 3,
      supportedSources: ['qris', 'bca', 'mandiri', 'gopay', 'ovo', 'dana'],
      apiEndpoints: {
        qris: 'https://api.qris-gateway.com/transactions',
        bca: 'https://api.bca.co.id/transactions',
        mandiri: 'https://api.mandiri.com/transactions',
        gopay: 'https://api.gopay.com/transactions',
        ovo: 'https://api.ovo.com/transactions',
        dana: 'https://api.dana.com/transactions',
      },
      apiKeys: {},
      ...config
    };

    if (this.config.enabled) {
      this.startPolling();
    }
  }

  // Start periodic polling for transactions
  private startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log('[ExpenseSyncManager] Starting transaction polling...');

    // Initial sync
    this.performSync();

    // Set up interval
    setInterval(() => {
      this.performSync();
    }, this.config.pollingInterval * 60 * 1000);
  }

  // Perform synchronization for all enabled sources
  async performSync(): Promise<SyncResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        transactionsSynced: 0,
        errors: ['Sync is disabled'],
        lastSyncAt: new Date()
      };
    }

    console.log('[ExpenseSyncManager] Performing transaction sync...');

    const results: SyncResult[] = [];
    const allErrors: string[] = [];
    let totalSynced = 0;

    for (const source of this.config.supportedSources) {
      try {
        const result = await this.syncFromSource(source);
        results.push(result);
        totalSynced += result.transactionsSynced;
        allErrors.push(...result.errors);
      } catch (error) {
        console.error(`[ExpenseSyncManager] Error syncing ${source}:`, error);
        allErrors.push(`${source}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const overallSuccess = results.every(r => r.success);
    const lastSyncAt = new Date();

    console.log(`[ExpenseSyncManager] Sync completed. Total transactions: ${totalSynced}, Errors: ${allErrors.length}`);

    return {
      success: overallSuccess,
      transactionsSynced: totalSynced,
      errors: allErrors,
      lastSyncAt
    };
  }

  // Sync transactions from a specific source
  private async syncFromSource(source: string): Promise<SyncResult> {
    const endpoint = this.config.apiEndpoints[source];
    const apiKey = this.config.apiKeys[source];

    if (!endpoint) {
      return {
        success: false,
        transactionsSynced: 0,
        errors: [`No endpoint configured for ${source}`],
        lastSyncAt: new Date()
      };
    }

    const lastSync = this.lastSyncTimestamps.get(source) || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const since = lastSync.toISOString();

    try {
      // Simulate API call - in real implementation, this would make actual HTTP requests
      const transactions = await this.fetchTransactionsFromAPI(source, endpoint, apiKey, since);

      // Process and queue transactions for syncing
      if (transactions.length > 0) {
        this.syncQueue.set(source, transactions);
        await this.processQueuedTransactions(source);
      }

      this.lastSyncTimestamps.set(source, new Date());

      return {
        success: true,
        transactionsSynced: transactions.length,
        errors: [],
        lastSyncAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        transactionsSynced: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        lastSyncAt: new Date()
      };
    }
  }

  // Fetch transactions from external API
  private async fetchTransactionsFromAPI(
    source: string,
    endpoint: string,
    apiKey: string,
    since: string
  ): Promise<ExternalTransaction[]> {
    // This is a mock implementation - in production, this would make real API calls
    console.log(`[ExpenseSyncManager] Fetching transactions from ${source} since ${since}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock transaction data - in real implementation, parse actual API response
    const mockTransactions: ExternalTransaction[] = [
      {
        externalId: `${source}-tx-001`,
        source,
        amount: 50000,
        currency: 'IDR',
        date: new Date(),
        merchant: 'Warung Makan Padang',
        location: 'Jakarta',
        description: 'Lunch payment',
        status: 'completed',
        userIdentifier: 'user123'
      },
      {
        externalId: `${source}-tx-002`,
        source,
        amount: 150000,
        currency: 'IDR',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        merchant: 'GoJek',
        location: 'Jakarta',
        description: 'Ride to airport',
        status: 'completed',
        userIdentifier: 'user123'
      }
    ];

    // Filter transactions since last sync
    return mockTransactions.filter(tx => tx.date > new Date(since));
  }

  // Process queued transactions and sync to expense service
  private async processQueuedTransactions(source: string): Promise<void> {
    const transactions = this.syncQueue.get(source);
    if (!transactions || transactions.length === 0) return;

    console.log(`[ExpenseSyncManager] Processing ${transactions.length} transactions from ${source}`);

    // In real implementation, this would call the ExpenseService.syncTransaction method
    // For now, we'll simulate the sync process
    for (const transaction of transactions) {
      try {
        await this.syncTransactionToExpenseService(transaction);
      } catch (error) {
        console.error(`[ExpenseSyncManager] Failed to sync transaction ${transaction.externalId}:`, error);
      }
    }

    // Clear processed transactions
    this.syncQueue.delete(source);
  }

  // Sync individual transaction to expense service
  private async syncTransactionToExpenseService(transaction: ExternalTransaction): Promise<void> {
    // This would make an HTTP call to the expense service
    // For now, we'll simulate the sync
    console.log(`[ExpenseSyncManager] Syncing transaction: ${transaction.externalId} - ${transaction.amount} ${transaction.currency}`);

    // Simulate API call to expense service
    const syncData = {
      userId: transaction.userIdentifier, // In real implementation, map userIdentifier to actual userId
      source: transaction.source,
      externalId: transaction.externalId,
      amount: transaction.amount,
      currency: transaction.currency,
      date: transaction.date.toISOString(),
      merchant: transaction.merchant,
      location: transaction.location,
      description: transaction.description,
      status: transaction.status,
      consentGiven: true
    };

    // In production, make actual API call:
    // await fetch('/api/expenses/sync-transaction', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(syncData)
    // });
  }

  // Manual sync trigger
  async manualSync(source?: string): Promise<SyncResult> {
    if (source) {
      return await this.syncFromSource(source);
    } else {
      return await this.performSync();
    }
  }

  // Get sync status
  getSyncStatus(source?: string): any {
    if (source) {
      return {
        lastSync: this.lastSyncTimestamps.get(source),
        queuedTransactions: this.syncQueue.get(source)?.length || 0,
        isEnabled: this.config.supportedSources.includes(source)
      };
    }

    const status: Record<string, any> = {};
    for (const src of this.config.supportedSources) {
      status[src] = this.getSyncStatus(src);
    }

    return {
      overall: {
        enabled: this.config.enabled,
        pollingInterval: this.config.pollingInterval,
        isPolling: this.isPolling
      },
      sources: status
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enabled && !this.isPolling) {
      this.startPolling();
    } else if (!this.config.enabled && this.isPolling) {
      this.isPolling = false;
    }
  }

  // Cleanup
  destroy(): void {
    this.isPolling = false;
    this.syncQueue.clear();
    this.lastSyncTimestamps.clear();
  }
}

// Singleton instance
export const expenseSyncManager = new ExpenseSyncManager();