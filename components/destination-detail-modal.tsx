"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  X, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  Heart,
  Share2,
  Bookmark,
  CheckCircle2,
  CircleCheck
} from "lucide-react";
import Image from "next/image";
import OpenStreetMapView from "@/components/maps/OpenStreetMapView";
import ReviewList from "@/components/reviews/review-list";
import { apiClient } from "@/lib/api-client";
import type { Destination } from "@/app/datatypes";

interface DestinationDetailModalProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DestinationDetailModal({ 
  destination, 
  isOpen, 
  onClose 
}: DestinationDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = destination?.images && destination.images.length > 0 
    ? destination.images 
    : destination?.image 
      ? [destination.image] 
      : ["/destinations/main-bg.webp"];

  const coordinates = destination?.coordinates as { lat: number; lng: number } | undefined;

  useEffect(() => {
    if (destination && isOpen) {
      setCurrentImageIndex(0);
      // Fetch destination details with reviews
      const fetchDestinationDetails = async () => {
        setLoadingReviews(true);
        try {
          const data = await apiClient.getDestination(destination.id);
          if (data && data.reviews) {
            setReviews(data.reviews);
          } else {
            setReviews([]);
          }
        } catch (error) {
          console.error("Failed to fetch destination details:", error);
          setReviews([]);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchDestinationDetails();
    } else {
      setReviews([]);
    }
  }, [destination, isOpen]);

  if (!destination) return null;

  const priceRangeColors = {
    budget: "bg-green-100 text-green-800",
    moderate: "bg-blue-100 text-blue-800",
    luxury: "bg-purple-100 text-purple-800",
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Image Gallery */}
            <div className="relative h-64 sm:h-96 w-full overflow-hidden">
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentImageIndex 
                            ? "w-8 bg-white" 
                            : "w-2 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[currentImageIndex]}
                    alt={destination.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={currentImageIndex === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-6 space-y-4">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DialogTitle className="text-2xl">{destination.name}</DialogTitle>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsFavorite(!isFavorite)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={async () => {
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: destination.name,
                                  text: destination.description,
                                  url: window.location.href,
                                });
                              } catch (err) {
                                console.log('Error sharing:', err);
                              }
                            }
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Share2 className="h-5 w-5 text-gray-400" />
                        </motion.button>
                      </div>
                    </div>
                    <DialogDescription className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4" />
                      {destination.address || `${destination.city}, ${destination.province || "Jawa Timur"}`}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {destination.rating?.toFixed(1) || "N/A"}
                      </Badge>
                      {destination.priceRange && (
                        <Badge className={priceRangeColors[destination.priceRange] || priceRangeColors.moderate}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          {destination.priceRange}
                        </Badge>
                      )}
                    </div>
                    {destination.disabledFriendly && (
                      <Badge className="bg-blue-600 text-white border-0 flex items-center gap-1">
                        <CircleCheck className="h-3 w-3" />
                        Accessible
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Description */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {destination.description}
                  </p>
                </CardContent>
              </Card>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {destination.openingHours && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 text-center">
                        <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="text-sm font-semibold">{destination.openingHours}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {destination.contact && (
                  <motion.a
                    href={`tel:${destination.contact}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="block"
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 text-center">
                        <Phone className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="text-sm font-semibold truncate">{destination.contact}</p>
                      </CardContent>
                    </Card>
                  </motion.a>
                )}
                {destination.website && (
                  <motion.a
                    href={destination.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="block"
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 text-center">
                        <Globe className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Website</p>
                        <p className="text-sm font-semibold text-primary hover:underline">
                          Visit
                        </p>
                      </CardContent>
                    </Card>
                  </motion.a>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3 text-center">
                      <MapPin className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="text-sm font-semibold">{destination.category}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Accessibility Features */}
              {destination.disabledFriendly && destination.accessibilityFeatures && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CircleCheck className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Accessibility Features</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {destination.accessibilityFeatures.wheelchairAccessible && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Wheelchair Accessible</span>
                        </div>
                      )}
                      {destination.accessibilityFeatures.accessibleParking && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Accessible Parking</span>
                        </div>
                      )}
                      {destination.accessibilityFeatures.accessibleRestrooms && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Accessible Restrooms</span>
                        </div>
                      )}
                      {destination.accessibilityFeatures.audioGuide && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Audio Guide</span>
                        </div>
                      )}
                      {destination.accessibilityFeatures.accessiblePaths && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Accessible Paths</span>
                        </div>
                      )}
                      {destination.accessibilityFeatures.elevator && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Elevator Available</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* OpenStreetMap */}
              {coordinates && (
                <Card>
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location on Map
                      </h3>
                    </div>
                    <OpenStreetMapView
                      lat={coordinates.lat}
                      lng={coordinates.lng}
                      name={destination.name}
                      address={destination.address}
                      height="300px"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Reviews Section */}
              <ReviewList reviews={reviews} destinationName={destination.name} />
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

