"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fixLeafletIcon, createCustomIcon } from "@/lib/leaflet-utils";

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

interface RouteMapComponentProps {
  center: [number, number];
  zoom: number;
  from: RoutePoint;
  to: RoutePoint;
  routeGeometry?: Array<{ lat: number; lng: number }>;
  showRoute?: boolean;
}

const RouteMapComponent = ({ 
  center, 
  zoom, 
  from, 
  to, 
  routeGeometry,
  showRoute = true 
}: RouteMapComponentProps) => {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [instanceKey] = useState(() => `${Date.now()}-${Math.random()}`);
  const mapRef = useRef<Map | null>(null);
  const mapKey = useMemo(
    () => `${instanceKey}-${center[0]}-${center[1]}-${zoom}-${from.lat}-${to.lat}`,
    [instanceKey, center, zoom, from.lat, to.lat]
  );

  useEffect(() => {
    fixLeafletIcon();
    setLeafletLoaded(true);

    return () => {
      if (mapRef.current) {
        const container = mapRef.current.getContainer() as HTMLElement & { _leaflet_id?: string };
        mapRef.current.remove();
        if (container && container._leaflet_id) {
          container._leaflet_id = undefined;
        }
        mapRef.current = null;
      }
    };
  }, []);

  if (!leafletLoaded) {
    return null;
  }

  // Convert route geometry to Leaflet format
  const routePath = routeGeometry 
    ? routeGeometry.map(point => [point.lat, point.lng] as [number, number])
    : [[from.lat, from.lng], [to.lat, to.lng]] as [number, number][];

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
      
      {/* Route line */}
      {showRoute && (
        <Polyline
          positions={routePath}
          color="#3b82f6"
          weight={4}
          opacity={0.7}
        />
      )}
      
      {/* Start marker */}
      <Marker 
        position={[from.lat, from.lng]} 
        icon={createCustomIcon("#10b981")}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold text-sm text-green-600">Start: {from.name || "Origin"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {from.lat.toFixed(4)}, {from.lng.toFixed(4)}
            </p>
          </div>
        </Popup>
      </Marker>
      
      {/* End marker */}
      <Marker 
        position={[to.lat, to.lng]} 
        icon={createCustomIcon("#ef4444")}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold text-sm text-red-600">End: {to.name || "Destination"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {to.lat.toFixed(4)}, {to.lng.toFixed(4)}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default RouteMapComponent;

