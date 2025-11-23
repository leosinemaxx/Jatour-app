import { Injectable, Logger } from '@nestjs/common';
import { ScoredDeal } from '../relevance-scoring/relevance-scoring.service';

export interface GeospatialDeal {
  id: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  deal: ScoredDeal;
  clusterId?: string;
  distanceFromCenter?: number;
}

export interface DealCluster {
  id: string;
  center: {
    lat: number;
    lng: number;
  };
  deals: GeospatialDeal[];
  clusterType: 'budget' | 'moderate' | 'premium' | 'mixed';
  averageRating: number;
  totalSavings: number;
  categoryBreakdown: Record<string, number>;
}

export interface GeospatialDealMap {
  deals: GeospatialDeal[];
  clusters: DealCluster[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  metadata: {
    totalDeals: number;
    clusteredDeals: number;
    averageDistance: number;
    processingTime: number;
  };
}

@Injectable()
export class GeospatialDealEngineService {
  private readonly logger = new Logger(GeospatialDealEngineService.name);
  private readonly CLUSTER_RADIUS_METERS = 500; // 500m radius for clustering
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Main entry point for geospatial deal mapping
   */
  async createGeospatialDealMap(
    deals: ScoredDeal[],
    centerLocation?: { lat: number; lng: number },
    zoomLevel?: number
  ): Promise<GeospatialDealMap> {
    const startTime = Date.now();

    try {
      // Convert deals to geospatial format
      const geospatialDeals = this.convertDealsToGeospatial(deals);

      // Calculate map bounds and center
      const bounds = this.calculateBounds(geospatialDeals);
      const center = centerLocation || this.calculateCenter(geospatialDeals);
      const zoom = zoomLevel || this.calculateOptimalZoom(bounds);

      // Create clusters
      const clusters = this.clusterDeals(geospatialDeals, center);

      // Assign deals to clusters
      const clusteredDeals = this.assignDealsToClusters(geospatialDeals, clusters);

      const result: GeospatialDealMap = {
        deals: clusteredDeals,
        clusters,
        bounds,
        center,
        zoom,
        metadata: {
          totalDeals: deals.length,
          clusteredDeals: clusteredDeals.filter(d => d.clusterId).length,
          averageDistance: this.calculateAverageDistance(clusteredDeals, center),
          processingTime: Date.now() - startTime
        }
      };

      this.logger.log(`Created geospatial deal map with ${clusters.length} clusters and ${geospatialDeals.length} deals`);
      return result;

    } catch (error) {
      this.logger.error('Error creating geospatial deal map:', error);
      throw new Error(`Geospatial deal mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert scored deals to geospatial format
   */
  private convertDealsToGeospatial(deals: ScoredDeal[]): GeospatialDeal[] {
    return deals
      .filter(deal => deal.coordinates) // Only include deals with coordinates
      .map(deal => ({
        id: deal.id,
        coordinates: deal.coordinates!,
        deal,
        distanceFromCenter: 0 // Will be calculated later
      }));
  }

  /**
   * Calculate map bounds from deals
   */
  private calculateBounds(deals: GeospatialDeal[]): GeospatialDealMap['bounds'] {
    if (deals.length === 0) {
      return {
        north: -6.2,
        south: -7.8,
        east: 113.0,
        west: 112.6
      }; // Default Surabaya bounds
    }

    let north = -90, south = 90, east = -180, west = 180;

    deals.forEach(deal => {
      const { lat, lng } = deal.coordinates;
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    });

    // Add padding
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;

    return {
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding
    };
  }

  /**
   * Calculate center point of all deals
   */
  private calculateCenter(deals: GeospatialDeal[]): { lat: number; lng: number } {
    if (deals.length === 0) {
      return { lat: -7.2575, lng: 112.7521 }; // Surabaya center
    }

    const total = deals.reduce(
      (acc, deal) => ({
        lat: acc.lat + deal.coordinates.lat,
        lng: acc.lng + deal.coordinates.lng
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: total.lat / deals.length,
      lng: total.lng / deals.length
    };
  }

  /**
   * Calculate optimal zoom level based on bounds
   */
  private calculateOptimalZoom(bounds: GeospatialDealMap['bounds']): number {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;

    // Rough zoom calculation based on latitude/longitude differences
    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff > 10) return 8;
    if (maxDiff > 5) return 9;
    if (maxDiff > 2) return 10;
    if (maxDiff > 1) return 11;
    if (maxDiff > 0.5) return 12;
    if (maxDiff > 0.2) return 13;
    if (maxDiff > 0.1) return 14;
    return 15;
  }

  /**
   * Cluster deals based on proximity
   */
  private clusterDeals(deals: GeospatialDeal[], center: { lat: number; lng: number }): DealCluster[] {
    const clusters: DealCluster[] = [];
    const processedDeals = new Set<string>();

    // Sort deals by distance from center
    const sortedDeals = deals
      .map(deal => ({
        ...deal,
        distanceFromCenter: this.calculateDistance(center, deal.coordinates)
      }))
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

    for (const deal of sortedDeals) {
      if (processedDeals.has(deal.id)) continue;

      // Find nearby deals within cluster radius
      const nearbyDeals = sortedDeals.filter(otherDeal => {
        if (processedDeals.has(otherDeal.id) || otherDeal.id === deal.id) return false;

        const distance = this.calculateDistance(deal.coordinates, otherDeal.coordinates);
        return distance <= this.CLUSTER_RADIUS_METERS / 1000; // Convert to km
      });

      // Create cluster
      const clusterDeals = [deal, ...nearbyDeals];
      const clusterCenter = this.calculateCenter(clusterDeals);

      const cluster: DealCluster = {
        id: `cluster-${clusters.length + 1}`,
        center: clusterCenter,
        deals: clusterDeals,
        clusterType: this.determineClusterType(clusterDeals),
        averageRating: this.calculateAverageRating(clusterDeals),
        totalSavings: this.calculateTotalSavings(clusterDeals),
        categoryBreakdown: this.calculateCategoryBreakdown(clusterDeals)
      };

      clusters.push(cluster);

      // Mark deals as processed
      clusterDeals.forEach(d => processedDeals.add(d.id));
    }

    return clusters;
  }

  /**
   * Assign deals to their respective clusters
   */
  private assignDealsToClusters(deals: GeospatialDeal[], clusters: DealCluster[]): GeospatialDeal[] {
    return deals.map(deal => {
      const cluster = clusters.find(c =>
        c.deals.some(clusterDeal => clusterDeal.id === deal.id)
      );

      if (cluster) {
        return {
          ...deal,
          clusterId: cluster.id,
          distanceFromCenter: this.calculateDistance(cluster.center, deal.coordinates)
        };
      }

      return deal;
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Determine cluster type based on deal budget categories
   */
  private determineClusterType(deals: GeospatialDeal[]): DealCluster['clusterType'] {
    const budgetCategories = deals.map(d => d.deal.budgetCategory);
    const uniqueCategories = [...new Set(budgetCategories)];

    if (uniqueCategories.length === 1) {
      return uniqueCategories[0] as DealCluster['clusterType'];
    }

    // Mixed cluster - determine dominant type
    const categoryCounts = budgetCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return dominantCategory as DealCluster['clusterType'];
  }

  /**
   * Calculate average rating of deals in cluster
   */
  private calculateAverageRating(deals: GeospatialDeal[]): number {
    const ratings = deals
      .map(d => d.deal.rating)
      .filter(r => r !== undefined) as number[];

    if (ratings.length === 0) return 0;

    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  /**
   * Calculate total savings in cluster
   */
  private calculateTotalSavings(deals: GeospatialDeal[]): number {
    return deals.reduce((total, deal) => {
      const savings = deal.deal.originalPrice - deal.deal.discountedPrice;
      return total + savings;
    }, 0);
  }

  /**
   * Calculate category breakdown in cluster
   */
  private calculateCategoryBreakdown(deals: GeospatialDeal[]): Record<string, number> {
    return deals.reduce((breakdown, deal) => {
      const category = deal.deal.category;
      breakdown[category] = (breakdown[category] || 0) + 1;
      return breakdown;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate average distance from center
   */
  private calculateAverageDistance(deals: GeospatialDeal[], center: { lat: number; lng: number }): number {
    if (deals.length === 0) return 0;

    const totalDistance = deals.reduce((sum, deal) => {
      return sum + this.calculateDistance(center, deal.coordinates);
    }, 0);

    return totalDistance / deals.length;
  }

  /**
   * Get deals within a specific radius from a point
   */
  async getDealsInRadius(
    deals: ScoredDeal[],
    center: { lat: number; lng: number },
    radiusKm: number
  ): Promise<GeospatialDeal[]> {
    const geospatialDeals = this.convertDealsToGeospatial(deals);

    return geospatialDeals.filter(deal => {
      const distance = this.calculateDistance(center, deal.coordinates);
      return distance <= radiusKm;
    });
  }

  /**
   * Get optimal route visiting multiple deal locations
   */
  async optimizeDealRoute(
    deals: ScoredDeal[],
    startPoint: { lat: number; lng: number }
  ): Promise<GeospatialDeal[]> {
    const geospatialDeals = this.convertDealsToGeospatial(deals);

    // Simple nearest neighbor algorithm for route optimization
    const route: GeospatialDeal[] = [];
    const remaining = [...geospatialDeals];
    let currentPoint = startPoint;

    while (remaining.length > 0) {
      // Find nearest deal
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(currentPoint, remaining[0].coordinates);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(currentPoint, remaining[i].coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearestDeal = remaining.splice(nearestIndex, 1)[0];
      route.push(nearestDeal);
      currentPoint = nearestDeal.coordinates;
    }

    return route;
  }
}