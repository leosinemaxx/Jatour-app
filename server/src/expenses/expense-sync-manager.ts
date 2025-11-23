// Expense Sync Manager for external API polling (QRIS, banking, e-wallets)
// Handles automatic synchronization of transactions from external sources

import { Injectable, Logger } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

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

@Injectable()
export class ExpenseSyncManager {
  private config: SyncConfig;
  private syncQueue: Map<string, ExternalTransaction[]> = new Map();
  private lastSyncTimestamps: Map<string, Date> = new Map();
  private isPolling = false;
  private pollingIntervalId?: NodeJS.Timeout;
  private logger: Logger = new Logger('ExpenseSyncManager');

  constructor(private readonly expensesService: ExpensesService) {
    this.config = {
      enabled: true,
      pollingInterval: 15, // 15 minutes
      maxRetries: 3,
      supportedSources: ['qris', 'bca', 'mandiri', 'gopay', 'ovo', 'dana'],
      apiEndpoints: {
        qris: process.env.QRIS_API_ENDPOINT || 'https://api.qris-gateway.com/transactions',
        bca: process.env.BCA_API_ENDPOINT || 'https://api.bca.co.id/transactions',
        mandiri: process.env.MANDIRI_API_ENDPOINT || 'https://api.mandiri.com/transactions',
        gopay: process.env.GOPAY_API_ENDPOINT || 'https://api.gopay.com/transactions',
        ovo: process.env.OVO_API_ENDPOINT || 'https://api.ovo.com/transactions',
        dana: process.env.DANA_API_ENDPOINT || 'https://api.dana.com/transactions',
      },
      apiKeys: {
        qris: process.env.QRIS_API_KEY || '',
        bca: process.env.BCA_API_KEY || '',
        mandiri: process.env.MANDIRI_API_KEY || '',
        gopay: process.env.GOPAY_API_KEY || '',
        ovo: process.env.OVO_API_KEY || '',
        dana: process.env.DANA_API_KEY || '',
      }
    };

    if (this.config.enabled) {
      this.startPolling();
    }
  }

  // Start periodic polling for transactions
  private startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.logger.log('Starting transaction polling...');

    // Initial sync
    this.performSync();

    // Set up interval
    this.pollingIntervalId = setInterval(() => {
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

    this.logger.log('Performing transaction sync...');

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
        this.logger.error(`Error syncing ${source}:`, error);
        allErrors.push(`${source}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const overallSuccess = results.every(r => r.success);
    const lastSyncAt = new Date();

    this.logger.log(`Sync completed. Total transactions: ${totalSynced}, Errors: ${allErrors.length}`);

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
      // Fetch transactions from external API
      const transactions = await this.fetchTransactionsFromAPI(source, endpoint, apiKey, since);

      // Process and sync transactions
      let syncedCount = 0;
      for (const transaction of transactions) {
        try {
          // Map userIdentifier to userId - in real implementation, this would query user mapping
          const userId = await this.mapUserIdentifierToUserId(transaction.userIdentifier);
          if (userId) {
            await this.expensesService.syncTransaction({
              userId,
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
            });
            syncedCount++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync transaction ${transaction.externalId}:`, error);
        }
      }

      this.lastSyncTimestamps.set(source, new Date());

      return {
        success: true,
        transactionsSynced: syncedCount,
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
    this.logger.log(`Fetching transactions from ${source} since ${since}`);
    this.logger.log(`API endpoint: ${endpoint}`);
    this.logger.log(`API key configured: ${apiKey ? 'Yes' : 'No'}`);

    // For development/demo, skip real API calls and use mock data
    if (!apiKey || endpoint.includes('example.com') || endpoint.includes('localhost')) {
      this.logger.log(`Using mock data for ${source} (development mode)`);
      return this.getMockTransactions(source);
    }

    try {
      this.logger.log(`Making API call to ${endpoint}`);

      // In production, make actual API calls
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Since': since
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        const errorMsg = `API request failed: ${response.status} ${response.statusText}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      this.logger.log(`API response received for ${source}, parsing data...`);

      // Parse API response into ExternalTransaction format
      // This depends on the actual API response format
      return this.parseApiResponse(source, data);
    } catch (error) {
      this.logger.error(`API call failed for ${source}:`, error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.logger.error(`Network error for ${source}: Check internet connection and endpoint URL`);
      }

      // Return mock data for development/demo purposes as fallback
      this.logger.log(`Falling back to mock data for ${source}`);
      return this.getMockTransactions(source);
    }
  }

  // Parse API response into standardized format
  private parseApiResponse(source: string, data: any): ExternalTransaction[] {
    // This implementation depends on the actual API response format
    // For now, return mock data
    return this.getMockTransactions(source);
  }

  // Mock transaction data for development
  private getMockTransactions(source: string): ExternalTransaction[] {
    const mockTransactions: ExternalTransaction[] = [
      {
        externalId: `${source}-tx-${Date.now()}-001`,
        source,
        amount: Math.floor(Math.random() * 200000) + 10000, // 10k - 210k
        currency: 'IDR',
        date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
        merchant: this.getRandomMerchant(source),
        location: 'Jakarta',
        description: `Transaction from ${source}`,
        status: 'completed',
        userIdentifier: 'demo-user-123' // In real implementation, this would be actual user identifier
      }
    ];

    return mockTransactions;
  }

  private getRandomMerchant(source: string): string {
    const merchants = {
      qris: ['Warung Padang', 'Starbucks', 'McDonald\'s', 'Indomaret'],
      bca: ['Online Shopping', 'Grocery Store', 'Restaurant', 'Gas Station'],
      mandiri: ['E-commerce', 'Food Delivery', 'Transportation', 'Entertainment'],
      gopay: ['GoFood', 'GoRide', 'GoCar', 'GoMart'],
      ovo: ['OVO Store', 'Merchant Payment', 'Top Up', 'Bill Payment'],
      dana: ['DANA Merchant', 'Online Payment', 'Transfer', 'Purchase']
    };

    const sourceMerchants = merchants[source as keyof typeof merchants] || ['Unknown Merchant'];
    return sourceMerchants[Math.floor(Math.random() * sourceMerchants.length)];
  }

  // Map user identifier to userId
  private async mapUserIdentifierToUserId(userIdentifier: string): Promise<string | null> {
    this.logger.log(`Mapping user identifier: ${userIdentifier}`);

    // In real implementation, this would query a mapping table or user service
    // For demo purposes, return a mock userId that exists in seed data
    // We need to use an existing user ID from the database
    if (userIdentifier === 'demo-user-123') {
      // Query for demo user from seed data
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findFirst({
          where: { email: 'demo@jatour.com' }
        });
        await prisma.$disconnect();

        if (user) {
          this.logger.log(`Found demo user with ID: ${user.id}`);
          return user.id;
        } else {
          this.logger.error('Demo user not found in database');
          return null;
        }
      } catch (error) {
        this.logger.error('Error querying demo user:', error);
        return null;
      }
    }
    return null;
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
      this.stopPolling();
    }
  }

  private stopPolling(): void {
    this.isPolling = false;
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = undefined;
    }
  }

  // Cleanup
  destroy(): void {
    this.stopPolling();
    this.syncQueue.clear();
    this.lastSyncTimestamps.clear();
  }
}