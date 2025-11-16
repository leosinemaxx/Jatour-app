"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Sparkles, 
  Calculator,
  ArrowRight,
  Check,
  X,
  Plus,
  Trash2,
  Navigation
} from "lucide-react";
import OpenStreetMapView from "@/components/maps/OpenStreetMapView";
import { LoadingSpinner } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import { transportationAPI } from "@/lib/transportation-api";

interface Preference {
  budget: number;
  days: number;
  travelers: number;
  interests: string[];
  cities: string[];
  startDate: string;
  accommodationType: "budget" | "moderate" | "luxury";
}

interface ItineraryItem {
  id: string;
  day: number;
  date: string;
  destinations: Array<{
    id: string;
    name: string;
    time: string;
    duration: string;
    coordinates?: { lat: number; lng: number };
  }>;
  accommodation?: {
    name: string;
    type: string;
    cost: number;
  };
  transportation?: {
    type: string;
    cost: number;
    route?: string;
  };
}

interface BudgetBreakdown {
  accommodation: number;
  transportation: number;
  food: number;
  activities: number;
  miscellaneous: number;
  total: number;
}

export default function SmartItinerarySection() {
  const [step, setStep] = useState<"preferences" | "itinerary" | "budget">("preferences");
  const [preferences, setPreferences] = useState<Preference>({
    budget: 0,
    days: 3,
    travelers: 2,
    interests: [],
    cities: [],
    startDate: "",
    accommodationType: "moderate",
  });
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const interests = ["Mountain", "Beach", "Temple", "Nature", "Park", "Museum", "Culinary", "Shopping"];
  const cities = ["Surabaya", "Malang", "Banyuwangi", "Probolinggo", "Bojonegoro", "Pasuruan", "Lumajang", "Pacitan"];

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleCity = (city: string) => {
    setPreferences(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  const generateItinerary = async () => {
    setLoading(true);
    try {
      // Call API to generate smart itinerary
      const recommendations = await apiClient.getRecommendations(
        "user-id", // Replace with actual user ID from auth context
        {
          budget: preferences.budget,
          days: preferences.days,
          interests: preferences.interests,
          city: preferences.cities[0] || undefined,
        }
      );

      // Get optimal route
      const destinationIds = recommendations.slice(0, preferences.days * 2).map((d: any) => d.id);
      const route = await apiClient.calculateRoute(destinationIds);

      // Process response and create itinerary with transportation
      const generatedItinerary: ItineraryItem[] = [];
      const destinationsPerDay = Math.ceil((route.length || recommendations.length) / preferences.days);
      
      for (let day = 1; day <= preferences.days; day++) {
        const date = new Date(preferences.startDate);
        date.setDate(date.getDate() + day - 1);
        
        const dayDestinations = (route.length > 0 ? route : recommendations)
          .slice((day - 1) * destinationsPerDay, day * destinationsPerDay)
          .map((dest: any, index: number) => ({
            id: dest.id,
            name: dest.name,
            time: index === 0 ? "09:00" : `${9 + index * 2}:00`,
            duration: "2 hours",
            coordinates: dest.coordinates || { lat: -7.2575, lng: 112.7521 },
          }));

        // Get transportation between cities if multiple cities
        let transportation;
        if (preferences.cities.length > 1 && day > 1) {
          const routes = await transportationAPI.getAllRoutes(
            preferences.cities[day - 2] || preferences.cities[0],
            preferences.cities[day - 1] || preferences.cities[0]
          );
          if (routes.length > 0) {
            transportation = {
              type: routes[0].type,
              cost: routes[0].price,
              route: `${routes[0].from.name} → ${routes[0].to.name}`,
            };
          }
        }

        generatedItinerary.push({
          id: `day-${day}`,
          day,
          date: date.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          destinations: dayDestinations,
          accommodation: {
            name: `${preferences.cities[day - 1] || preferences.cities[0]} Hotel`,
            type: preferences.accommodationType,
            cost: preferences.accommodationType === "budget" ? 200000 : 
                  preferences.accommodationType === "moderate" ? 500000 : 1000000,
          },
          transportation,
        });
      }
      
      setItinerary(generatedItinerary);
      setStep("itinerary");
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      // Fallback to mock data
      const mockItinerary: ItineraryItem[] = [];
      for (let day = 1; day <= preferences.days; day++) {
        const date = new Date(preferences.startDate);
        date.setDate(date.getDate() + day - 1);
        mockItinerary.push({
          id: `day-${day}`,
          day,
          date: date.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          destinations: [{
            id: `dest-${day}-1`,
            name: `Destination ${day}`,
            time: "09:00",
            duration: "2 hours",
            coordinates: { lat: -7.2575, lng: 112.7521 },
          }],
        });
      }
      setItinerary(mockItinerary);
      setStep("itinerary");
    } finally {
      setLoading(false);
    }
  };

  const calculateBudget = async () => {
    setLoading(true);
    try {
      // Calculate budget breakdown based on actual itinerary
      let accommodationCost = 0;
      let transportationCost = 0;

      // Calculate from itinerary
      itinerary.forEach((day) => {
        if (day.accommodation) {
          accommodationCost += day.accommodation.cost * preferences.travelers;
        }
        if (day.transportation) {
          transportationCost += day.transportation.cost * preferences.travelers;
        }
      });

      // If no accommodation in itinerary, use default calculation
      if (accommodationCost === 0) {
        accommodationCost = preferences.days * preferences.travelers * 
          (preferences.accommodationType === "budget" ? 200000 : 
           preferences.accommodationType === "moderate" ? 500000 : 1000000);
      }

      // If no transportation in itinerary, use default
      if (transportationCost === 0) {
        transportationCost = preferences.days * 150000 * preferences.travelers;
      }

      const foodCost = preferences.days * 200000 * preferences.travelers;
      const activitiesCost = preferences.days * 300000 * preferences.travelers;
      const miscellaneousCost = preferences.days * 100000 * preferences.travelers;

      const breakdown: BudgetBreakdown = {
        accommodation: accommodationCost,
        transportation: transportationCost,
        food: foodCost,
        activities: activitiesCost,
        miscellaneous: miscellaneousCost,
        total: accommodationCost + transportationCost + foodCost + activitiesCost + miscellaneousCost,
      };

      setBudgetBreakdown(breakdown);
      setStep("budget");
    } catch (error) {
      console.error("Failed to calculate budget:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Smart Itinerary</h1>
            <p className="text-gray-600 text-sm">AI-powered trip planning made easy</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex items-center gap-2" disabled={itinerary.length === 0}>
            <Calendar className="h-4 w-4" />
            Itinerary
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2" disabled={!budgetBreakdown}>
            <Calculator className="h-4 w-4" />
            Budget
          </TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (IDR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={preferences.budget || ""}
                    onChange={(e) => setPreferences(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    placeholder="5000000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="days">Number of Days</Label>
                  <Input
                    id="days"
                    type="number"
                    value={preferences.days}
                    onChange={(e) => setPreferences(prev => ({ ...prev, days: Number(e.target.value) }))}
                    min="1"
                    max="30"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="travelers">Number of Travelers</Label>
                  <Input
                    id="travelers"
                    type="number"
                    value={preferences.travelers}
                    onChange={(e) => setPreferences(prev => ({ ...prev, travelers: Number(e.target.value) }))}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={preferences.startDate}
                    onChange={(e) => setPreferences(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Accommodation Type */}
              <div>
                <Label>Accommodation Type</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(["budget", "moderate", "luxury"] as const).map((type) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPreferences(prev => ({ ...prev, accommodationType: type }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        preferences.accommodationType === type
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold capitalize">{type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {type === "budget" ? "IDR 200K/night" : type === "moderate" ? "IDR 500K/night" : "IDR 1M+/night"}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <Label>Your Interests</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {interests.map((interest) => (
                    <motion.button
                      key={interest}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        preferences.interests.includes(interest)
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {interest}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Cities */}
              <div>
                <Label>Preferred Cities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cities.map((city) => (
                    <motion.button
                      key={city}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCity(city)}
                      className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                        preferences.cities.includes(city)
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      {city}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={generateItinerary}
                  disabled={loading || !preferences.startDate || preferences.budget === 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" variant="travel" text="Generating..." />
                  ) : (
                    <>
                      Generate Smart Itinerary
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary" className="space-y-4">
          {itinerary.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Your Generated Itinerary</h2>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={calculateBudget}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 cursor-pointer active:scale-95 transition-all"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Budget
                  </Button>
                </motion.div>
              </div>

              {itinerary.map((day, index) => (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <CardTitle className="flex items-center justify-between">
                        <span>Day {day.day} - {day.date}</span>
                        <Badge className="bg-white/20 text-white">{day.destinations.length} Destinations</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {day.destinations.map((dest, destIndex) => (
                          <div key={dest.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                {destIndex + 1}
                              </div>
                              {destIndex < day.destinations.length - 1 && (
                                <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{dest.name}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{dest.time}</span>
                                    <span>•</span>
                                    <span>{dest.duration}</span>
                                  </div>
                                </div>
                                {dest.coordinates && (
                                  <Button
                                    className="border border-gray-300 bg-white hover:bg-gray-50"
                                    onClick={() => setSelectedDestination({
                                      lat: dest.coordinates!.lat,
                                      lng: dest.coordinates!.lng,
                                      name: dest.name
                                    })}
                                  >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    View Map
                                  </Button>
                                )}
                              </div>
                              {dest.coordinates && (
                                <div className="mt-3 rounded-lg overflow-hidden">
                                  <OpenStreetMapView
                                    lat={dest.coordinates.lat}
                                    lng={dest.coordinates.lng}
                                    name={dest.name}
                                    height="200px"
                                    zoom={15}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Transportation Info */}
                        {day.transportation && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Navigation className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-blue-900">Transportation</p>
                                  <p className="text-sm text-blue-700">{day.transportation.route}</p>
                                  <p className="text-xs text-blue-600 capitalize mt-1">{day.transportation.type}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-blue-900">
                                  IDR {day.transportation.cost.toLocaleString("id-ID")}
                                </p>
                                <p className="text-xs text-blue-600">per person</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Accommodation Info */}
                        {day.accommodation && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <Calendar className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-green-900">Accommodation</p>
                                  <p className="text-sm text-green-700">{day.accommodation.name}</p>
                                  <p className="text-xs text-green-600 capitalize mt-1">{day.accommodation.type}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-900">
                                  IDR {day.accommodation.cost.toLocaleString("id-ID")}
                                </p>
                                <p className="text-xs text-green-600">per night</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Generate your itinerary first in the Preferences tab</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          {budgetBreakdown ? (
            <>
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">Total Estimated Budget</p>
                      <p className="text-4xl font-bold">
                        IDR {budgetBreakdown.total.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Accommodation", value: budgetBreakdown.accommodation, color: "from-blue-500 to-cyan-500" },
                  { label: "Transportation", value: budgetBreakdown.transportation, color: "from-purple-500 to-pink-500" },
                  { label: "Food & Drinks", value: budgetBreakdown.food, color: "from-orange-500 to-red-500" },
                  { label: "Activities", value: budgetBreakdown.activities, color: "from-green-500 to-emerald-500" },
                  { label: "Miscellaneous", value: budgetBreakdown.miscellaneous, color: "from-gray-500 to-gray-600" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`bg-gradient-to-br ${item.color} text-white border-0`}>
                      <CardContent className="p-4">
                        <p className="text-sm opacity-90 mb-1">{item.label}</p>
                        <p className="text-2xl font-bold">IDR {item.value.toLocaleString("id-ID")}</p>
                        <p className="text-xs opacity-80 mt-1">
                          {((item.value / budgetBreakdown.total) * 100).toFixed(1)}% of total
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Budget Comparison</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Your Budget</span>
                      <span className="font-semibold">IDR {preferences.budget.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Estimated Cost</span>
                      <span className="font-semibold">IDR {budgetBreakdown.total.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-semibold">Remaining</span>
                      <span className={`font-bold text-lg ${
                        preferences.budget - budgetBreakdown.total >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        IDR {(preferences.budget - budgetBreakdown.total).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Calculate your budget from the Itinerary tab</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

