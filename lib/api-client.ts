import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('jatour_token') 
          : null;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error
          const message = (error.response.data as any)?.message || error.message;
          return Promise.reject(new Error(message));
        } else if (error.request) {
          // Request made but no response
          return Promise.reject(new Error('Network error. Please check your connection.'));
        } else {
          // Something else happened
          return Promise.reject(error);
        }
      }
    );
  }

  // Users
  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    return this.client.post('/users/register', data);
  }

  async login(data: { email: string; password: string }) {
    return this.client.post('/users/login', data);
  }

  async getUser(id: string) {
    return this.client.get(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.client.patch(`/users/${id}`, data);
  }

  // Destinations
  async getDestinations(filters?: {
    city?: string;
    category?: string;
    featured?: boolean;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.featured) params.append('featured', 'true');
    if (filters?.search) params.append('search', filters.search);

    return this.client.get(`/destinations?${params.toString()}`);
  }

  async getDestination(id: string) {
    return this.client.get(`/destinations/${id}`);
  }

  // Itineraries
  async getItineraries(userId?: string) {
    const url = userId ? `/itineraries?userId=${userId}` : '/itineraries';
    return this.client.get(url);
  }

  async getItinerary(id: string) {
    return this.client.get(`/itineraries/${id}`);
  }

  async createItinerary(data: any) {
    return this.client.post('/itineraries', data);
  }

  async updateItinerary(id: string, data: any) {
    return this.client.patch(`/itineraries/${id}`, data);
  }

  async deleteItinerary(id: string) {
    return this.client.delete(`/itineraries/${id}`);
  }

  // Planner
  async getRecommendations(userId: string, filters?: {
    budget?: number;
    days?: number;
    interests?: string[];
    city?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.budget) params.append('budget', filters.budget.toString());
    if (filters?.days) params.append('days', filters.days.toString());
    if (filters?.interests) params.append('interests', filters.interests.join(','));
    if (filters?.city) params.append('city', filters.city);

    return this.client.get(`/planner/recommendations/${userId}?${params.toString()}`);
  }

  async calculateRoute(destinationIds: string[], startLocation?: { lat: number; lng: number }) {
    const params = new URLSearchParams();
    params.append('destinations', destinationIds.join(','));
    if (startLocation) {
      params.append('startLat', startLocation.lat.toString());
      params.append('startLng', startLocation.lng.toString());
    }

    return this.client.get(`/planner/route?${params.toString()}`);
  }

  // Budget
  async calculateBudgetBreakdown(itineraryId: string) {
    return this.client.get(`/budget/calculate/${itineraryId}`);
  }

  async getBudgets(userId: string) {
    return this.client.get(`/budget?userId=${userId}`);
  }

  async createBudget(data: any) {
    return this.client.post('/budget', data);
  }

  async updateBudget(id: string, data: any) {
    return this.client.patch(`/budget/${id}`, data);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
