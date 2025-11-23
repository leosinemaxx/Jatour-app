"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fixLeafletIcon } from "@/lib/leaflet-utils";

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  name?: string;
  address?: string;
}

const MapComponent = ({ center, zoom, name, address }: MapComponentProps) => {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [instanceKey] = useState(() => `${Date.now()}-${Math.random()}`);
  const mapRef = useRef<Map | null>(null);

  // Unique key prevents Leaflet from trying to reattach to an existing container
  const mapKey = useMemo(
    () => `${instanceKey}-${center[0]}-${center[1]}-${zoom}`,
    [instanceKey, center, zoom]
  );

  useEffect(() => {
    fixLeafletIcon();
    setLeafletLoaded(true);

    return () => {
      if (mapRef.current) {
        const container = mapRef.current.getContainer() as HTMLElement & { _leaflet_id?: string };
        mapRef.current.remove();
        if (container && container._leaflet_id) {
          // React StrictMode reuses DOM nodes; make sure Leaflet forgets this one
          container._leaflet_id = undefined;
        }
        mapRef.current = null;
      }
    };
  }, []);

  if (!leafletLoaded) {
    return null;
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
      <Marker position={center}>
        {name && (
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm">{name}</h3>
              {address && (
                <p className="text-xs text-muted-foreground mt-1">{address}</p>
              )}
            </div>
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;

