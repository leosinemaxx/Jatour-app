"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Bell, 
  Calendar, 
  Tag, 
  UtensilsCrossed, 
  Building2,
  Cloud,
  Sun,
  ArrowRight,
  User,
  Wallet,
  Heart,
  Share2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DestCardEnhanced from "@/components/dest-card-enhanced";
import { LoadingSkeleton } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import type { Destination } from "@/app/datatypes";

export default function HomeSection() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: 22, condition: "Cerah Berawan" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiClient.getDestinations({ featured: true });
        setDestinations(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredDestination = useMemo(() => destinations[0] || null, [destinations]);
  const recommendations = useMemo(() => destinations.slice(1), [destinations]);

  return (
    <div className="space-y-6 pb-6">
      {/* Top Section with Weather and Notification */}
      <div className="flex items-center justify-between mb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl px-4 py-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            <div>
              <p className="text-2xl font-bold">{weather.temp}°C</p>
              <p className="text-xs opacity-90">{weather.condition}</p>
            </div>
          </div>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </motion.button>
      </div>

      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Hi, Alden 👋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-3">
          Let's book a vacation for your happiness
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>Kec. Kalianyar, Surabaya</span>
        </div>
      </motion.div>

      {/* User Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 mb-1">Preferences</p>
                  <User className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 mb-1">Budget</p>
                  <p className="text-lg font-bold">IDR 1.000.000.000</p>
                </div>
                <Wallet className="h-6 w-6 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feature Categories */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Calendar, label: "Smart Planner", color: "from-blue-500 to-cyan-500" },
          { icon: Tag, label: "Promo and Idea", color: "from-orange-500 to-red-500" },
          { icon: UtensilsCrossed, label: "Kuliner", color: "from-green-500 to-emerald-500" },
          { icon: Building2, label: "Pusat Pelayanan", color: "from-purple-500 to-pink-500" },
        ].map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-center"
          >
            <div className={`bg-gradient-to-br ${feature.color} rounded-2xl p-4 mb-2 shadow-md`}>
              <feature.icon className="h-6 w-6 mx-auto text-white" />
            </div>
            <p className="text-xs text-gray-700 font-medium">{feature.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Destination */}
      {featuredDestination && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="relative h-48 sm:h-64">
              <Image
                src={featuredDestination.image || "/destinations/main-bg.webp"}
                alt={featuredDestination.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 100vw"
                priority
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <Badge className="mb-2 bg-white/20 backdrop-blur-sm text-white border-white/30">
                  Top Destination
                </Badge>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">{featuredDestination.name}</h3>
                <p className="text-sm opacity-90">{featuredDestination.city}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recommendations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rekomendasi</h2>
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700 transition-colors"
          >
            View More
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((dest, index) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <DestCardEnhanced item={dest} />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <p>No recommendations available</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

