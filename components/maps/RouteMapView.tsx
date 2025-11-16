"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";

// Dynamically import Leaflet components
const DynamicRouteMap = dynamic(
  () => import("./RouteMapComponent"),
  { 
    ssr: false,
    loading: () => <MapLoadingSkeleton />
  }
);

const MapLoadingSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse space-y-2 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

interface RouteMapViewProps {
  from: RoutePoint;
  to: RoutePoint;
  routeGeometry?: Array<{ lat: number; lng: number }>;
  height?: string;
  zoom?: number;
  showRoute?: boolean;
}

const RouteMapView = ({ 
  from,
  to,
  routeGeometry,
  height = "400px",
  zoom,
  showRoute = true
}: RouteMapViewProps) => {
  const [mounted, setMounted] = useState(false);

  // Calculate center and zoom if not provided
  const center = useMemo(() => {
    const lat = (from.lat + to.lat) / 2;
    const lng = (from.lng + to.lng) / 2;
    return [lat, lng] as [number, number];
  }, [from, to]);

  const calculatedZoom = useMemo(() => {
    if (zoom) return zoom;
    // Calculate zoom based on distance
    const latDiff = Math.abs(from.lat - to.lat);
    const lngDiff = Math.abs(from.lng - to.lng);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 9;
    if (maxDiff > 0.2) return 10;
    if (maxDiff > 0.1) return 11;
    return 12;
  }, [from, to, zoom]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MapLoadingSkeleton />;
  }

  return (
    <div 
      style={{ 
        width: "100%", 
        height: height, 
        borderRadius: "0.5rem", 
        overflow: "hidden",
        position: "relative"
      }}
    >
      <DynamicRouteMap
        center={center}
        zoom={calculatedZoom}
        from={from}
        to={to}
        routeGeometry={routeGeometry}
        showRoute={showRoute}
      />
    </div>
  );
};

export default RouteMapView;

