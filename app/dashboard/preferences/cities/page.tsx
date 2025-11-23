"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { useDestinations } from "@/lib/hooks/useDestinations";
import { Button } from "@/components/ui/button";
import { Search, XCircle, Plus } from "lucide-react";
import NavbarDash from "@/app/components/navbar-dash";

export default function CitiesPage() {
  const router = useRouter();
  const { destinations } = useDestinations();
  const { preferences, toggleCity } = useSmartItinerary();
  const [cityQuery, setCityQuery] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCities(preferences.cities);
  }, [preferences.cities]);

  const filteredCities = destinations
    .filter(dest => dest.city.toLowerCase().includes(cityQuery.toLowerCase()))
    .map(dest => dest.city)
    .filter((city, index, arr) => arr.indexOf(city) === index)
    .sort();

  const handleCityToggle = (city: string) => {
    toggleCity(city);
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const handleAddCustomCity = () => {
    if (customCity.trim()) {
      toggleCity(customCity.trim());
      setCustomCity("");
      setShowCustomInput(false);
    }
  };

  const handleContinue = () => {
    if (selectedCities.length === 0) {
      alert("Pilih minimal 1 kota tujuan");
      return;
    }
    router.push("/dashboard/preferences/spots");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kota Tujuan</h1>
          <p className="text-gray-600">Pilih kota yang ingin kamu kunjungi</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kota..."
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selected Cities */}
        {selectedCities.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Kota Terpilih:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedCities.map(city => (
                <div key={city} className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
                  <span>{city}</span>
                  <button onClick={() => handleCityToggle(city)} className="hover:text-green-900">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-96 overflow-y-auto">
          {filteredCities.map(city => (
            <button
              key={city}
              onClick={() => handleCityToggle(city)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedCities.includes(city)
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-green-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{city}</span>
                {selectedCities.includes(city) && (
                  <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                    ✓
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Add Custom City */}
        {showCustomInput ? (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <input
              type="text"
              placeholder="Nama kota..."
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddCustomCity}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Tambah Kota
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
            className="w-full mb-8 py-3 text-green-600 hover:text-green-700 font-medium"
          >
            <Plus className="h-5 w-5 inline mr-2" /> Tambah kota lainnya
          </button>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={() => router.push("/dashboard/preferences/themes")}
            className="bg-gray-500 text-white px-6 py-3 hover:bg-gray-600"
          >
            Kembali ke Gaya Liburan
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedCities.length === 0}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 disabled:opacity-50"
          >
            Lanjut ke Destinasi Favorit
          </Button>
        </div>
      </div>
    </div>
  );
}
