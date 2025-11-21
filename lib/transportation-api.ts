/**
 * Public Transportation API Client for Indonesia
 * Integrates with Gojek, Traveloka, RedBus, Grab, Bluebird, and other transportation APIs
 * Uses powerful mock data service with OpenStreetMap integration for realistic routes
 */

import axios from "axios";
import {
  generateMockTrainRoutes,
  generateMockBusRoutes,
  generateMockFlightRoutes,
  generateMockFerryRoutes,
  generateMockRideHail,
  getAllMockRoutes,
  EAST_JAVA_CITIES,
  INDONESIAN_AIRPORTS,
} from "./mock-transportation-data";
import { calculateRoute, geocodeAddress } from "./openstreetmap-routing";

interface TransportationRoute {
  from: { name: string; coordinates: { lat: number; lng: number } };
  to: { name: string; coordinates: { lat: number; lng: number } };
  type: "train" | "bus" | "plane" | "ferry" | "taxi" | "ride-hail" | "shuttle";
  duration: string;
  price: number;
  operator: string;
  schedule: string[];
  provider?: string; // API provider name
  estimatedArrival?: string;
  vehicleType?: string;
}

interface RideHailOptions {
  from: { name: string; coordinates: { lat: number; lng: number } };
  to: { name: string; coordinates: { lat: number; lng: number } };
  vehicleType?: "car" | "motorcycle" | "taxi";
}

class TransportationAPI {
  private gojekApiKey = process.env.NEXT_PUBLIC_GOJEK_API_KEY || "";
  private gojekApiUrl = process.env.NEXT_PUBLIC_GOJEK_API_URL || "https://api.gojek.com";
  
  private travelokaApiKey = process.env.NEXT_PUBLIC_TRAVELOKA_API_KEY || "";
  private travelokaApiUrl = process.env.NEXT_PUBLIC_TRAVELOKA_API_URL || "https://api.traveloka.com";
  
  private redbusApiKey = process.env.NEXT_PUBLIC_REDBUS_API_KEY || "";
  private redbusApiUrl = process.env.NEXT_PUBLIC_REDBUS_API_URL || "https://api.redbus.id";
  
  private grabApiKey = process.env.NEXT_PUBLIC_GRAB_API_KEY || "";
  private grabApiUrl = process.env.NEXT_PUBLIC_GRAB_API_URL || "https://partner-api.grab.com";
  
  private bluebirdApiKey = process.env.NEXT_PUBLIC_BLUEBIRD_API_KEY || "";
  private bluebirdApiUrl = process.env.NEXT_PUBLIC_BLUEBIRD_API_URL || "https://api.bluebirdgroup.com";

