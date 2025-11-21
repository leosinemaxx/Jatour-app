"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Sparkles, Search } from "lucide-react";
import EnhancedItineraryViewer from "./enhanced-itinerary-viewer";

interface SmartItinerary {
  id: string;
  title: string;
  cities: string[];
  days: number;
  budget: number;
  status: "active" | "planned" | "completed";
  preferences: {
    theme: string;
    style: string;
  };
  createdAt: string;
  daysPlan: {
    day: number;
    title: string;
    activities: {
      name: string;
      duration: string;
      cost: number;
      type: string;
    }[];
  }[];
}

export default function ItinerarySection() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "completed" | "planned">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Interactive mock itineraries with rich data
  const [itineraries] = useState<SmartItinerary[]>([
    {
      id: "1",
      title: "Adventure in East Java",
      cities: ["Surabaya", "Bromo", "Malang"],
      days: 5,
      budget: 2500000,
      status: "active",
      preferences: { theme: "Adventure", style: "Budget" },
      createdAt: "2024-11-20",
      daysPlan: [
        {
          day: 1,
          title: "Arrival & Surabaya City Tour",
          activities: [
            { name: "Surabaya City Tour", duration: "4 hours", cost: 500000, type: "tour" },
            { name: "Tugu Pahlawan", duration: "2 hours", cost: 0, type: "sightseeing" },
            { name: "Local Dinner", duration: "1 hour", cost: 150000, type: "food" }
          ]
        },
        {
          day: 2,
          title: "Mount Bromo Adventure",
          activities: [
            { name: "Bromo Sunrise Tour", duration: "6 hours", cost: 800000, type: "adventure" },
            { name: "Bromo Crater Hiking", duration: "3 hours", cost: 0, type: "adventure" },
            { name: "Desert Jeep Tour", duration: "2 hours", cost: 400000, type: "adventure" }
          ]
        },
        {
          day: 3,
          title: "Malang Exploration",
          activities: [
            { name: "Museum Angkut", duration: "3 hours", cost: 120000, type: "cultural" },
            { name: "Jatim Park", duration: "4 hours", cost: 200000, type: "entertainment" }
          ]
        }
      ]
    },
    {
      id: "2",
      title: "Culinary Journey",
      cities: ["Malang", "Batu"],
      days: 3,
      budget: 1500000,
      status: "completed",
      preferences: { theme: "Food & Culture", style: "Moderate" },
      createdAt: "2024-11-15",
      daysPlan: [
        {
          day: 1,
          title: "Malang Food Tour",
          activities: [
            { name: "Bakso Malang Experience", duration: "2 hours", cost: 100000, type: "food" },
            { name: "Traditional Market Tour", duration: "3 hours", cost: 0, type: "cultural" },
            { name: "Warung Style Dinner", duration: "1 hour", cost: 80000, type: "food" }
          ]
        },
        {
          day: 2,
          title: "Batu Cool City",
          activities: [
            { name: "Apple Garden Picking", duration: "2 hours", cost: 50000, type: "activity" },
            { name: "Alun Alun Batu", duration: "1 hour", cost: 0, type: "sightseeing" }
          ]
        }
      ]
    },
    {
      id: "3",
      title: "Cultural Heritage Tour",
      cities: ["Probolinggo", "Tulungagung"],
      days: 4,
      budget: 1800000,
      status: "planned",
      preferences: { theme: "Culture", style: "Budget" },
      createdAt: "2024-11-18",
      daysPlan: [
        {
          day: 1,
          title: "Probolinggo Heritage",
          activities: [
            { name: "Probolinggo Old Town", duration: "3 hours", cost: 0, type: "sightseeing" },
            { name: "Traditional Crafts Workshop", duration: "2 hours", cost: 150000, type: "cultural" }
          ]
        },
        {
          day: 2,
          title: "Temple Discovery",
          activities: [
            { name: "Candi Penataran", duration: "4 hours", cost: 100000, type: "cultural" },
            { name: "Local Village Visit", duration: "2 hours", cost: 0, type: "cultural" }
          ]
        }
      ]
    }
  ]);

  // Filter itineraries based on search and filter
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(itinerary =>
        itinerary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itinerary.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (selectedFilter !== "all") {
      filtered = filtered.filter(itinerary => itinerary.status === selectedFilter);
    }

    return filtered;
  }, [itineraries, searchTerm, selectedFilter]);

  const stats = useMemo(() => {
    const total = itineraries.length;
    const active = itineraries.filter(i => i.status === "active").length;
    const completed = itineraries.filter(i => i.status === "completed").length;
    const planned = itineraries.filter(i => i.status === "planned").length;
    
    return { total, active, completed, planned };
  }, [itineraries]);

  // Handler to redirect to preferences page
  const handleCreateNew = () => {
    router.push("/dashboard/homepage/preferences");
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Itinerary (Beta)</h1>
          <p className="text-gray-600">Manage and view your travel plans</p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Trips</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Plans</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <Sparkles className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Planned</p>
                <p className="text-2xl font-bold text-orange-900">{stats.planned}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search itineraries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-12 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "planned", label: "Planned" },
            { key: "completed", label: "Completed" },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? "default" : "outline"}
              onClick={() => setSelectedFilter(filter.key as any)}
              className="rounded-2xl"
              size="sm"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Itinerary Viewer - NOW TRULY INTERACTIVE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredItineraries.length > 0 ? (
          <EnhancedItineraryViewer itineraries={filteredItineraries} />
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    No itineraries found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedFilter !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Create your first itinerary to get started"}
                  </p>
                </div>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Itinerary
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
