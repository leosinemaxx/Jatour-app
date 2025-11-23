import { useState, useEffect } from 'react';

interface PriceComparisonResult {
  id: string;
  provider: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  description: string;
  features: string[];
  availability: boolean;
  bookingUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface ComparisonData {
  hotels?: PriceComparisonResult[];
  transportation?: PriceComparisonResult[];
  dining?: PriceComparisonResult[];
  location: string;
  dateRange?: {
    checkIn?: string;
    checkOut?: string;
  };
  preferences: {
    budget: number;
    accommodationType: string;
    travelers: number;
  };
}

export function usePriceComparison(
  location: string,
  budget: number,
  accommodationType: string,
  travelers: number = 2
) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceComparisons = async () => {
    if (!location || budget <= 0) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate date range (next 7 days for demo)
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1); // Tomorrow
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 7); // 7 days later

      const dateRange = {
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
      };

      // Fetch hotel comparisons
      const hotelResponse = await fetch(
        `/api/price-comparison/hotels?location=${encodeURIComponent(location)}&checkInDate=${dateRange.checkIn}&checkOutDate=${dateRange.checkOut}&guests=${travelers}&budget=${budget}`
      );
      const hotels = hotelResponse.ok ? await hotelResponse.json() : [];

      // Fetch transportation comparisons
      const transportationResponse = await fetch(
        `/api/price-comparison/transportation?from=${encodeURIComponent(location)}&to=${encodeURIComponent(location)}&passengers=${travelers}&budget=${Math.floor(budget * 0.2)}`
      );
      const transportation = transportationResponse.ok ? await transportationResponse.json() : [];

      // Fetch dining comparisons
      const diningResponse = await fetch(
        `/api/price-comparison/dining?location=${encodeURIComponent(location)}&guests=${travelers}&budget=${Math.floor(budget * 0.15)}`
      );
      const dining = diningResponse.ok ? await diningResponse.json() : [];

      const data: ComparisonData = {
        hotels,
        transportation,
        dining,
        location,
        dateRange,
        preferences: {
          budget,
          accommodationType,
          travelers,
        },
      };

      setComparisonData(data);
    } catch (err) {
      console.error('Failed to fetch price comparisons:', err);
      setError('Failed to load price comparisons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceComparisons();
  }, [location, budget, accommodationType, travelers]);

  const getBestDeals = () => {
    if (!comparisonData) return null;

    const bestHotel = comparisonData.hotels?.sort((a, b) => {
      // Score based on price, rating, and discount
      const scoreA = (a.price / budget) * 0.4 + (a.rating / 5) * 0.4 + (a.discount || 0) * 0.2;
      const scoreB = (b.price / budget) * 0.4 + (b.rating / 5) * 0.4 + (b.discount || 0) * 0.2;
      return scoreA - scoreB; // Lower score is better
    })[0];

    const bestTransportation = comparisonData.transportation?.sort((a, b) => {
      const scoreA = (a.price / (budget * 0.2)) * 0.5 + (a.rating / 5) * 0.3 + (a.discount || 0) * 0.2;
      const scoreB = (b.price / (budget * 0.2)) * 0.5 + (b.rating / 5) * 0.3 + (b.discount || 0) * 0.2;
      return scoreA - scoreB;
    })[0];

    const bestDining = comparisonData.dining?.sort((a, b) => {
      const scoreA = (a.price / (budget * 0.15)) * 0.4 + (a.rating / 5) * 0.4 + (a.discount || 0) * 0.2;
      const scoreB = (b.price / (budget * 0.15)) * 0.4 + (b.rating / 5) * 0.4 + (b.discount || 0) * 0.2;
      return scoreA - scoreB;
    })[0];

    return {
      hotel: bestHotel,
      transportation: bestTransportation,
      dining: bestDining,
    };
  };

  const getSavingsPotential = () => {
    if (!comparisonData) return 0;

    let totalSavings = 0;

    // Calculate potential savings from best deals
    const bestDeals = getBestDeals();
    if (bestDeals?.hotel?.discount) {
      totalSavings += bestDeals.hotel.discount;
    }
    if (bestDeals?.transportation?.discount) {
      totalSavings += bestDeals.transportation.discount;
    }
    if (bestDeals?.dining?.discount) {
      totalSavings += bestDeals.dining.discount;
    }

    return totalSavings;
  };

  const getLocationOptimizedDeals = async () => {
    // This would integrate with geospatial-deal-engine
    // For now, return deals with coordinates
    if (!comparisonData) return [];

    const dealsWithCoords = [
      ...(comparisonData.hotels || []).filter(h => h.coordinates),
      ...(comparisonData.transportation || []).filter(t => t.coordinates),
      ...(comparisonData.dining || []).filter(d => d.coordinates),
    ];

    // Sort by relevance score (would use relevance-scoring service)
    return dealsWithCoords.sort((a, b) => {
      // Simple scoring based on rating and price efficiency
      const scoreA = (a.rating / 5) * 0.6 + (1 - a.price / budget) * 0.4;
      const scoreB = (b.rating / 5) * 0.6 + (1 - b.price / budget) * 0.4;
      return scoreB - scoreA;
    });
  };

  return {
    comparisonData,
    loading,
    error,
    refetch: fetchPriceComparisons,
    getBestDeals,
    getSavingsPotential,
    getLocationOptimizedDeals,
  };
}