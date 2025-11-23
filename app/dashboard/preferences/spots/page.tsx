"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { useDestinations } from "@/lib/hooks/useDestinations";
import { Button } from "@/components/ui/button";
import { Search, XCircle, Plus, Camera } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavbarDash from "@/app/components/navbar-dash";

export default function SpotsPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const { destinations } = useDestinations();
   const { preferences, togglePreferredSpot } = useSmartItinerary();
   const [spotQuery, setSpotQuery] = useState("");
   const [customSpot, setCustomSpot] = useState("");
   const [showCustomInput, setShowCustomInput] = useState(false);

   const from = searchParams.get('from');
   const [selectedSpots, setSelectedSpots] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSpots(preferences.preferredSpots);
  }, [preferences.preferredSpots]);

  const filteredSpots = destinations
    .filter(dest => dest.name.toLowerCase().includes(spotQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSpotToggle = (spot: string) => {
    togglePreferredSpot(spot);
    setSelectedSpots(prev => 
      prev.includes(spot) 
        ? prev.filter(s => s !== spot)
        : [...prev, spot]
    );
  };

  const handleAddCustomSpot = () => {
    if (customSpot.trim()) {
      togglePreferredSpot(customSpot.trim());
      setCustomSpot("");
      setShowCustomInput(false);
    }
  };

  const handleContinue = () => {
    router.push("/dashboard/preferences/logistics");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Destinasi Favorit</h1>
          <p className="text-gray-600">Pilih tempat-tempat yang ingin dikunjungi</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Quick Selection Buttons */}
        {destinations.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Pilih Cepat:</h3>
            <div className="flex flex-wrap gap-2">
              {["Borobudur", "Ubud", "Mount Bromo", "Kuta Beach", "Prambanan"].map((spot) => {
                const dest = destinations.find(d => d.name === spot);
                if (dest) {
                  return (
                    <button
                      key={spot}
                      onClick={() => handleSpotToggle(dest.name)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedSpots.includes(dest.name)
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {dest.name}
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari destinasi..."
            value={spotQuery}
            onChange={(e) => setSpotQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        {/* Selected Spots */}
        {selectedSpots.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Destinasi Terpilih ({selectedSpots.length}):</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSpots.map(spot => (
                <div key={spot} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs">
                  <span className="text-purple-700">{spot}</span>
                  <button onClick={() => handleSpotToggle(spot)} className="hover:text-purple-900">
                    <XCircle className="h-3 w-3 text-purple-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spots Grid with Small Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 max-h-[70vh] overflow-y-auto">
          {filteredSpots.map(dest => (
            <Card
              key={dest.name}
              onClick={() => handleSpotToggle(dest.name)}
              className={`cursor-pointer transition-all hover:shadow-sm ${
                selectedSpots.includes(dest.name)
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-white hover:border-purple-300"
              }`}
            >
              {/* Destination Image */}
              <div className="relative h-20 w-full mb-1">
                {dest.imageUrl || dest.image ? (
                  <Image
                    src={dest.imageUrl || dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover rounded-t-lg"
                    priority={false}
                  />
                ) : (
                  <div className="relative h-20 w-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                    <Camera className="h-5 w-5 text-gray-400 opacity-40" />
                  </div>
                )}
                
                {/* Selection Indicator */}
                {selectedSpots.includes(dest.name) && (
                  <div className="absolute top-1 right-1">
                    <div className="w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center">
                      ✓
                    </div>
                  </div>
                )}
              </div>

              {/* Destination Info */}
              <CardContent className="pt-0 pb-1 px-2">
                <div className="text-xs font-medium text-gray-900 line-clamp-1">
                  {dest.name}
                </div>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                  📍 {dest.city}
                </p>
              </CardContent>
            </Card>
          ))}
          {filteredSpots.length === 0 && spotQuery && (
            <div className="col-span-3 text-center py-8 text-sm text-gray-500">
              Tidak ada destinasi ditemukan untuk "{spotQuery}"
            </div>
          )}
        </div>

        {/* Add Custom Spot */}
        {showCustomInput ? (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <input
              type="text"
              placeholder="Nama destinasi..."
              value={customSpot}
              onChange={(e) => setCustomSpot(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddCustomSpot}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Tambah Destinasi
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="w-full mb-8 py-3 text-purple-600 hover:text-purple-700 font-medium"
          >
            <Plus className="h-5 w-5 inline mr-2" /> Tambah destinasi lainnya
          </button>
        )}

        {/* Navigation Buttons */}
         <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-md w-full mx-4">
           <div className="flex justify-between items-center gap-3">
             {from === 'planning' ? (
               <Button
                 onClick={() => router.push("/dashboard/smart/planning#itinerary")}
                 className="bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600 flex-1"
               >
                 ← Kembali ke Planning
               </Button>
             ) : (
               <Button
                 onClick={() => router.push("/dashboard/preferences/cities")}
                 className="bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600 flex-1"
               >
                 ← Kembali
               </Button>
             )}
             <Button
               onClick={handleContinue}
               disabled={selectedSpots.length === 0}
               className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 text-sm hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-2"
             >
               {selectedSpots.length > 0 ? 'Lanjut ke Detail Perjalanan →' : 'Pilih Destinasi Dahulu'}
             </Button>
           </div>

           {selectedSpots.length === 0 && (
             <p className="text-xs text-gray-500 text-center mt-2">
               Silakan pilih minimal 1 destinasi untuk melanjutkan
             </p>
           )}
         </div>
      </div>
    </div>
  );
}
