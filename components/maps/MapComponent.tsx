"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

  useEffect(() => {
    fixLeafletIcon();
    setLeafletLoaded(true);
  }, []);

  if (!leafletLoaded) {
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
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

