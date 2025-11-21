"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Filter,
  Map as MapIcon,
  Globe,
  SlidersHorizontal,
  X
} from "lucide-react";
import DestCardEnhanced from "@/components/dest-card-enhanced";
import DestinationDetailModal from "@/components/destination-detail-modal";
import { LoadingSkeleton } from "@/components/ui/loading";
import { useDestinations } from "@/lib/hooks/useDestinations";
import type { Destination } from "@/app/datatypes";

// Destination type categories
const destinationTypes = [
  { name: "All", value: null },
  { name: "Mountain", value: "Mountain" },
  { name: "Beach", value: "Beach" },
  { name: "Temple", value: "Temple" },
  { name: "Nature", value: "Nature" },
  { name: "Park", value: "Park" },
  { name: "Museum", value: "Museum" },
];

// Price range options
const priceRanges = [
  { name: "All", value: null },
  { name: "Budget", value: "budget" },
  { name: "Moderate", value: "moderate" },
  { name: "Luxury", value: "luxury" },
];

export default function FeedPage() {
  const { destinations, isLoading: loading } = useDestinations();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");

  // Filter destinations based on all criteria
  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.city.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = !selectedType || d.category === selectedType;
      const matchesPriceRange = !selectedPriceRange || d.priceRange === selectedPriceRange;
      const matchesLocation = !locationFilter || 
        d.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
        d.province?.toLowerCase().includes(locationFilter.toLowerCase());
      
      return matchesSearch && matchesType && matchesPriceRange && matchesLocation;
    });
  }, [destinations, search, selectedType, selectedPriceRange, locationFilter]);

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedPriceRange(null);
    setLocationFilter("");
    setSearch("");
  };

  const hasActiveFilters = selectedType || selectedPriceRange || locationFilter || search;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Destination Feed
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Explore destinations with detailed information, maps, and more
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 shadow-sm"
          />
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${
              hasActiveFilters ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
            }`}
            size="sm"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </motion.div>

      {/* Filters Section */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 space-y-4">
              {/* Location Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="Filter by city or province..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Destination Type Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapIcon className="h-4 w-4" />
                  Destination Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {destinationTypes.map((type) => (
                    <Button
                      key={type.name}
                      onClick={() => setSelectedType(type.value)}
                      size="sm"
                      className={`${
                        selectedType === type.value
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <Button
                      key={range.name}
                      onClick={() => setSelectedPriceRange(range.value)}
                      size="sm"
                      className={`${
                        selectedPriceRange === range.value
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {range.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-0"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {search && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
              Search: {search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearch("")}
              />
            </Badge>
          )}
          {selectedType && (
            <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
              Type: {selectedType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedType(null)}
              />
            </Badge>
          )}
          {selectedPriceRange && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
              Price: {selectedPriceRange}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedPriceRange(null)}
              />
            </Badge>
          )}
          {locationFilter && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1">
              Location: {locationFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setLocationFilter("")}
              />
            </Badge>
          )}
        </motion.div>
      )}

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filtered.length}</span> destination{filtered.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Destinations Grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : filtered.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((dest, index) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <DestCardEnhanced
                item={dest}
                onClick={() => setSelectedDestination(dest)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No destinations found
                </h3>
                <p className="text-sm text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destination Detail Modal - includes map, website visit, and all features */}
      {selectedDestination && (
        <DestinationDetailModal
          destination={selectedDestination}
          isOpen={!!selectedDestination}
          onClose={() => setSelectedDestination(null)}
        />
      )}
    </div>
  );
}
