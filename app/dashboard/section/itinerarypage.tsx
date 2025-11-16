"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin, Edit, Trash2, Share2, Download } from "lucide-react";

interface Itinerary {
  id: string;
  dateRange: string;
  city: string;
  country: string;
  image: string;
}

export default function ItinerarySection() {
  const [itineraries] = useState<Itinerary[]>([
    {
      id: "1",
      dateRange: "Aug 21 - Aug 30",
      city: "Surabaya",
      country: "Indonesia",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
    },
    {
      id: "2",
      dateRange: "Sep 5 - Sep 12",
      city: "Bojonegoro",
      country: "Indonesia",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    },
    {
      id: "3",
      dateRange: "Oct 10 - Oct 15",
      city: "Probolinggo",
      country: "Indonesia",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    },
  ]);

  const memoizedItineraries = useMemo(() => itineraries, [itineraries]);

  return (
    <div className="space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">My Itinerary</h1>
      </motion.div>

      <div className="space-y-4">
        {memoizedItineraries.map((itinerary, index) => (
          <motion.div
            key={itinerary.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ x: 4 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                  <Image
                    src={itinerary.image}
                    alt={itinerary.city}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 192px"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:hidden" />
                </div>
                <CardContent className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{itinerary.dateRange}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Travel to {itinerary.city}, {itinerary.country}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{itinerary.city}, {itinerary.country}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-gray-600" />
                      </motion.button>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </motion.div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {itineraries.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No itineraries yet. Start planning your trip!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
