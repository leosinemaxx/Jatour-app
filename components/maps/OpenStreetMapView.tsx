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
  const [instanceKey] = useState(() => `${Date.now()}-${Math.random()}`);
  const [ready, setReady] = useState(false);

  // Memoize center coordinates to prevent unnecessary re-renders
  const center = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const mapInstanceKey = useMemo(
    () => `${instanceKey}-${lat}-${lng}-${zoom}`,
    [instanceKey, lat, lng, zoom]
  );

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Force the map to mount on the next animation frame so the DOM container
  // is brand new before Leaflet touches it (prevents double-initialization in StrictMode)
  useEffect(() => {
    if (!mounted) return;
    setReady(false);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted, mapInstanceKey]);

  if (!mounted || !ready) {
    return <MapLoadingSkeleton />;
  }

  return (
    <div 
      key={mapInstanceKey}
      style={{ 
        width: "100%", 
        height: height, 
        borderRadius: "0.5rem", 
        overflow: "hidden",
        position: "relative"
      }}
    >
      <DynamicMap
        key={mapInstanceKey}
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
