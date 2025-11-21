import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { Destination } from '@/app/datatypes';

interface UseDestinationsOptions {
  city?: string;
  category?: string;
  featured?: boolean;
  search?: string;
  tags?: string[];
  themes?: string[];
}

export function useDestinations(filters?: UseDestinationsOptions) {
  const key = filters ? ['/destinations', JSON.stringify(filters)] : '/destinations';
  
  const { data, error, mutate, isLoading } = useSWR<Destination[]>(
    key,
    () => apiClient.getDestinations(filters),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
      dedupingInterval: 2000,
      fallbackData: [],
    }
  );

  return {
    destinations: data || [],
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}
