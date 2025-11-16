"use client";

import { useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";

interface GoogleMapViewProps {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  height?: string;
  zoom?: number;
}

const GoogleMapView = ({ 
  lat, 
  lng, 
  name, 
  address, 
  height = "400px",
  zoom = 15 
}: GoogleMapViewProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  const mapContainerStyle = {
    width: "100%",
    height: height,
    borderRadius: "0.5rem",
  };

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        <Marker
          position={center}
          title={name || "Location"}
          onClick={() => setShowInfoWindow(true)}
        >
          {name && showInfoWindow && (
            <InfoWindow onCloseClick={() => setShowInfoWindow(false)}>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{name}</h3>
                {address && (
                  <p className="text-xs text-muted-foreground mt-1">{address}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </Marker>
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapView;

