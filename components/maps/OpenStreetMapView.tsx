"use client";

import { useEffect, useState, useMemo, memo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";

// Dynamically import the entire map component to reduce initial bundle size
// This ensures Leaflet is only loaded when the map is actually rendered
const DynamicMap = dynamic(
  () => import("./MapComponent"),
  { 
    ssr: false,
    loading: () => <MapLoadingSkeleton />
  }
);

// Loading skeleton component
const MapLoadingSkeleton = memo(() => (
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
));

MapLoadingSkeleton.displayName = "MapLoadingSkeleton";

interface OpenStreetMapViewProps {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  height?: string;
  zoom?: number;
}

const OpenStreetMapView = memo(({ 
  lat, 
  lng, 
  name, 
  address, 
  height = "400px",
  zoom = 15 
}: OpenStreetMapViewProps) => {
  const [mounted, setMounted] = useState(false);

  // Memoize center coordinates to prevent unnecessary re-renders
  const center = useMemo(() => [lat, lng] as [number, number], [lat, lng]);

  // Ensure component only renders on client side
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
      <DynamicMap
        center={center}
        zoom={zoom}
        name={name}
        address={address}
      />
    </div>
  );
});

OpenStreetMapView.displayName = "OpenStreetMapView";

export default OpenStreetMapView;
