"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Tag, Sparkles } from "lucide-react";
import NavbarDash from "@/app/components/navbar-dash";

export default function LogisticsPage() {
  const router = useRouter();
  const { preferences, updatePreferences } = useSmartItinerary();
  const [formData, setFormData] = useState({
    startDate: preferences.startDate,
    days: preferences.days,
    travelers: preferences.travelers,
    notes: preferences.notes
  });

  useEffect(() => {
    setFormData({
      startDate: preferences.startDate,
      days: preferences.days,
      travelers: preferences.travelers,
      notes: preferences.notes
    });
  }, [preferences]);

  const handleInputChange = (field: string, value: any) => {
    let validatedValue = value;

    // Validate and clamp travelers (1-20)
    if (field === 'travelers') {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 1) {
        validatedValue = 1;
      } else if (numValue > 20) {
        validatedValue = 20;
      } else {
        validatedValue = numValue;
      }
    }

    // Validate and clamp days (1-30)
    if (field === 'days') {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 1) {
        validatedValue = 1;
      } else if (numValue > 30) {
        validatedValue = 30;
      } else {
        validatedValue = numValue;
      }
    }

    const updatedData = { ...formData, [field]: validatedValue };
    setFormData(updatedData);
    updatePreferences(updatedData);
  };

  const handleContinue = () => {
    if (!formData.startDate || !formData.days || !formData.travelers) {
      alert("Mohon lengkapi tanggal, durasi, dan jumlah traveler");
      return;
    }
    router.push("/dashboard/preferences/smart-budget");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detail Perjalanan</h1>
          <p className="text-gray-600">Atur jadwal dan kebutuhan perjalananmu</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Durasi (hari)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.days}
                onChange={(e) => handleInputChange('days', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="5"
              />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Jumlah Traveler
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.travelers}
                onChange={(e) => handleInputChange('travelers', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Kebutuhan Khusus
              </label>
              <textarea
                rows={4}
                placeholder="Contoh: ramah anak, vegetarian, akses kursi roda"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-8 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-yellow-500" />
            Ringkasan Perjalanan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-gray-600">Gaya Liburan:</span>
              <div className="mt-2 flex flex-wrap gap-1">
                {preferences.themes.length > 0 ? (
                  preferences.themes.map(theme => (
                    <span key={theme} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                      {theme}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">Belum dipilih</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Kota Tujuan:</span>
              <div className="mt-2 flex flex-wrap gap-1">
                {preferences.cities.length > 0 ? (
                  preferences.cities.map(city => (
                    <span key={city} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                      {city}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">Belum dipilih</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Destinasi:</span>
              <div className="mt-2 flex flex-wrap gap-1">
                {preferences.preferredSpots.length > 0 ? (
                  preferences.preferredSpots.slice(0, 3).map(spot => (
                    <span key={spot} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                      {spot}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">Belum dipilih</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Detail Perjalanan:</span>
              <div className="mt-2 space-y-1">
                <div className="text-gray-700">
                  {formData.startDate ? `Mulai: ${new Date(formData.startDate).toLocaleDateString('id-ID')}` : "Tanggal: Belum diisi"}
                </div>
                <div className="text-gray-700">
                  {formData.days ? `${formData.days} hari` : "Durasi: Belum diisi"}
                </div>
                <div className="text-gray-700">
                  {formData.travelers ? `${formData.travelers} orang` : "Traveler: Belum diisi"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={() => router.push("/dashboard/preferences/spots")}
            className="bg-gray-500 text-white px-6 py-3 hover:bg-gray-600"
          >
            Kembali ke Destinasi Favorit
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!formData.startDate || !formData.days || !formData.travelers}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 disabled:opacity-50"
          >
            Lanjut ke Smart Budget
          </Button>
        </div>
      </div>
    </div>
  );
}
