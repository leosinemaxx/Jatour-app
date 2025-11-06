// App Configuration
export const APP_NAME = "JaTour";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "Your travel planning companion";

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const API_TIMEOUT = 10000; // 10 seconds

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: "jatour_auth",
  THEME: "jatour_theme",
  LANGUAGE: "jatour_language",
  RECENT_SEARCHES: "jatour_recent_searches",
  FAVORITES: "jatour_favorites",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  PROFILE: "/dashboard/profile",
  ITINERARY: "/dashboard/itinerary",
  EXPLORE: "/dashboard/explore",
  WALLET: "/dashboard/wallet",
  SETTINGS: "/dashboard/settings",
} as const;

// Navigation Items
export const NAV_ITEMS = [
  {
    id: "home",
    label: "Beranda",
    icon: "Home",
    route: "home",
  },
  {
    id: "explore",
    label: "Eksplor",
    icon: "Search",
    route: "explore",
  },
  {
    id: "itinerary",
    label: "Jadwalku",
    icon: "Calendar",
    route: "itinerary",
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: "Wallet",
    route: "wallet",
  },
  {
    id: "settings",
    label: "Akun",
    icon: "User",
    route: "settings",
  },
] as const;

// Destination Categories
export const DESTINATION_CATEGORIES = [
  { id: "all", name: "Semua", icon: "Grid" },
  { id: "Beach", name: "Pantai", icon: "Waves" },
  { id: "Mountain", name: "Gunung", icon: "Mountain" },
  { id: "Temple", name: "Candi", icon: "Church" },
  { id: "Nature", name: "Alam", icon: "Trees" },
  { id: "Park", name: "Taman", icon: "TreePine" },
  { id: "Shopping", name: "Belanja", icon: "ShoppingBag" },
  { id: "Museum", name: "Museum", icon: "Building" },
  { id: "Restaurant", name: "Kuliner", icon: "UtensilsCrossed" },
] as const;

// Quick Access Items (for home page)
export const QUICK_ACCESS_ITEMS = [
  {
    id: "travel-card",
    label: "Travel Card",
    icon: "CreditCard",
    color: "#3B82F6",
  },
  {
    id: "balance",
    label: "Balance and Point",
    icon: "Wallet",
    color: "#10B981",
  },
  {
    id: "ektp",
    label: "E-KTP and Sim",
    icon: "IdCard",
    color: "#F59E0B",
  },
  {
    id: "record",
    label: "Record",
    icon: "FileText",
    color: "#8B5CF6",
  },
] as const;

// Activity Categories
export const ACTIVITY_CATEGORIES = [
  { id: "sightseeing", name: "Wisata", icon: "Camera", color: "#3B82F6" },
  { id: "food", name: "Kuliner", icon: "UtensilsCrossed", color: "#EF4444" },
  { id: "accommodation", name: "Akomodasi", icon: "Hotel", color: "#8B5CF6" },
  { id: "transport", name: "Transportasi", icon: "Car", color: "#10B981" },
  { id: "other", name: "Lainnya", icon: "MoreHorizontal", color: "#6B7280" },
] as const;

// Transaction Categories
export const TRANSACTION_CATEGORIES = [
  { id: "accommodation", name: "Akomodasi", icon: "Hotel" },
  { id: "transport", name: "Transportasi", icon: "Car" },
  { id: "food", name: "Makanan & Minuman", icon: "UtensilsCrossed" },
  { id: "tickets", name: "Tiket", icon: "Ticket" },
  { id: "shopping", name: "Belanja", icon: "ShoppingBag" },
  { id: "topup", name: "Top Up", icon: "Plus" },
  { id: "other", name: "Lainnya", icon: "MoreHorizontal" },
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  {
    id: "gopay",
    name: "GoPay",
    icon: "/payment/gopay.png",
    color: "#00AA13",
  },
  {
    id: "ovo",
    name: "OVO",
    icon: "/payment/ovo.png",
    color: "#4C3494",
  },
  {
    id: "dana",
    name: "DANA",
    icon: "/payment/dana.png",
    color: "#118EEA",
  },
  {
    id: "bank_transfer",
    name: "Transfer Bank",
    icon: "/payment/bank.png",
    color: "#1E40AF",
  },
] as const;

