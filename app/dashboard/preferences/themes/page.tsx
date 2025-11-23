"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import NavbarDash from "@/app/components/navbar-dash";

interface ThemeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  color: string;
}

const themeOptions: ThemeOption[] = [
  { id: "nature", title: "Alam", description: "Gunung, hutan, air terjun", icon: () => <div className="h-5 w-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded"></div>, color: "from-emerald-100 to-emerald-200" },
  { id: "beach", title: "Pantai", description: "Sunset, laut, pasir", icon: () => <div className="h-5 w-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>, color: "from-blue-100 to-blue-200" },
  { id: "culture", title: "Budaya", description: "Candi, museum, tradisi", icon: () => <div className="h-5 w-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded"></div>, color: "from-orange-100 to-orange-200" },
  { id: "culinary", title: "Kuliner", description: "Street food, kopi, pasar", icon: () => <div className="h-5 w-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded"></div>, color: "from-amber-100 to-amber-200" },
  { id: "family", title: "Keluarga", description: "Ramah anak, edukatif", icon: () => <div className="h-5 w-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded"></div>, color: "from-purple-100 to-purple-200" },
  { id: "adventure", title: "Petualangan", description: "Rafting, hiking, ekstrem", icon: () => <div className="h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 rounded"></div>, color: "from-red-100 to-red-200" },
];

export default function ThemesPage() {
  const router = useRouter();
  const { preferences, toggleTheme } = useSmartItinerary();
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  useEffect(() => {
    setSelectedThemes(preferences.themes);
  }, [preferences.themes]);

  const handleThemeToggle = (themeId: string) => {
    toggleTheme(themeId);
    setSelectedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(t => t !== themeId)
        : [...prev, themeId]
    );
  };

  const handleContinue = () => {
    if (selectedThemes.length === 0) {
      alert("Pilih minimal 1 gaya liburan");
      return;
    }
    router.push("/dashboard/preferences/cities");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gaya Liburan</h1>
          <p className="text-gray-600">Pilih jenis wisata yang kamu suka</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {themeOptions.map((theme) => {
            const isActive = selectedThemes.includes(theme.id);
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeToggle(theme.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${theme.color}`}>
                    <theme.icon />
                  </div>
                  <span className="font-semibold text-gray-900 text-lg flex-1">{theme.title}</span>
                  {isActive && <CheckCircle className="h-6 w-6 text-blue-500" />}
                </div>
                <p className="text-gray-600">{theme.description}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Themes */}
        {selectedThemes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Gaya Terpilih:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedThemes.map(themeId => {
                const theme = themeOptions.find(t => t.id === themeId);
                return (
                  <div key={themeId} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm">
                    <span>{theme?.title}</span>
                    <button onClick={() => handleThemeToggle(themeId)} className="hover:text-blue-900">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={selectedThemes.length === 0}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 text-lg disabled:opacity-50"
          >
            Lanjut ke Kota Tujuan
          </Button>
        </div>
      </div>
    </div>
  );
}