  /**
   * Get ride-hailing options from Gojek
   */
  async getGojekRides(options: RideHailOptions): Promise<TransportationRoute[]> {
    if (!this.gojekApiKey) {
      return this.getMockRideHail(options, "Gojek");
    }

    try {
      const response = await axios.get(`${this.gojekApiUrl}/v1/ride-estimates`, {
        headers: {
          "Authorization": `Bearer ${this.gojekApiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          origin: `${options.from.coordinates.lat},${options.from.coordinates.lng}`,
          destination: `${options.to.coordinates.lat},${options.to.coordinates.lng}`,
          vehicleType: options.vehicleType || "car",
        },
      });

      return response.data.rides.map((ride: any) => ({
        from: options.from,
        to: options.to,
        type: "ride-hail" as const,
        duration: ride.estimated_duration || "N/A",
        price: ride.price || 0,
        operator: "Gojek",
        schedule: [],
        provider: "Gojek",
        vehicleType: ride.vehicle_type,
        estimatedArrival: ride.estimated_arrival,
      }));
    } catch (error) {
      console.error("Gojek API error:", error);
      return this.getMockRideHail(options, "Gojek");
    }
  }

  /**
   * Get ride-hailing options from Grab
   */
  async getGrabRides(options: RideHailOptions): Promise<TransportationRoute[]> {
    if (!this.grabApiKey) {
      return this.getMockRideHail(options, "Grab");
    }

    try {
      const response = await axios.post(
        `${this.grabApiUrl}/v1/ride-estimates`,
        {
          origin: {
            latitude: options.from.coordinates.lat,
            longitude: options.from.coordinates.lng,
          },
          destination: {
            latitude: options.to.coordinates.lat,
            longitude: options.to.coordinates.lng,
          },
          vehicleType: options.vehicleType || "car",
        },
        {
          headers: {
            "Authorization": `Bearer ${this.grabApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.rides.map((ride: any) => ({
        from: options.from,
        to: options.to,
        type: "ride-hail" as const,
        duration: ride.estimated_duration || "N/A",
        price: ride.price || 0,
        operator: "Grab",
        schedule: [],
        provider: "Grab",
        vehicleType: ride.vehicle_type,
        estimatedArrival: ride.estimated_arrival,
      }));
    } catch (error) {
      console.error("Grab API error:", error);
      return this.getMockRideHail(options, "Grab");
    }
  }

  /**
   * Get taxi options from Bluebird
   */
  async getBluebirdTaxis(options: RideHailOptions): Promise<TransportationRoute[]> {
    if (!this.bluebirdApiKey) {
      return this.getMockRideHail(options, "Bluebird");
    }

    try {
      const response = await axios.get(`${this.bluebirdApiUrl}/v1/taxi-estimates`, {
        headers: {
          "Authorization": `Bearer ${this.bluebirdApiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          origin: `${options.from.coordinates.lat},${options.from.coordinates.lng}`,
          destination: `${options.to.coordinates.lat},${options.to.coordinates.lng}`,
        },
      });

      return response.data.taxis.map((taxi: any) => ({
        from: options.from,
        to: options.to,
        type: "taxi" as const,
        duration: taxi.estimated_duration || "N/A",
        price: taxi.estimated_fare || 0,
        operator: "Bluebird",
        schedule: [],
        provider: "Bluebird",
        vehicleType: "taxi",
        estimatedArrival: taxi.estimated_arrival,
      }));
    } catch (error) {
      console.error("Bluebird API error:", error);
      return this.getMockRideHail(options, "Bluebird");
    }
  }

  /**
   * Get train routes using Traveloka API (with powerful mock fallback)
   */
  async getTrainRoutes(
    from: string,
    to: string,
    date?: string
  ): Promise<TransportationRoute[]> {
    // Try real API first
    if (this.travelokaApiKey) {
      try {
        const response = await axios.get(`${this.travelokaApiUrl}/v1/train/search`, {
          headers: {
            "Authorization": `Bearer ${this.travelokaApiKey}`,
            "Content-Type": "application/json",
          },
          params: {
            origin: from,
            destination: to,
            departureDate: date || new Date().toISOString().split("T")[0],
          },
        });

        return response.data.routes.map((route: any) => ({
          from: { name: route.origin, coordinates: route.originCoords || { lat: -7.2575, lng: 112.7521 } },
          to: { name: route.destination, coordinates: route.destCoords || { lat: -7.9797, lng: 112.6304 } },
          type: "train" as const,
          duration: route.duration || "N/A",
          price: route.price || 0,
          operator: route.operator || "KAI",
          schedule: route.schedules || [],
          provider: "Traveloka",
        }));
      } catch (error) {
        console.error("Traveloka Train API error:", error);
        // Fall through to mock data
      }
    }

    // Use powerful mock data service
    const mockRoutes = generateMockTrainRoutes(from, to);
    return mockRoutes.map(route => ({
      from: route.from,
      to: route.to,
      type: route.type,
      duration: route.duration,
      price: route.price,
      operator: route.operator,
      schedule: route.schedule,
      provider: route.provider,
      estimatedArrival: route.estimatedArrival,
    }));
  }

  /**
   * Get bus routes using RedBus or Traveloka API
   */
  async getBusRoutes(
    from: string,
    to: string,
    date?: string
  ): Promise<TransportationRoute[]> {
    const routes: TransportationRoute[] = [];

    // Try RedBus first
    if (this.redbusApiKey) {
      try {
        const response = await axios.get(`${this.redbusApiUrl}/v1/bus/search`, {
          headers: {
            "Authorization": `Bearer ${this.redbusApiKey}`,
            "Content-Type": "application/json",
          },
          params: {
            origin: from,
            destination: to,
            departureDate: date || new Date().toISOString().split("T")[0],
          },
        });

        routes.push(...response.data.routes.map((route: any) => ({
          from: { name: route.origin, coordinates: route.originCoords || { lat: -7.2575, lng: 112.7521 } },
          to: { name: route.destination, coordinates: route.destCoords || { lat: -7.9797, lng: 112.6304 } },
          type: "bus" as const,
          duration: route.duration || "N/A",
          price: route.price || 0,
          operator: route.operator || "Unknown",
          schedule: route.schedules || [],
          provider: "RedBus",
        })));
      } catch (error) {
        console.error("RedBus API error:", error);
      }
    }

    // Try Traveloka as fallback
    if (this.travelokaApiKey && routes.length === 0) {
      try {
        const response = await axios.get(`${this.travelokaApiUrl}/v1/bus/search`, {
          headers: {
            "Authorization": `Bearer ${this.travelokaApiKey}`,
            "Content-Type": "application/json",
          },
          params: {
            origin: from,
            destination: to,
            departureDate: date || new Date().toISOString().split("T")[0],
          },
        });

        routes.push(...response.data.routes.map((route: any) => ({
          from: { name: route.origin, coordinates: route.originCoords || { lat: -7.2575, lng: 112.7521 } },
          to: { name: route.destination, coordinates: route.destCoords || { lat: -7.9797, lng: 112.6304 } },
          type: "bus" as const,
          duration: route.duration || "N/A",
          price: route.price || 0,
          operator: route.operator || "Unknown",
          schedule: route.schedules || [],
          provider: "Traveloka",
        })));
      } catch (error) {
        console.error("Traveloka Bus API error:", error);
      }
    }

    // Use powerful mock data service if no APIs available
    if (routes.length === 0) {
      const mockRoutes = generateMockBusRoutes(from, to);
      return mockRoutes.map(route => ({
        from: route.from,
        to: route.to,
        type: route.type,
        duration: route.duration,
        price: route.price,
        operator: route.operator,
        schedule: route.schedule,
        provider: route.provider,
        estimatedArrival: route.estimatedArrival,
      }));
    }

    return routes;
  }

  /**
   * Get flight routes using Traveloka API (with powerful mock fallback)
   */
  async getFlightRoutes(
    from: string,
    to: string,
    date?: string
  ): Promise<TransportationRoute[]> {
    // Try real API first
    if (this.travelokaApiKey) {
      try {
        const response = await axios.get(`${this.travelokaApiUrl}/v1/flight/search`, {
          headers: {
            "Authorization": `Bearer ${this.travelokaApiKey}`,
            "Content-Type": "application/json",
          },
          params: {
            origin: from,
            destination: to,
            departureDate: date || new Date().toISOString().split("T")[0],
          },
        });

        return response.data.routes.map((route: any) => ({
          from: { name: route.origin, coordinates: route.originCoords || { lat: -7.2575, lng: 112.7521 } },
          to: { name: route.destination, coordinates: route.destCoords || { lat: -6.2088, lng: 106.8456 } },
          type: "plane" as const,
          duration: route.duration || "N/A",
          price: route.price || 0,
          operator: route.airline || "Unknown",
          schedule: route.schedules || [],
          provider: "Traveloka",
        }));
      } catch (error) {
        console.error("Traveloka Flight API error:", error);
        // Fall through to mock data
      }
    }

    // Use powerful mock data service with airport connections
    const mockRoutes = generateMockFlightRoutes(from, to);
    return mockRoutes.map(route => ({
      from: route.from,
      to: route.to,
      type: route.type,
      duration: route.duration,
      price: route.price,
      operator: route.operator,
      schedule: route.schedule,
      provider: route.provider,
      estimatedArrival: route.estimatedArrival,
    }));
  }

  /**
   * Get ferry routes (with powerful mock service)
   */
  async getFerryRoutes(
    from: string,
    to: string,
    date?: string
  ): Promise<TransportationRoute[]> {
    // Use powerful mock data service
    const mockRoutes = generateMockFerryRoutes(from, to);
    return mockRoutes.map(route => ({
      from: route.from,
      to: route.to,
      type: route.type,
      duration: route.duration,
      price: route.price,
      operator: route.operator,
      schedule: route.schedule,
      provider: route.provider,
      estimatedArrival: route.estimatedArrival,
    }));
  }

  /**
   * Get all ride-hailing options (Gojek, Grab, Bluebird)
   */
  async getRideHailOptions(options: RideHailOptions): Promise<TransportationRoute[]> {
    const [gojekRides, grabRides, bluebirdTaxis] = await Promise.all([
      this.getGojekRides(options),
      this.getGrabRides(options),
      this.getBluebirdTaxis(options),
    ]);

    return [...gojekRides, ...grabRides, ...bluebirdTaxis].sort((a, b) => a.price - b.price);
  }

  /**
   * Get all available routes between two cities
   */
  async getAllRoutes(
    from: string,
    to: string,
    date?: string
  ): Promise<TransportationRoute[]> {
    const [trains, buses, flights, ferries] = await Promise.all([
      this.getTrainRoutes(from, to, date),
      this.getBusRoutes(from, to, date),
      this.getFlightRoutes(from, to, date),
      this.getFerryRoutes(from, to, date),
    ]);

    return [...trains, ...buses, ...flights, ...ferries].sort((a, b) => a.price - b.price);
  }

  /**
   * Calculate route between multiple destinations (with OpenStreetMap routing)
   */
  async calculateMultiCityRoute(
    destinations: Array<{ name: string; coordinates: { lat: number; lng: number } }>
  ): Promise<{
    routes: TransportationRoute[];
    totalCost: number;
    totalDuration: string;
    totalDistance: number;
    routeGeometry?: Array<Array<{ lat: number; lng: number }>>;
  }> {
    const routes: TransportationRoute[] = [];
    let totalCost = 0;
    let totalDistance = 0;
    let totalDurationMinutes = 0;
    const routeGeometry: Array<Array<{ lat: number; lng: number }>> = [];

    for (let i = 0; i < destinations.length - 1; i++) {
      const from = destinations[i];
      const to = destinations[i + 1];
      
      // Get available routes
      const availableRoutes = await this.getAllRoutes(from.name, to.name);
      if (availableRoutes.length > 0) {
        const bestRoute = availableRoutes[0]; // Choose cheapest
        
        // Calculate route using OpenStreetMap
        try {
          const osmRoute = await calculateRoute(
            { lat: from.coordinates.lat, lng: from.coordinates.lng, name: from.name },
            { lat: to.coordinates.lat, lng: to.coordinates.lng, name: to.name }
          );
          
          if (osmRoute) {
            totalDistance += osmRoute.distance;
            totalDurationMinutes += osmRoute.duration;
            routeGeometry.push(osmRoute.geometry);
          }
        } catch (error) {
          console.error("OpenStreetMap routing error:", error);
        }
        
        routes.push(bestRoute);
        totalCost += bestRoute.price;
      }
    }

    // Format total duration
    const hours = Math.floor(totalDurationMinutes / 60);
    const minutes = totalDurationMinutes % 60;
    const totalDuration = hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes} minutes`;

    return {
      routes,
      totalCost,
      totalDuration,
      totalDistance: Math.round(totalDistance * 10) / 10,
      routeGeometry: routeGeometry.length > 0 ? routeGeometry : undefined,
    };
  }

  // Mock data methods (now using powerful mock service)
  private getMockRideHail(options: RideHailOptions, provider: string): TransportationRoute[] {
    const mockRoutes = generateMockRideHail(options.from, options.to, provider, options.vehicleType);
    return mockRoutes.map(route => ({
      from: route.from,
      to: route.to,
      type: route.type,
      duration: route.duration,
      price: route.price,
      operator: route.operator,
      schedule: route.schedule,
      provider: route.provider,
      vehicleType: route.vehicleType,
      estimatedArrival: route.estimatedArrival,
    }));
  }
}

export const transportationAPI = new TransportationAPI();
export default transportationAPI;