// Weather Conditions
export const WEATHER_CONDITIONS = {
  "Clear": { icon: "Sun", color: "#F59E0B" },
  "Partly Cloudy": { icon: "CloudSun", color: "#6B7280" },
  "Cloudy": { icon: "Cloud", color: "#9CA3AF" },
  "Rainy": { icon: "CloudRain", color: "#3B82F6" },
  "Stormy": { icon: "CloudLightning", color: "#7C3AED" },
  "Snowy": { icon: "Snowflake", color: "#60A5FA" },
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  reminder: { icon: "Bell", color: "#3B82F6" },
  transaction: { icon: "Wallet", color: "#10B981" },
  promotion: { icon: "Tag", color: "#F59E0B" },
  system: { icon: "Settings", color: "#6B7280" },
  social: { icon: "Users", color: "#8B5CF6" },
} as const;

// Itinerary Status
export const ITINERARY_STATUS = {
  upcoming: { label: "Akan Datang", color: "#3B82F6", icon: "Clock" },
  ongoing: { label: "Sedang Berjalan", color: "#10B981", icon: "Play" },
  completed: { label: "Selesai", color: "#6B7280", icon: "Check" },
  cancelled: { label: "Dibatalkan", color: "#EF4444", icon: "X" },
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: "DD MMM",
  MEDIUM: "DD MMM YYYY",
  LONG: "dddd, DD MMMM YYYY",
  TIME: "HH:mm",
  DATETIME: "DD MMM YYYY HH:mm",
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Email tidak valid",
  },
  PHONE: {
    pattern: /^(\+62|62|0)[0-9]{9,12}$/,
    message: "Nomor telepon tidak valid",
  },
  PASSWORD: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: "Password harus minimal 8 karakter, mengandung huruf besar, kecil, dan angka",
  },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Image Placeholders
export const PLACEHOLDERS = {
  USER_AVATAR: "/avatars/default.jpg",
  DESTINATION: "/placeholder-destination.jpg",
  NO_IMAGE: "/no-image.png",
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: -7.2575, lng: 112.7521 }, // Surabaya
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 5,
  MAX_ZOOM: 18,
} as const;

// Currency
export const CURRENCY = {
  IDR: {
    symbol: "Rp",
    code: "IDR",
    locale: "id-ID",
  },
  USD: {
    symbol: "$",
    code: "USD",
    locale: "en-US",
  },
} as const;

// Languages
export const LANGUAGES = [
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", name: "English", flag: "🇬🇧" },
] as const;

// Themes
export const THEMES = [
  { id: "light", name: "Terang", icon: "Sun" },
  { id: "dark", name: "Gelap", icon: "Moon" },
  { id: "auto", name: "Otomatis", icon: "Laptop" },
] as const;

// Rating Thresholds
export const RATING_THRESHOLDS = {
  EXCELLENT: 4.5,
  GOOD: 4.0,
  AVERAGE: 3.5,
  POOR: 3.0,
} as const;

// Price Ranges (for filtering)
export const PRICE_RANGES = [
  { id: "free", label: "Gratis", min: 0, max: 0 },
  { id: "budget", label: "Budget (< 100K)", min: 0, max: 100000 },
  { id: "moderate", label: "Moderate (100K - 500K)", min: 100000, max: 500000 },
  { id: "premium", label: "Premium (> 500K)", min: 500000, max: Infinity },
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
  UNAUTHORIZED: "Anda harus login untuk mengakses halaman ini.",
  FORBIDDEN: "Anda tidak memiliki izin untuk mengakses halaman ini.",
  NOT_FOUND: "Halaman yang Anda cari tidak ditemukan.",
  SERVER_ERROR: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
  VALIDATION: "Data yang Anda masukkan tidak valid.",
  GENERIC: "Terjadi kesalahan. Silakan coba lagi.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Login berhasil!",
  SIGNUP: "Akun berhasil dibuat!",
  UPDATE: "Data berhasil diperbarui!",
  DELETE: "Data berhasil dihapus!",
  CREATE: "Data berhasil dibuat!",
  SAVE: "Data berhasil disimpan!",
} as const;

// Export all constants
export default {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  API_BASE_URL,
  API_TIMEOUT,
  STORAGE_KEYS,
  ROUTES,
  NAV_ITEMS,
  DESTINATION_CATEGORIES,
  QUICK_ACCESS_ITEMS,
  ACTIVITY_CATEGORIES,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS,
  WEATHER_CONDITIONS,
  NOTIFICATION_TYPES,
  ITINERARY_STATUS,
  DATE_FORMATS,
  VALIDATION,
  PAGINATION,
  PLACEHOLDERS,
  MAP_CONFIG,
  CURRENCY,
  LANGUAGES,
  THEMES,
  RATING_THRESHOLDS,
  PRICE_RANGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
