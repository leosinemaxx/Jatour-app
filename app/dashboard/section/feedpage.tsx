"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DestCardEnhanced from "@/components/dest-card-enhanced";
import DestinationDetailModal from "@/components/destination-detail-modal";
import { LoadingSpinner, LoadingSkeleton } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import { Search, Train, Bus, UtensilsCrossed, Coffee, Ticket, Clock, CircleCheck, Filter } from "lucide-react";
import Image from "next/image";
import type { Destination } from "@/app/datatypes";

interface ItineraryCard {
  id: string;
  title: string;
  days: number;
  hotel: number;
  destinations: number;
  image: string;
}

export default function ExploreSection() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);
  const [selected, setSelected] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const data = await apiClient.getDestinations();
        if (mounted) {
          setDestinations(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Gagal memuat data destinasi:", error);
        if (mounted) {
          setDestinations([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

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

  const featuredDestinations = useMemo(() => filtered.filter(d => d.featured), [filtered]);
  const regularDestinations = useMemo(() => filtered.filter(d => !d.featured), [filtered]);

  const ItineraryCard = ({ item }: { item: ItineraryCard }) => (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
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
            placeholder="Cari Itinerary Pilihanmu..."
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
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Destinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredDestinations.map((dest, index) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <DestCardEnhanced
                  item={dest}
                  onClick={() => setSelected(dest)}
                />
              </motion.div>
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
