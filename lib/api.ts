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

// Base API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Generic API fetch utility
export async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  
  return res.json();
}

// ===== USER APIs =====
export const userAPI = {
  // Get user by ID
  getById: (id: string): Promise<User> => apiFetch<User>(`/users/${id}`),
  
  // Get user by email
  getByEmail: async (email: string): Promise<User | null> => {
    const users = await apiFetch<User[]>(`/users?email=${email}`);
    return users[0] || null;
  },
  
  // Create new user
  create: (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }): Promise<User> => apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify({
      ...userData,
      profilePicture: "/avatars/default.jpg",
      preferences: {
        language: "id" as const,
        notifications: true,
        theme: "light" as const
      },
      createdAt: new Date().toISOString()
    })
  }),
  
  // Update user
  update: (id: string, userData: Partial<User>): Promise<User> => 
    apiFetch<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(userData)
    }),
  
  // Login - calls the backend API which handles bcrypt password verification
  login: async (email: string, password: string): Promise<User> => {
    return apiFetch<User>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
};

// ===== ITINERARY APIs =====
export const itineraryAPI = {
  // Get all itineraries for a user
  getByUserId: (userId: string): Promise<Itinerary[]> => 
    apiFetch<Itinerary[]>(`/itineraries?userId=${userId}`),
  
  // Get itinerary by ID
  getById: (id: string): Promise<Itinerary> => apiFetch<Itinerary>(`/itineraries/${id}`),
  
  // Create new itinerary
  create: (itineraryData: {
    userId: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    thumbnail?: string;
  }): Promise<Itinerary> => apiFetch<Itinerary>("/itineraries", {
    method: "POST",
    body: JSON.stringify({
      ...itineraryData,
      status: "upcoming" as const,
      days: [],
      createdAt: new Date().toISOString()
    })
  }),
  
  // Update itinerary
  update: (id: string, data: Partial<Itinerary>): Promise<Itinerary> =>
    apiFetch<Itinerary>(`/itineraries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  
  // Delete itinerary
  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/itineraries/${id}`, { method: "DELETE" }),
  
  // Add activity to a day
  addActivity: async (
    itineraryId: string,
    dayNumber: number,
    activity: Activity
  ): Promise<Itinerary> => {
    const itinerary = await itineraryAPI.getById(itineraryId);
    const days = itinerary.days || [];
    
    let dayIndex = days.findIndex((d: ItineraryDay) => d.day === dayNumber);
    
    if (dayIndex === -1) {
      days.push({
        day: dayNumber,
        date: new Date(itinerary.startDate).toISOString().split('T')[0],
        activities: [activity]
      });
    } else {
      days[dayIndex].activities.push(activity);
    }
    
    return itineraryAPI.update(itineraryId, { days });
  }
};

// ===== DESTINATION APIs =====
export const destinationAPI = {
  // Get all destinations
  getAll: (params?: { 
    city?: string; 
    category?: string;
    featured?: boolean;
  }): Promise<Destination[]> => {
    const query = new URLSearchParams();
    if (params?.city) query.append("city", params.city);
    if (params?.category) query.append("category", params.category);
    if (params?.featured !== undefined) query.append("featured", String(params.featured));
    
    const queryString = query.toString();
    return apiFetch<Destination[]>(`/destinations${queryString ? `?${queryString}` : ""}`);
  },
  
  // Get destination by ID
  getById: (id: string): Promise<Destination> => apiFetch<Destination>(`/destinations/${id}`),
  
  // Search destinations
  search: (searchTerm: string): Promise<Destination[]> =>
    apiFetch<Destination[]>(`/destinations?q=${encodeURIComponent(searchTerm)}`),
  
  // Get featured destinations
  getFeatured: (): Promise<Destination[]> => apiFetch<Destination[]>("/destinations?featured=true"),
};

// ===== WEATHER APIs =====
export const weatherAPI = {
  // Get weather by city
  getByCity: async (city: string): Promise<Weather | null> => {
    const weather = await apiFetch<Weather[]>(`/weather?city=${city}`);
    return weather[0] || null;
  },
  
  // Get all weather data
  getAll: (): Promise<Weather[]> => apiFetch<Weather[]>("/weather"),
};

