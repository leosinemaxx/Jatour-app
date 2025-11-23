import { useState, useEffect } from 'react';

export interface AccommodationData {
  id: string;
  name: string;
  city: string;
  category: 'budget' | 'moderate' | 'luxury';
  type: string;
  description: string;
  image: string;
  amenities: string;
  rating: number;
  priceRange: string;
}

export function useAccommodations(city?: string, category?: string) {
  const [accommodations, setAccommodations] = useState<AccommodationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (city && category) {
      fetchAccommodations(city, category);
    } else {
      // Clear data when city or category is not available
      setAccommodations([]);
      setError(null);
    }
  }, [city, category]);

  const fetchAccommodations = async (city: string, category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching accommodations for:', { city, category });
      console.log('🌐 API URL:', `/api/accommodations/city/${city}/category/${category}`);
      
      const response = await fetch(`/api/accommodations/city/${city}/category/${category}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch accommodations: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched accommodations:', data);
      
      // Validate the data structure
      if (!Array.isArray(data)) {
        console.error('❌ Invalid response format - expected array, got:', typeof data);
        throw new Error('Invalid response format from server');
      }
      
      console.log(`✅ Successfully loaded ${data.length} accommodations`);
      setAccommodations(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching accommodations';
      setError(errorMessage);
      console.error('❌ Error fetching accommodations:', err);
      
      // Set fallback mock data for development
      console.log('🔄 Using fallback mock data for:', { city, category });
      const mockData = getMockAccommodations(city, category);
      console.log('✅ Mock data generated:', mockData);
      setAccommodations(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/testing
  const getMockAccommodations = (city: string, category: string): AccommodationData[] => {
    const basePrices = {
      budget: 150000,
      moderate: 350000,
      luxury: 800000
    };
    
    const cityMultiplier = city === 'Jakarta' ? 1.3 : city === 'Bali' ? 1.2 : 1.0;
    const basePrice = basePrices[category as keyof typeof basePrices] * cityMultiplier;

    return [
      {
        id: 'mock-1',
        name: category === 'budget' ? `${city} Budget Inn` : 
              category === 'moderate' ? `${city} Grand Hotel` : `${city} Luxury Palace`,
        city: city,
        category: category as any,
        type: 'Hotel',
        description: `A ${category} accommodation in ${city}`,
        image: '/api/placeholder/300/200',
        amenities: 'WiFi,Breakfast,Pool,Gym,Restaurant',
        rating: category === 'budget' ? 3.8 : category === 'moderate' ? 4.2 : 4.8,
        priceRange: `IDR ${Math.round(basePrice).toLocaleString()}`
      },
      {
        id: 'mock-2',
        name: category === 'budget' ? `${city} Economy Lodge` : 
              category === 'moderate' ? `${city} Premium Suites` : `${city} Royal Residence`,
        city: city,
        category: category as any,
        type: 'Hotel',
        description: `A ${category} accommodation in ${city}`,
        image: '/api/placeholder/300/200',
        amenities: 'WiFi,Breakfast,Pool,Restaurant,Spa',
        rating: category === 'budget' ? 3.5 : category === 'moderate' ? 4.0 : 4.6,
        priceRange: `IDR ${Math.round(basePrice * 1.2).toLocaleString()}`
      }
    ];
  };

  return {
    accommodations,
    loading,
    error,
    refetch: () => city && category && fetchAccommodations(city, category),
  };
}
