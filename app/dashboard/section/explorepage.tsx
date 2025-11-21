"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DestinationDetailModal from "@/components/destination-detail-modal";
import { LoadingSpinner, LoadingSkeleton } from "@/components/ui/loading";
import { useDestinations } from "@/lib/hooks/useDestinations";
import { Search, Train, Bus, UtensilsCrossed, Coffee, Ticket, Clock, CircleCheck, MapPin, Star, DollarSign, Navigation } from "lucide-react";
import Image from "next/image";
import type { Destination } from "@/app/datatypes";
import OpenStreetMapView from "@/components/maps/OpenStreetMapView";

interface ItineraryCard {
  id: string;
  title: string;
  days: number;
  hotel: number;
  destinations: number;
  image: string;
}

export default function ExploreSection() {
  const { destinations, isLoading: loading } = useDestinations();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);
  const [selected, setSelected] = useState<Destination | null>(null);
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const categories = [
    { name: "Train", icon: Train, color: "from-blue-500 to-cyan-500" },
    { name: "Bus", icon: Bus, color: "from-green-500 to-emerald-500" },
    { name: "Restaurant", icon: UtensilsCrossed, color: "from-orange-500 to-red-500" },
    { name: "Cafe", icon: Coffee, color: "from-amber-500 to-yellow-500" },
    { name: "Event", icon: Ticket, color: "from-purple-500 to-pink-500" },
  ];

  const recentlyViewed: ItineraryCard[] = [
    {
      id: "1",
      title: "4 days trip to Bojonegoro",
      days: 4,
      hotel: 1,
      destinations: 5,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    },
    {
      id: "2",
      title: "2 days trip to Malang",
      days: 2,
      hotel: 1,
      destinations: 3,
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    },
  ];

  const popularItineraries: ItineraryCard[] = [
    {
      id: "3",
      title: "7 days trip to Surabaya",
      days: 7,
      hotel: 1,
      destinations: 5,
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
    },
    {
      id: "4",
      title: "5 days trip to Banyuwangi",
      days: 5,
      hotel: 1,
      destinations: 3,
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    },
  ];

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.city.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || d.category === selectedCategory;
      const matchesAccessibility = !showAccessibleOnly || d.disabledFriendly === true;
      return matchesSearch && matchesCategory && matchesAccessibility;
    });
  }, [destinations, search, selectedCategory, showAccessibleOnly]);

  const allDestinations = useMemo(() => filtered, [filtered]);
  const featuredDestinations = useMemo(() => filtered.filter(d => d.featured), [filtered]);

  const accessibilityLabels: Record<keyof NonNullable<Destination["accessibilityFeatures"]>, string> = {
    wheelchairAccessible: "Ramah Disabilitas",
    accessibleParking: "Parkir Luas",
    accessibleRestrooms: "Ramah Ibu Hamil",
    audioGuide: "Audio Guide",
    signLanguage: "Bahasa Isyarat",
    accessiblePaths: "Jalur Aman",
    elevator: "Lift",
    accessibleShuttle: "Shuttle",
  };

  const priceCopy: Record<string, string> = {
    budget: "IDR 0 - 50K / Orang",
    moderate: "IDR 50K - 150K / Orang",
    luxury: "IDR 150K+ / Orang",
  };

  const FeaturedDestinationCard = ({ destination }: { destination: Destination }) => {
    const coordinates = destination.coordinates;
    const priceRange = destination.priceRange?.toLowerCase() || "moderate";
    const highlightBadges = Object.entries(accessibilityLabels)
      .filter(([key]) => destination.accessibilityFeatures?.[key as keyof typeof accessibilityLabels])
      .map(([, value]) => value);

    const displayedHighlights = highlightBadges.length > 0
      ? highlightBadges
      : destination.disabledFriendly
        ? ["Ramah Disabilitas"]
        : ["Informasi belum tersedia"];

    const isMapExpanded = expandedMapId === destination.id;
    const handleCardClick = () => setSelected(destination);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full h-full"
      >
        <div
          className="w-full h-full max-w-sm rounded-[36px] bg-neutral-200 p-4 shadow-inner cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="rounded-[32px] bg-white shadow-2xl overflow-hidden flex flex-col h-full min-h-[640px]">
            <div className="relative h-64 w-full">
              <Image
                src={destination.image || destination.imageUrl || "/destinations/main-bg.webp"}
                alt={destination.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 640px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />
              <div className="absolute top-5 left-5 flex gap-2">
                {destination.category && (
                  <Badge className="bg-white/90 text-gray-900 border-0 text-xs font-semibold">
                    {destination.category}
                  </Badge>
                )}
                {destination.disabledFriendly && (
                  <Badge className="bg-blue-600 text-white border-0 text-xs font-semibold flex items-center gap-1">
                    <CircleCheck className="h-3 w-3" />
                    Accessible
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 rounded-full px-3 py-1 text-sm font-semibold">
                <Star className="h-4 w-4 text-yellow-500" />
                {destination.rating?.toFixed(1) || "4.5"}
              </div>
            </div>

            <div className="-mt-6 bg-white rounded-t-[32px] p-6 space-y-4 relative z-10 flex flex-col flex-1">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{destination.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{destination.city}{destination.province ? `, ${destination.province}` : ""}</span>
                    </div>
                  </div>
                  {destination.priceRange && (
                    <div className="flex flex-col items-end text-sm text-gray-600">
                      <span className="text-xs uppercase tracking-wide text-gray-400">Tiket</span>
                      <div className="flex items-center gap-1 font-semibold text-gray-900">
                        <DollarSign className="h-4 w-4" />
                        {destination.priceRange}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Keunggulan</p>
                <div className="flex flex-wrap gap-2">
                  {displayedHighlights.map((highlight) => (
                    <Badge key={highlight} className="bg-gray-100 text-gray-700 border-0">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>

              {destination.description && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Deskripsi</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {destination.description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-gray-100 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Harga Perkiraan</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {priceCopy[priceRange] || "Informasi tidak tersedia"}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  Klik kartu untuk detail
                </div>
              </div>

              {coordinates && (
                <div className="space-y-3 mt-auto">
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedMapId(isMapExpanded ? null : destination.id);
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {isMapExpanded ? "Sembunyikan Peta" : "Lihat Peta"}
                  </Button>
                  {isMapExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden rounded-2xl"
                    >
                      <OpenStreetMapView
                        lat={coordinates.lat}
                        lng={coordinates.lng}
                        name={destination.name}
                        address={destination.address}
                        height="240px"
                        zoom={14}
                      />
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const ItineraryCard = ({ item }: { item: ItineraryCard }) => (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="cursor-pointer h-full"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
        <div className="relative h-32 sm:h-40">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
            <div className="flex items-center gap-3 text-xs opacity-90">
              <span>{item.hotel} Hotel</span>
              <span>•</span>
              <span>{item.destinations} Destinations</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari Itinerary Favoritmu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Category Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-5 gap-3"
      >
        {categories.map((cat, index) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl shadow-md hover:shadow-lg transition-all ${
              selectedCategory === cat.name
                ? `bg-gradient-to-br ${cat.color} text-white`
                : "bg-white text-gray-700"
            }`}
          >
            <cat.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{cat.name}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Accessibility Filter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <Button
          onClick={() => setShowAccessibleOnly(!showAccessibleOnly)}
          className={`w-full sm:w-auto ${
            showAccessibleOnly
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <CircleCheck className="h-4 w-4 mr-2" />
          {showAccessibleOnly ? "Show All" : "Show Accessible Only"}
        </Button>
      </motion.div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Terakhir Kali Dilihat</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentlyViewed.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <ItineraryCard item={item} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Popular Itinerary */}
      {popularItineraries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Itenary Populer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularItineraries.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <ItineraryCard item={item} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Destinations */}
      {featuredDestinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-gray-900">Featured Destinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredDestinations.map((dest) => (
              <FeaturedDestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        </motion.div>
      )}

      {/* All Destinations - Show when there are destinations that aren't featured or when no featured filter is active */}
      {(allDestinations.length > featuredDestinations.length || featuredDestinations.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {featuredDestinations.length > 0 ? "More Destinations" : "All Destinations"}
            </h2>
            <Badge variant="outline" className="text-xs">
              {allDestinations.length} destinations
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {allDestinations
              .filter(dest => !dest.featured)
              .map((dest) => (
              <FeaturedDestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Destination Detail Modal */}
      {selected && (
        <DestinationDetailModal
          destination={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
