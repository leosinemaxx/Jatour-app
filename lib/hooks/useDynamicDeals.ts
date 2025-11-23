"use client";

import { useState, useEffect, useCallback } from 'react';

// Define ScoredDeal interface for frontend
interface ScoredDeal {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  category: 'dining' | 'accommodation' | 'transportation' | 'activities' | 'shopping';
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  validUntil: Date;
  terms: string[];
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  tags: string[];
  budgetCategory: 'budget' | 'moderate' | 'premium';
  averageSpendPerHour?: number;
  relevanceScore: number;
  budgetAlignmentScore: number;
  categoryFitScore: number;
  locationRelevanceScore: number;
  timeRelevanceScore: number;
  userPreferenceScore: number;
  reasoning: string[];
}

interface UseDynamicDealsOptions {
  userId: string;
  location?: string;
  refreshInterval?: number; // in milliseconds
  enableRealTime?: boolean;
}

interface DynamicDealsState {
  deals: ScoredDeal[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  totalDeals: number;
}

export const useDynamicDeals = ({
  userId,
  location,
  refreshInterval = 300000, // 5 minutes default
  enableRealTime = true
}: UseDynamicDealsOptions) => {
  const [state, setState] = useState<DynamicDealsState>({
    deals: [],
    loading: false,
    error: null,
    lastUpdated: null,
    totalDeals: 0
  });

  // Fetch deals from API
  const fetchDeals = useCallback(async (forceRefresh = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        userId,
        ...(location && { location }),
        ...(forceRefresh && { forceRefresh: 'true' })
      });

      const response = await fetch(`/api/deals?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.statusText}`);
      }

      const data = await response.json();

      setState({
        deals: data.deals || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
        totalDeals: data.totalCount || data.deals?.length || 0
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [userId, location]);

  // Manual refresh function
  const refreshDeals = useCallback(() => {
    fetchDeals(true);
  }, [fetchDeals]);

  // Set up periodic refresh
  useEffect(() => {
    if (!enableRealTime) return;

    // Initial fetch
    fetchDeals();

    // Set up interval for periodic updates
    const interval = setInterval(() => {
      fetchDeals();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDeals, refreshInterval, enableRealTime]);

  // WebSocket or Server-Sent Events for real-time updates (if supported)
  useEffect(() => {
    if (!enableRealTime) return;

    let eventSource: EventSource | null = null;

    try {
      // Try to establish SSE connection for real-time deal updates
      eventSource = new EventSource(`/api/deals/stream?userId=${userId}`);

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);

          if (update.type === 'deal_update') {
            setState(prev => ({
              ...prev,
              deals: update.deals || prev.deals,
              lastUpdated: new Date(),
              totalDeals: update.totalCount || prev.totalDeals
            }));
          } else if (update.type === 'new_deal') {
            setState(prev => ({
              ...prev,
              deals: [update.deal, ...prev.deals],
              lastUpdated: new Date(),
              totalDeals: prev.totalDeals + 1
            }));
          }
        } catch (error) {
          console.warn('Failed to parse real-time update:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.warn('SSE connection error:', error);
        // Could implement fallback polling here
      };

    } catch (error) {
      console.warn('SSE not supported, falling back to polling');
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userId, enableRealTime]);

  return {
    ...state,
    refreshDeals,
    isStale: state.lastUpdated ?
      (Date.now() - state.lastUpdated.getTime()) > refreshInterval : false
  };
};

// Hook for deal notifications
export const useDealNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'new_deal' | 'expiring_deal' | 'price_drop';
    dealId?: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/deals/notifications?userId=${userId}`);

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
        } catch (error) {
          console.warn('Failed to parse notification:', error);
        }
      };

    } catch (error) {
      console.warn('Notifications not supported');
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userId]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotification,
    clearAllNotifications
  };
};

// Hook for deal price benchmarking
export const useDealBenchmarking = (dealId: string) => {
  const [benchmark, setBenchmark] = useState<{
    currentPrice: number;
    averageMarketPrice: number;
    percentile: number;
    trend: 'up' | 'down' | 'stable';
    competitors: Array<{
      name: string;
      price: number;
      rating: number;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const fetchBenchmark = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/benchmark`);
      if (response.ok) {
        const data = await response.json();
        setBenchmark(data);
      }
    } catch (error) {
      console.error('Failed to fetch benchmark:', error);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (dealId) {
      fetchBenchmark();
    }
  }, [dealId, fetchBenchmark]);

  return {
    benchmark,
    loading,
    refetch: fetchBenchmark
  };
};