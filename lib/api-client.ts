import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  User, 
  Itinerary, 
  Destination, 
  Weather, 
  Wallet, 
  PaymentCard,
  Transaction, 
  Notification, 
  Recommendation, 
  Category,
  Activity,
  ItineraryDay
} from "@/app/datatypes";

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
          const data = error.response.data as any;
          let message = data?.message || error.message;
          
          // Handle NestJS error format
          if (Array.isArray(message)) {
            message = message.join(', ');
          } else if (data?.error) {
            message = data.error;
          }
          
          const err = new Error(message);
          (err as any).status = error.response.status;
          return Promise.reject(err);
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
  async register(data: { email: string; password: string; fullName: string; phone?: string }): Promise<any> {
    return this.client.post('/users/register', data);
  }

  async login(data: { email: string; password: string }): Promise<any> {
    return this.client.post('/users/login', data);
  }

  async getUser(id: string): Promise<User> {
    return this.client.get(`/users/${id}`);
  }

  async updateUser(id: string, data: any): Promise<any> {
    return this.client.patch(`/users/${id}`, data);
  }

  // Destinations
  async getDestinations(filters?: {
    city?: string;
    category?: string;
    featured?: boolean;
    search?: string;
    tags?: string[];
    themes?: string[];
  }): Promise<Destination[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.featured) params.append('featured', 'true');
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.themes?.length) params.append('themes', filters.themes.join(','));

    return this.client.get(`/destinations?${params.toString()}`);
  }

  async getDestination(id: string): Promise<Destination> {
    return this.client.get(`/destinations/${id}`);
  }

  // Itineraries
  async getItineraries(userId?: string): Promise<Itinerary[]> {
    const url = userId ? `/itineraries?userId=${userId}` : '/itineraries';
    return this.client.get(url);
  }

  async getItinerary(id: string): Promise<Itinerary> {
    return this.client.get(`/itineraries/${id}`);
  }

  async createItinerary(data: any): Promise<Itinerary> {
    return this.client.post('/itineraries', data);
  }

  async updateItinerary(id: string, data: any): Promise<Itinerary> {
    return this.client.patch(`/itineraries/${id}`, data);
  }

  async deleteItinerary(id: string): Promise<void> {
    return this.client.delete(`/itineraries/${id}`);
  }

  // Planner
  async getRecommendations(userId: string, filters?: {
    budget?: number;
    days?: number;
    interests?: string[];
    city?: string;
    themes?: string[];
    spots?: string[];
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.budget) params.append('budget', filters.budget.toString());
    if (filters?.days) params.append('days', filters.days.toString());
    if (filters?.interests) params.append('interests', filters.interests.join(','));
    if (filters?.city) params.append('city', filters.city);
    if (filters?.themes?.length) params.append('themes', filters.themes.join(','));
    if (filters?.spots?.length) params.append('spots', filters.spots.join(','));

    return this.client.get(`/planner/recommendations/${userId}?${params.toString()}`);
  }

  async calculateRoute(destinationIds: string[], startLocation?: { lat: number; lng: number }): Promise<any> {
    const params = new URLSearchParams();
    params.append('destinations', destinationIds.join(','));
    if (startLocation) {
      params.append('startLat', startLocation.lat.toString());
      params.append('startLng', startLocation.lng.toString());
    }

    return this.client.get(`/planner/route?${params.toString()}`);
  }

  // Budget
  async calculateBudgetBreakdown(itineraryId: string): Promise<any> {
    return this.client.get(`/budget/calculate/${itineraryId}`);
  }

  async getBudgets(userId: string): Promise<any> {
    return this.client.get(`/budget?userId=${userId}`);
  }

  async createBudget(data: any): Promise<any> {
    return this.client.post('/budget', data);
  }

  async updateBudget(id: string, data: any): Promise<any> {
    return this.client.patch(`/budget/${id}`, data);
  }

  // Generic fetch method (for compatibility with api.ts)
  async fetch<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body as string) : undefined;
    
    if (method === 'GET') {
      return this.client.get(path);
    } else if (method === 'POST') {
      return this.client.post(path, body);
    } else if (method === 'PATCH') {
      return this.client.patch(path, body);
    } else if (method === 'DELETE') {
      return this.client.delete(path);
    }
    
    return this.client.request({ method, url: path, data: body });
  }

  // User API methods (compatible with api.ts)
  async getUserById(id: string): Promise<User> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.client.get<User[]>(`/users/email/${encodeURIComponent(email)}`);
      return Array.isArray(users) && users.length > 0 ? users[0] : null;
    } catch (error: any) {
      if (error?.status === 404) return null;
      throw error;
    }
  }

  // Itinerary API methods
  async getItinerariesByUserId(userId: string): Promise<Itinerary[]> {
    return this.getItineraries(userId);
  }

  async addActivityToItinerary(
    itineraryId: string,
    dayNumber: number,
    activity: Activity
  ): Promise<Itinerary> {
    const itinerary = await this.getItinerary(itineraryId);
    const days = (itinerary as any).days || [];
    
    let dayIndex = days.findIndex((d: ItineraryDay) => (d as any).day === dayNumber);
    
    if (dayIndex === -1) {
      days.push({
        day: dayNumber,
        date: new Date((itinerary as any).startDate).toISOString().split('T')[0],
        activities: [activity]
      });
    } else {
      days[dayIndex].activities.push(activity);
    }
    
    return this.updateItinerary(itineraryId, { days } as any);
  }

  // Destination API methods
  async searchDestinations(searchTerm: string): Promise<Destination[]> {
    return this.client.get(`/destinations?q=${encodeURIComponent(searchTerm)}`);
  }

  async getFeaturedDestinations(): Promise<Destination[]> {
    return this.getDestinations({ featured: true });
  }

  // Weather API methods
  async getWeatherByCity(city: string): Promise<Weather | null> {
    try {
      const weather = await this.client.get<Weather[]>(`/weather?city=${city}`);
      return Array.isArray(weather) && weather.length > 0 ? weather[0] : null;
    } catch {
      return null;
    }
  }

  async getAllWeather(): Promise<Weather[]> {
    return this.client.get('/weather');
  }

  // Wallet API methods
  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    try {
      const wallets = await this.client.get<Wallet[]>(`/wallet?userId=${userId}`);
      return Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;
    } catch {
      return null;
    }
  }

  async updateWalletBalance(walletId: string, amount: number): Promise<Wallet> {
    const wallet = await this.client.get(`/wallet/${walletId}`);
    return this.client.patch(`/wallet/${walletId}`, {
      balance: (wallet as any).balance + amount
    });
  }

  async addCardToWallet(walletId: string, cardData: PaymentCard): Promise<Wallet> {
    const wallet = await this.client.get(`/wallet/${walletId}`);
    const cards = [...((wallet as any).cards || []), cardData];
    return this.client.patch(`/wallet/${walletId}`, { cards });
  }

  // Transaction API methods
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return this.client.get(`/transactions?userId=${userId}&_sort=date&_order=desc`);
  }

  async createTransaction(data: {
    userId: string;
    walletId: string;
    type: "expense" | "topup" | "refund";
    amount: number;
    description: string;
    category: Transaction["category"];
    itineraryId?: string;
    method?: Transaction["method"];
  }): Promise<Transaction> {
    return this.client.post('/transactions', {
      ...data,
      date: new Date().toISOString()
    });
  }

  async getTransactionById(id: string): Promise<Transaction> {
    return this.client.get(`/transactions/${id}`);
  }

  // Notification API methods
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return this.client.get(`/notifications?userId=${userId}&_sort=createdAt&_order=desc`);
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    return this.client.patch(`/notifications/${id}`, { read: true });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: Notification["type"];
    relatedId?: string;
    relatedType?: Notification["relatedType"];
  }): Promise<Notification> {
    return this.client.post('/notifications', {
      ...data,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  async deleteNotification(id: string): Promise<void> {
    return this.client.delete(`/notifications/${id}`);
  }

  // Recommendation API methods
  async getRecommendationsByUserId(userId: string): Promise<Recommendation[]> {
    const recommendations = await this.client.get(
      `/recommendations?userId=${userId}&_sort=priority&_order=asc`
    );

    // Fetch full destination details for each recommendation
    const withDestinations = await Promise.all(
      (recommendations as unknown as any[]).map(async (rec) => {
        try {
          const destination = await this.getDestination(rec.destinationId);
          return { ...rec, destination };
        } catch {
          return rec;
        }
      })
    );

    return withDestinations;
  }

  // Category API methods
  async getAllCategories(): Promise<Category[]> {
    return this.client.get('/categories');
  }

  async getCategoryById(id: string): Promise<Category> {
    return this.client.get(`/categories/${id}`);
  }
}

export const apiClient = new ApiClient();

// Export API object for compatibility with api.ts
export const api = {
  user: {
    getById: (id: string) => apiClient.getUserById(id),
    getByEmail: (email: string) => apiClient.getUserByEmail(email),
    create: (data: any) => apiClient.register(data),
    update: (id: string, data: any) => apiClient.updateUser(id, data),
    login: (email: string, password: string) => apiClient.login({ email, password }),
  },
  itinerary: {
    getByUserId: (userId: string) => apiClient.getItinerariesByUserId(userId),
    getById: (id: string) => apiClient.getItinerary(id),
    create: (data: any) => apiClient.createItinerary(data),
    update: (id: string, data: any) => apiClient.updateItinerary(id, data),
    delete: (id: string) => apiClient.deleteItinerary(id),
    addActivity: (itineraryId: string, dayNumber: number, activity: Activity) =>
      apiClient.addActivityToItinerary(itineraryId, dayNumber, activity),
  },
  destination: {
    getAll: (filters?: any) => apiClient.getDestinations(filters),
    getById: (id: string) => apiClient.getDestination(id),
    search: (query: string) => apiClient.searchDestinations(query),
    getFeatured: () => apiClient.getFeaturedDestinations(),
  },
  weather: {
    getByCity: (city: string) => apiClient.getWeatherByCity(city),
    getAll: () => apiClient.getAllWeather(),
  },
  wallet: {
    getByUserId: (userId: string) => apiClient.getWalletByUserId(userId),
    updateBalance: (walletId: string, amount: number) => apiClient.updateWalletBalance(walletId, amount),
    addCard: (walletId: string, cardData: PaymentCard) => apiClient.addCardToWallet(walletId, cardData),
  },
  transaction: {
    getByUserId: (userId: string) => apiClient.getTransactionsByUserId(userId),
    create: (data: any) => apiClient.createTransaction(data),
    getById: (id: string) => apiClient.getTransactionById(id),
  },
  notification: {
    getByUserId: (userId: string) => apiClient.getNotificationsByUserId(userId),
    markAsRead: (id: string) => apiClient.markNotificationAsRead(id),
    create: (data: any) => apiClient.createNotification(data),
    delete: (id: string) => apiClient.deleteNotification(id),
  },
  recommendation: {
    getByUserId: (userId: string) => apiClient.getRecommendationsByUserId(userId),
  },
  category: {
    getAll: () => apiClient.getAllCategories(),
    getById: (id: string) => apiClient.getCategoryById(id),
  },
};

// Export apiFetch for compatibility
export const apiFetch = <T = any>(path: string, opts: RequestInit = {}): Promise<T> => {
  return apiClient.fetch<T>(path, opts);
};

// Export userAPI for compatibility
export const userAPI = api.user;

export default apiClient;
