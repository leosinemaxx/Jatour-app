/**
 * Transportation Utility Functions
 * Helper functions for working with transportation data
 */

import { EAST_JAVA_CITIES, INDONESIAN_AIRPORTS } from "./mock-transportation-data";

/**
 * Get city information by name
 */
export function getCityInfo(cityName: string) {
  const normalizedName = cityName.trim();
  
  for (const [name, data] of Object.entries(EAST_JAVA_CITIES)) {
    if (name.toLowerCase() === normalizedName.toLowerCase()) {
      return { name, ...data };
    }
  }
  
  return null;
}

/**
 * Get airport information by city name
 */
export function getAirportByCity(cityName: string) {
  for (const [name, data] of Object.entries(INDONESIAN_AIRPORTS)) {
    if (data.city.toLowerCase() === cityName.toLowerCase()) {
      return { airportName: name, ...data };
    }
  }
  
  return null;
}

/**
 * Check if a city has an airport
 */
export function hasAirport(cityName: string): boolean {
  return getAirportByCity(cityName) !== null;
}

/**
 * Get all cities in East Java
 */
export function getAllEastJavaCities() {
  return Object.keys(EAST_JAVA_CITIES).map(name => ({
    name,
    ...EAST_JAVA_CITIES[name as keyof typeof EAST_JAVA_CITIES],
  }));
}

/**
 * Get all airports
 */
export function getAllAirports() {
  return Object.entries(INDONESIAN_AIRPORTS).map(([name, data]) => ({
    airportName: name,
    ...data,
  }));
}

/**
 * Format price in Indonesian Rupiah
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Format duration nicely
 */
export function formatDuration(duration: string): string {
  return duration; // Already formatted by mock service
}

/**
 * Calculate estimated arrival time
 */
export function calculateArrivalTime(
  departureTime: string,
  duration: string
): string {
  // Parse duration (e.g., "2h 30m" or "120 minutes")
  const durationMatch = duration.match(/(\d+)h\s*(\d+)m|(\d+)\s*minutes?/);
  if (!durationMatch) return "N/A";
  
  const hours = parseInt(durationMatch[1] || "0");
  const minutes = parseInt(durationMatch[2] || durationMatch[3] || "0");
  
  // Parse departure time (e.g., "08:00")
  const [depHours, depMinutes] = departureTime.split(":").map(Number);
  
  let arrHours = depHours + hours;
  let arrMinutes = depMinutes + minutes;
  
  if (arrMinutes >= 60) {
    arrHours += Math.floor(arrMinutes / 60);
    arrMinutes = arrMinutes % 60;
  }
  
  if (arrHours >= 24) {
    arrHours = arrHours % 24;
  }
  
  return `${arrHours.toString().padStart(2, "0")}:${arrMinutes.toString().padStart(2, "0")}`;
}

/**
 * Get transport type icon/emoji
 */
export function getTransportIcon(type: string): string {
  switch (type) {
    case "train":
      return "🚂";
    case "bus":
      return "🚌";
    case "plane":
      return "✈️";
    case "ferry":
      return "⛴️";
    case "taxi":
      return "🚕";
    case "ride-hail":
      return "🚗";
    default:
      return "📍";
  }
}

/**
 * Get transport type color (for UI)
 */
export function getTransportColor(type: string): string {
  switch (type) {
    case "train":
      return "bg-blue-500";
    case "bus":
      return "bg-green-500";
    case "plane":
      return "bg-purple-500";
    case "ferry":
      return "bg-cyan-500";
    case "taxi":
      return "bg-yellow-500";
    case "ride-hail":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}

