"use client";

import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, DollarSign, Navigation, Heart, Share2, Bookmark, CircleCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import OpenStreetMapView from "@/components/maps/OpenStreetMapView";
import type { Destination } from "@/app/datatypes";

export interface DestCardEnhancedProps {
  item: Destination;
  className?: string;
  onClick?: () => void;
}

const priceRangeColors = {
  budget: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-blue-100 text-blue-800 border-blue-200",
  luxury: "bg-purple-100 text-purple-800 border-purple-200",
};

const categoryColors = {
  Mountain: "bg-orange-100 text-orange-800",
  Beach: "bg-blue-100 text-blue-800",
  Temple: "bg-amber-100 text-amber-800",
  Nature: "bg-green-100 text-green-800",
  Park: "bg-emerald-100 text-emerald-800",
  Museum: "bg-indigo-100 text-indigo-800",
};

const DestCardEnhanced = memo(function DestCardEnhanced({ item, className, onClick }: DestCardEnhancedProps) {
  const [showMap, setShowMap] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const imageUrl = item.image || item.imageUrl || "/destinations/main-bg.webp";
  const priceColor = item.priceRange 
    ? (priceRangeColors[item.priceRange as keyof typeof priceRangeColors] || priceRangeColors.moderate)
    : priceRangeColors.moderate;
  const categoryColor = item.category 
    ? (categoryColors[item.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800")
    : "bg-gray-100 text-gray-800";
  
  const coordinates = item.coordinates as { lat: number; lng: number } | undefined;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Call API to save favorite
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: item.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className="overflow-hidden cursor-pointer h-full hover:shadow-xl transition-all duration-300 group"
        onClick={onClick}
      >
        <div className="relative h-48 w-full overflow-hidden group">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Interactive Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute top-2 right-2 flex gap-2 z-10"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
            >
              <Share2 className="h-4 w-4 text-gray-700" />
            </motion.button>
          </motion.div>

          {/* Featured Badge */}
          {item.featured && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 left-2"
            >
              <Badge className="bg-primary/90 backdrop-blur-sm border-primary">
                Featured
              </Badge>
            </motion.div>
          )}

          {/* Category Badge */}
          <div className="absolute top-2 left-2 z-10">
            <Badge className={`${categoryColor} border-0 ${item.featured ? "mt-8" : ""}`}>
              {item.category}
            </Badge>
          </div>

          {/* Accessibility Badge */}
          {item.disabledFriendly && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-2 left-2 z-10"
            >
              <Badge className="bg-blue-600 text-white border-0 flex items-center gap-1">
                <CircleCheck className="h-3 w-3" />
                Accessible
              </Badge>
            </motion.div>
          )}

          {/* Rating */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-white">
              {item.rating?.toFixed(1) || "N/A"}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.name}</h3>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{item.city}</span>
          </div>

          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            {item.priceRange && (
              <Badge className={priceColor}>
                <DollarSign className="h-3 w-3 mr-1" />
                {item.priceRange}
              </Badge>
            )}
            
            {item.openingHours && (
              <span className="text-xs text-muted-foreground">
                {item.openingHours.split(' - ')[0]}
              </span>
            )}
          </div>

          {coordinates && (
            <div className="space-y-2">
              <Button
                className="w-full border border-gray-300 bg-white hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMap(!showMap);
                }}
              >
                <Navigation className="h-3 w-3 mr-2" />
                {showMap ? "Hide" : "Show"} Map
              </Button>
              {showMap && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg overflow-hidden"
                >
                  <OpenStreetMapView
                    lat={coordinates.lat}
                    lng={coordinates.lng}
                    name={item.name}
                    address={item.address}
                    height="200px"
                    zoom={14}
                  />
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

DestCardEnhanced.displayName = "DestCardEnhanced";

export default DestCardEnhanced;

