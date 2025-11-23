"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, RefreshCw, Eye, MapPin, DollarSign } from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";

export default function ItinerarySection() {
  console.log("DEBUG: ItinerarySection component rendered at", new Date().toISOString());
  const router = useRouter();
  const { itinerary, preferences, generateItinerary, generating, savedItineraries } = useSmartItinerary();
  const [hasGenerated, setHasGenerated] = useState(false);

  // Automatic generation on component mount if preferred spots exist
  useEffect(() => {
    if (preferences.preferredSpots.length > 0 && !hasGenerated && itinerary.length === 0) {
      generateItinerary();
      setHasGenerated(true);
    }
  }, [preferences.preferredSpots, hasGenerated, itinerary.length, generateItinerary]);

  // Handler to redirect to preferences page
  const handleCreateNew = () => {
    router.push("/dashboard/homepage/preferences");
  };

  // Calculate total estimated cost
  const totalEstimatedCost = itinerary.reduce((total, day) => {
    const dayCost = day.destinations.reduce((dayTotal, dest) => dayTotal + (dest.estimatedCost || 0), 0);
    return total + dayCost;
  }, 0);

  // Get first 3 days for recap
  const recapDays = itinerary.slice(0, 3);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Itinerary</h1>
          <p className="text-gray-600">View your generated travel itinerary</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateItinerary()}
            disabled={generating}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Refresh Generation
          </Button>
          <Button
            onClick={() => router.push("/dashboard/homepage/itinerary")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show Details
          </Button>
        </div>
      </motion.div>

      {/* Loading State */}
      {generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Generating your smart itinerary...</p>
        </motion.div>
      )}

      {/* No destinations found */}
      {!generating && preferences.preferredSpots.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No destinations found
                </h3>
                <p className="text-gray-600 mb-4">
                  Please add spots in /dashboard/preferences/spots and refresh.
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/preferences/spots")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Spots
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Recap Display */}
      {!generating && itinerary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Summary Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Daily Recap</h3>
                    <p className="text-gray-600">
                      {preferences.days} days • {preferences.cities.join(', ') || 'Multiple Cities'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                    <p className="text-2xl font-bold text-green-600">
                      IDR {totalEstimatedCost.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Days Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recapDays.map((day, index) => (
                    <motion.div
                      key={day.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {day.day}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Day {day.day}</p>
                                <p className="text-sm text-gray-600">{day.date}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{day.destinations.length} destinations</span>
                            </div>

                            {day.destinations.length > 0 && (
                              <div className="space-y-1">
                                {day.destinations.slice(0, 2).map((dest, destIndex) => (
                                  <p key={destIndex} className="text-sm text-gray-700 truncate">
                                    • {dest.name}
                                  </p>
                                ))}
                                {day.destinations.length > 2 && (
                                  <p className="text-sm text-gray-500">
                                    +{day.destinations.length - 2} more
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                              <DollarSign className="h-4 w-4" />
                              <span>
                                IDR {day.destinations.reduce((total, dest) => total + (dest.estimatedCost || 0), 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {preferences.days > 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-center h-full">
                          <div className="text-center">
                            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              +{preferences.days - 3} more days
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
