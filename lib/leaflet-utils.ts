// Fix for default marker icon in Next.js - only run once
let iconFixed = false;

export const fixLeafletIcon = () => {
  if (iconFixed || typeof window === "undefined") return;

  // Dynamic import to avoid SSR issues
  import("leaflet").then((L) => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
    iconFixed = true;
  });
};

// Custom icons for start and end points
export const createCustomIcon = (color: string, size: number = 24) => {
  // This will only be called after leaflet is loaded in the component
  const L = require("leaflet");
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

