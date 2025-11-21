/**
 * OpenStreetMap Routing Service
 * Uses OpenStreetMap's Nominatim API for geocoding and routing
 * No API key required - completely free!
 */

import axios from "axios";

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

interface RouteSegment {
  distance: number; // in km
  duration: number; // in minutes
  geometry: Array<{ lat: number; lng: number }>;
}

interface RouteResult {
  distance: number; // total distance in km
  duration: number; // total duration in minutes
  segments: RouteSegment[];
  geometry: Array<{ lat: number; lng: number }>;
}

/**
 * Geocode address using OpenStreetMap Nominatim (free, no API key)
 */
export async function geocodeAddress(address: string): Promise<RoutePoint | null> {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        limit: 1,
        countrycodes: "id", // Indonesia
      },
      headers: {
        "User-Agent": "JaTour App", // Required by Nominatim
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        lat,
        lon: lng,
        format: "json",
      },
      headers: {
        "User-Agent": "JaTour App",
      },
    });

    if (response.data && response.data.address) {
      const addr = response.data.address;
      return `${addr.road || ""} ${addr.city || addr.town || addr.village || ""}`.trim();
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Calculate route using OpenRouteService (free alternative to Google Directions)
 * Uses OpenStreetMap data
 */
export async function calculateRoute(
  from: RoutePoint,
  to: RoutePoint,
  profile: "driving" | "cycling" | "walking" = "driving"
): Promise<RouteResult | null> {
  try {
    // Using OpenRouteService API (free, uses OpenStreetMap data)
    // No API key required for basic usage, but rate limited
    const response = await axios.get(
      `https://api.openrouteservice.org/v2/directions/${profile}`,
      {
        params: {
          api_key: process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY || "", // Optional, works without key but limited
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.features && response.data.features.length > 0) {
      const route = response.data.features[0];
      const properties = route.properties;
      const geometry = route.geometry.coordinates.map((coord: number[]) => ({
        lng: coord[0],
        lat: coord[1],
      }));

      return {
        distance: properties.segments
          ? properties.segments.reduce((sum: number, seg: any) => sum + seg.distance, 0) / 1000
          : properties.distance / 1000,
        duration: properties.segments
          ? properties.segments.reduce((sum: number, seg: any) => sum + seg.duration, 0) / 60
          : properties.duration / 60,
        segments: properties.segments || [],
        geometry,
      };
    }
    return null;
  } catch (error) {
    console.error("Routing error:", error);
    // Fallback to simple distance calculation
    return calculateSimpleRoute(from, to);
  }
}

/**
 * Simple route calculation using Haversine formula (fallback)
 */
function calculateSimpleRoute(from: RoutePoint, to: RoutePoint): RouteResult {
  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Estimate duration based on average speed (60 km/h for driving)
  const duration = (distance / 60) * 60; // in minutes

  return {
    distance: Math.round(distance * 10) / 10,
    duration: Math.round(duration),
    segments: [],
    geometry: [
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
    ],
  };
}

/**
 * Calculate route for multiple waypoints
 */
export async function calculateMultiPointRoute(
  waypoints: RoutePoint[],
  profile: "driving" | "cycling" | "walking" = "driving"
): Promise<RouteResult | null> {
  if (waypoints.length < 2) {
    return null;
  }

  let totalDistance = 0;
  let totalDuration = 0;
  const allGeometry: Array<{ lat: number; lng: number }> = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = await calculateRoute(waypoints[i], waypoints[i + 1], profile);
    if (segment) {
      totalDistance += segment.distance;
      totalDuration += segment.duration;
      if (i === 0) {
        allGeometry.push(...segment.geometry);
      } else {
        // Skip first point to avoid duplicates
        allGeometry.push(...segment.geometry.slice(1));
      }
    }
  }

  return {
    distance: Math.round(totalDistance * 10) / 10,
    duration: Math.round(totalDuration),
    segments: [],
    geometry: allGeometry,
  };
}