// ===== WALLET APIs =====
export const walletAPI = {
  // Get wallet by user ID
  getByUserId: async (userId: string): Promise<Wallet | null> => {
    const wallets = await apiFetch<Wallet[]>(`/wallet?userId=${userId}`);
    return wallets[0] || null;
  },
  
  // Update wallet balance
  updateBalance: async (walletId: string, amount: number): Promise<Wallet> => {
    const wallet = await apiFetch<Wallet>(`/wallet/${walletId}`);
    return apiFetch<Wallet>(`/wallet/${walletId}`, {
      method: "PATCH",
      body: JSON.stringify({
        balance: wallet.balance + amount
      })
    });
  },
  
  // Add card
  addCard: async (walletId: string, cardData: PaymentCard): Promise<Wallet> => {
    const wallet = await apiFetch<Wallet>(`/wallet/${walletId}`);
    const cards = [...wallet.cards, cardData];
    return apiFetch<Wallet>(`/wallet/${walletId}`, {
      method: "PATCH",
      body: JSON.stringify({ cards })
    });
  }
};

// ===== TRANSACTION APIs =====
export const transactionAPI = {
  // Get transactions by user ID
  getByUserId: (userId: string): Promise<Transaction[]> =>
    apiFetch<Transaction[]>(`/transactions?userId=${userId}&_sort=date&_order=desc`),
  
  // Create transaction
  create: (transactionData: {
    userId: string;
    walletId: string;
    type: "expense" | "topup" | "refund";
    amount: number;
    description: string;
    category: Transaction["category"];
    itineraryId?: string;
    method?: Transaction["method"];
  }): Promise<Transaction> => apiFetch<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      ...transactionData,
      date: new Date().toISOString()
    })
  }),
  
  // Get transaction by ID
  getById: (id: string): Promise<Transaction> => apiFetch<Transaction>(`/transactions/${id}`),
};

// ===== NOTIFICATION APIs =====
export const notificationAPI = {
  // Get notifications by user ID
  getByUserId: (userId: string): Promise<Notification[]> =>
    apiFetch<Notification[]>(`/notifications?userId=${userId}&_sort=createdAt&_order=desc`),
  
  // Mark as read
  markAsRead: (id: string): Promise<Notification> =>
    apiFetch<Notification>(`/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ read: true })
    }),
  
  // Create notification
  create: (notificationData: {
    userId: string;
    title: string;
    message: string;
    type: Notification["type"];
    relatedId?: string;
    relatedType?: Notification["relatedType"];
  }): Promise<Notification> => apiFetch<Notification>("/notifications", {
    method: "POST",
    body: JSON.stringify({
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    })
  }),
  
  // Delete notification
  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/notifications/${id}`, { method: "DELETE" }),
};

// ===== RECOMMENDATION APIs =====
export const recommendationAPI = {
  // Get recommendations by user ID
  getByUserId: async (userId: string): Promise<Recommendation[]> => {
    const recommendations = await apiFetch<Recommendation[]>(
      `/recommendations?userId=${userId}&_sort=priority&_order=asc`
    );
    
    // Fetch full destination details for each recommendation
    const withDestinations = await Promise.all(
      recommendations.map(async (rec) => {
        const destination = await destinationAPI.getById(rec.destinationId);
        return { ...rec, destination };
      })
    );
    
    return withDestinations;
  },
};

// ===== CATEGORY APIs =====
export const categoryAPI = {
  // Get all categories
  getAll: (): Promise<Category[]> => apiFetch<Category[]>("/categories"),
  
  // Get category by ID
  getById: (id: string): Promise<Category> => apiFetch<Category>(`/categories/${id}`),
};

// Export default object with all APIs
export default {
  user: userAPI,
  itinerary: itineraryAPI,
  destination: destinationAPI,
  weather: weatherAPI,
  wallet: walletAPI,
  transaction: transactionAPI,
  notification: notificationAPI,
  recommendation: recommendationAPI,
  category: categoryAPI,
};
