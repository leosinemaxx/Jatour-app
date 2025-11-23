"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fixLeafletIcon, createCustomIcon } from "@/lib/leaflet-utils";

// Define types for frontend component
interface ScoredDeal {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  category: 'dining' | 'accommodation' | 'transportation' | 'activities' | 'shopping';
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  validUntil: Date;
  terms: string[];
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  tags: string[];
  budgetCategory: 'budget' | 'moderate' | 'premium';
  averageSpendPerHour?: number;
  relevanceScore: number;
  budgetAlignmentScore: number;
  categoryFitScore: number;
  locationRelevanceScore: number;
  timeRelevanceScore: number;
  userPreferenceScore: number;
  reasoning: string[];
}

interface GeospatialDeal {
  id: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  deal: ScoredDeal;
  clusterId?: string;
  distanceFromCenter?: number;
}

interface DealCluster {
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

interface DealMapComponentProps {
  deals: ScoredDeal[];
  center?: [number, number];
  zoom?: number;
  onDealClick?: (deal: ScoredDeal) => void;
  onClusterClick?: (cluster: DealCluster) => void;
  selectedDealId?: string;
  showClusters?: boolean;
  filterByCategory?: string[];
  filterByBudget?: 'budget' | 'moderate' | 'premium';
}

const DealMapComponent = ({
  deals,
  center = [-7.2575, 112.7521], // Surabaya center
  zoom = 12,
  onDealClick,
  onClusterClick,
  selectedDealId,
  showClusters = true,
  filterByCategory,
  filterByBudget
}: DealMapComponentProps) => {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [instanceKey] = useState(() => `${Date.now()}-${Math.random()}`);
  const mapRef = useRef<Map | null>(null);
  const mapKey = useMemo(
    () => `${instanceKey}-${center[0]}-${center[1]}-${zoom}`,
    [instanceKey, center, zoom]
  );

  useEffect(() => {
    try {
      fixLeafletIcon();
      setLeafletLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('Failed to initialize Leaflet:', error);
      setMapError('Failed to load map library');
    }

    return () => {
      if (mapRef.current) {
        try {
          const container = mapRef.current.getContainer() as HTMLElement & { _leaflet_id?: string };
          mapRef.current.remove();
          if (container && container._leaflet_id) {
            container._leaflet_id = undefined;
          }
          mapRef.current = null;
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  // Filter deals based on props
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (!deal.coordinates) return false;

      if (filterByCategory && filterByCategory.length > 0) {
        if (!filterByCategory.includes(deal.category)) return false;
      }

      if (filterByBudget) {
        if (deal.budgetCategory !== filterByBudget) return false;
      }

      return true;
    });
  }, [deals, filterByCategory, filterByBudget]);

  // Convert to geospatial format
  const geospatialDeals: GeospatialDeal[] = useMemo(() => {
    return filteredDeals.map(deal => ({
      id: deal.id,
      coordinates: deal.coordinates!,
      deal,
      distanceFromCenter: 0
    }));
  }, [filteredDeals]);

  // Simple clustering logic (in production, use a proper clustering library)
  const clusters: DealCluster[] = useMemo(() => {
    if (!showClusters) return [];

    const clusterMap: Record<string, GeospatialDeal[]> = {};
    const CLUSTER_SIZE = 0.01; // ~1km grid

    geospatialDeals.forEach(deal => {
      const gridLat = Math.round(deal.coordinates.lat / CLUSTER_SIZE) * CLUSTER_SIZE;
      const gridLng = Math.round(deal.coordinates.lng / CLUSTER_SIZE) * CLUSTER_SIZE;
      const gridKey = `${gridLat}-${gridLng}`;

      if (!clusterMap[gridKey]) {
        clusterMap[gridKey] = [];
      }
      clusterMap[gridKey].push(deal);
    });

    return Object.entries(clusterMap)
      .filter(([, deals]) => deals.length > 1)
      .map(([gridKey, clusterDeals]) => {
        const [gridLat, gridLng] = gridKey.split('-').map(Number);
        const totalSavings = clusterDeals.reduce((sum: number, d: GeospatialDeal) => sum + (d.deal.originalPrice - d.deal.discountedPrice), 0);
        const averageRating = clusterDeals
          .filter((d: GeospatialDeal) => d.deal.rating)
          .reduce((sum: number, d: GeospatialDeal, _, arr) => sum + (d.deal.rating! / arr.length), 0);

        const categoryBreakdown = clusterDeals.reduce((acc: Record<string, number>, d: GeospatialDeal) => {
          acc[d.deal.category] = (acc[d.deal.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          id: gridKey,
          center: { lat: gridLat, lng: gridLng },
          deals: clusterDeals,
          clusterType: clusterDeals.every((d: GeospatialDeal) => d.deal.budgetCategory === 'budget') ? 'budget' :
                      clusterDeals.every((d: GeospatialDeal) => d.deal.budgetCategory === 'premium') ? 'premium' : 'mixed',
          averageRating,
          totalSavings,
          categoryBreakdown
        };
      });
  }, [geospatialDeals, showClusters]);

  // Get color for deal based on criteria
  const getDealColor = (deal: ScoredDeal): string => {
    // Green for low prices (bottom 33% of discounted prices)
    // Blue for best ratings (rating >= 4.5)
    // Gold for promotions (discount >= 30%)

    if (deal.discountPercentage >= 30) return "#FFD700"; // Gold
    if (deal.rating && deal.rating >= 4.5) return "#3B82F6"; // Blue
    return "#10B981"; // Green for low prices
  };

  // Get cluster color
  const getClusterColor = (cluster: DealCluster): string => {
    switch (cluster.clusterType) {
      case 'budget': return "#10B981"; // Green
      case 'premium': return "#FFD700"; // Gold
      case 'moderate': return "#3B82F6"; // Blue
      default: return "#6B7280"; // Gray
    }
  };

  if (mapError) {
    return (
      <div className="w-full h-full bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ {mapError}</div>
          <div className="text-sm text-gray-600">Please refresh the page or try again later</div>
        </div>
      </div>
    );
  }

  if (!leafletLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      ref={(mapInstance) => {
        if (mapInstance) {
          mapRef.current = mapInstance;
        }
      }}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        minZoom={3}
      />

      {/* Individual deal markers */}
      {geospatialDeals.map((geoDeal) => {
        const isSelected = selectedDealId === geoDeal.id;
        const color = getDealColor(geoDeal.deal);

        return (
          <Marker
            key={geoDeal.id}
            position={[geoDeal.coordinates.lat, geoDeal.coordinates.lng]}
            icon={createCustomIcon(color, isSelected ? 32 : 24)}
            eventHandlers={{
              click: () => onDealClick?.(geoDeal.deal)
            }}
          >
            <Popup>
              <div className="p-3 max-w-xs">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {geoDeal.deal.title}
                  </h3>
                  <span
                    className="ml-2 px-2 py-1 text-xs font-medium rounded-full"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {geoDeal.deal.discountPercentage}% OFF
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {geoDeal.deal.merchantName}
                </p>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <span className="font-semibold text-green-600">
                      Rp {geoDeal.deal.discountedPrice.toLocaleString()}
                    </span>
                    <span className="text-gray-500 line-through ml-1">
                      Rp {geoDeal.deal.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  {geoDeal.deal.rating && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="mr-1">⭐</span>
                      {geoDeal.deal.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded-full capitalize">
                    {geoDeal.deal.category}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded-full capitalize">
                    {geoDeal.deal.budgetCategory}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  Relevance: {geoDeal.deal.relevanceScore}/100
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Cluster markers */}
      {showClusters && clusters.map((cluster) => {
        const color = getClusterColor(cluster);
        const dealCount = cluster.deals.length;

        return (
          <Marker
            key={cluster.id}
            position={[cluster.center.lat, cluster.center.lng]}
            icon={createCustomIcon(color, Math.min(40, 20 + dealCount * 2))}
            eventHandlers={{
              click: () => onClusterClick?.(cluster)
            }}
          >
            <Popup>
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-2">
                  Deal Cluster ({dealCount} deals)
                </h3>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Savings:</span>
                    <span className="font-semibold text-green-600">
                      Rp {cluster.totalSavings.toLocaleString()}
                    </span>
                  </div>

                  {cluster.averageRating > 0 && (
                    <div className="flex justify-between">
                      <span>Average Rating:</span>
                      <span>⭐ {cluster.averageRating.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="mt-2">
                    <span className="text-xs font-medium">Categories:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(cluster.categoryBreakdown).map(([category, count]) => (
                        <span key={category} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                          {category} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DealMapComponent;