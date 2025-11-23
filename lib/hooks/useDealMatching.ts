import { useState, useEffect } from 'react';

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

interface DealNotification {
  id: string;
  userId: string;
  dealId: string;
  type: 'new_deal' | 'expiring_soon' | 'budget_match' | 'flash_deal' | 'personalized_recommendation';
  title: string;
  message: string;
  deal: ScoredDeal;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  actionUrl?: string;
  metadata: {
    relevanceScore: number;
    potentialSavings: number;
    category: string;
    merchantName: string;
  };
}

export function useDealMatching(
  userId: string,
  location: string,
  budget: number,
  itineraryId?: string
) {
  const [deals, setDeals] = useState<ScoredDeal[]>([]);
  const [notifications, setNotifications] = useState<DealNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchBudgetDeals = async (forceRefresh = false) => {
    if (!userId || !location) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId,
        ...(location && { location }),
        ...(itineraryId && { itineraryId }),
      });

      const response = await fetch(`/api/budget-deals?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itineraryId,
          trigger: forceRefresh ? 'manual_request' : 'budget_update',
          location,
          forceRefresh
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data.deals)) {
        setDeals(data.deals);
        setLastFetch(new Date());

        // Extract notifications if available
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      } else {
        setDeals([]);
      }
    } catch (err) {
      console.error('Failed to fetch budget deals:', err);
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetDeals();
  }, [userId, location, budget, itineraryId]);

  const refreshDeals = () => {
    fetchBudgetDeals(true);
  };

  const getTopDeals = (limit = 5): ScoredDeal[] => {
    return deals
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  };

  const getDealsByCategory = (category: string): ScoredDeal[] => {
    return deals.filter(deal => deal.category === category);
  };

  const getDealsByBudgetCategory = (budgetCategory: 'budget' | 'moderate' | 'premium'): ScoredDeal[] => {
    return deals.filter(deal => deal.budgetCategory === budgetCategory);
  };

  const getFlashDeals = (): ScoredDeal[] => {
    return deals.filter(deal => deal.tags.includes('Flash') || deal.tags.includes('Limited Time'));
  };

  const getExpiringSoonDeals = (days = 3): ScoredDeal[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return deals.filter(deal => {
      const validUntil = new Date(deal.validUntil);
      return validUntil <= futureDate && validUntil > now;
    });
  };

  const getTotalSavings = (): number => {
    return deals.reduce((total, deal) => {
      return total + (deal.originalPrice - deal.discountedPrice);
    }, 0);
  };

  const getDealsWithCoordinates = (): ScoredDeal[] => {
    return deals.filter(deal => deal.coordinates);
  };

  const getDealClusters = () => {
    const dealsWithCoords = getDealsWithCoordinates();
    const clusters: Record<string, ScoredDeal[]> = {};

    // Simple clustering by proximity (500m radius)
    dealsWithCoords.forEach(deal => {
      if (!deal.coordinates) return;

      let assignedToCluster = false;

      for (const [clusterKey, clusterDeals] of Object.entries(clusters)) {
        const [lat, lng] = clusterKey.split(',').map(Number);
        const distance = calculateDistance(
          deal.coordinates!.lat,
          deal.coordinates!.lng,
          lat,
          lng
        );

        if (distance <= 0.5) { // 500m
          clusterDeals.push(deal);
          assignedToCluster = true;
          break;
        }
      }

      if (!assignedToCluster) {
        clusters[`${deal.coordinates!.lat},${deal.coordinates!.lng}`] = [deal];
      }
    });

    return Object.entries(clusters).map(([center, clusterDeals]) => ({
      center: center.split(',').map(Number),
      deals: clusterDeals,
      totalSavings: clusterDeals.reduce((sum, deal) => sum + (deal.originalPrice - deal.discountedPrice), 0),
      averageRating: clusterDeals
        .filter(d => d.rating)
        .reduce((sum, d, _, arr) => sum + (d.rating! / arr.length), 0),
    }));
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const getUnreadNotifications = (): DealNotification[] => {
    return notifications.filter(notification => {
      // In a real app, you'd track read status
      // For now, return all recent notifications
      return true;
    });
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, /* mark as read */ }
          : notification
      )
    );
  };

  return {
    deals,
    notifications,
    loading,
    error,
    lastFetch,
    refreshDeals,
    getTopDeals,
    getDealsByCategory,
    getDealsByBudgetCategory,
    getFlashDeals,
    getExpiringSoonDeals,
    getTotalSavings,
    getDealsWithCoordinates,
    getDealClusters,
    getUnreadNotifications,
    markNotificationAsRead,
  };
}