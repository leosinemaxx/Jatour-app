"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Plus,
  MapPin,
  Clock,
  User,
  Sparkles,
  Search,
  Tag,
  Heart,
  Leaf,
  Waves,
  Landmark,
  Utensils,
  Users,
  Activity,
  Calendar,
  Brain,
  TrendingUp,
  DollarSign,
  Lightbulb,
  Target,
  Zap,
  Award,
  AlertCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { capitalize } from "@/lib/utils";
import { useDestinations } from "@/lib/hooks/useDestinations";
import { LoadingSkeleton } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type StageKey = "themes" | "cities" | "spots" | "logistics" | "smart-budget" | "optimization";

interface ThemeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  color: string;
}

const themeOptions: ThemeOption[] = [
  { id: "nature", title: "Alam", description: "Gunung, hutan, air terjun", icon: () => <Leaf className="h-5 w-5" />, color: "from-emerald-100 to-emerald-200" },
  { id: "beach", title: "Pantai", description: "Sunset, laut, pasir", icon: () => <Waves className="h-5 w-5" />, color: "from-blue-100 to-blue-200" },
  { id: "culture", title: "Budaya", description: "Candi, museum, tradisi", icon: () => <Landmark className="h-5 w-5" />, color: "from-orange-100 to-orange-200" },
  { id: "culinary", title: "Kuliner", description: "Street food, kopi, pasar", icon: () => <Utensils className="h-5 w-5" />, color: "from-amber-100 to-amber-200" },
  { id: "family", title: "Keluarga", description: "Ramah anak, edukatif", icon: () => <Users className="h-5 w-5" />, color: "from-purple-100 to-purple-200" },
  { id: "adventure", title: "Petualangan", description: "Rafting, hiking, ekstrem", icon: () => <Activity className="h-5 w-5" />, color: "from-red-100 to-red-200" },
];

const stageConfigs = [
  { key: "themes", title: "Gaya Liburan", subtitle: "Pilih jenis wisata yang kamu suka" },
  { key: "cities", title: "Kota Tujuan", subtitle: "Pilih kota yang ingin dikunjungi" },
  { key: "spots", title: "Destinasi Favorit", subtitle: "Pilih tempat-tempat spesifik" },
  { key: "logistics", title: "Detail Perjalanan", subtitle: "Atur jadwal dan kebutuhan" },
  { key: "smart-budget", title: "Smart Budget", subtitle: "Atur budget & optimasi ML" },
  { key: "optimization", title: "Optimasi ML", subtitle: "Tinjau rekomendasi AI" },
];

export default function PreferencesPage() {
  const router = useRouter();
  const { destinations } = useDestinations();
  const { preferences, updatePreferences, toggleCity, toggleTheme, togglePreferredSpot, generateItinerary, generating } = useSmartItinerary();

  const [currentStage, setCurrentStage] = useState(0);
  const [cityQuery, setCityQuery] = useState("");
  const [spotQuery, setSpotQuery] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customSpot, setCustomSpot] = useState("");
  const [showCustomInput, setShowCustomInput] = useState<{ city: boolean; spot: boolean }>({ city: false, spot: false });

  const filteredCities = useMemo(() => {
    if (!destinations.length) return [];
    const filtered = destinations
      .filter(dest => dest.city.toLowerCase().includes(cityQuery.toLowerCase()))
      .map(dest => dest.city)
      .filter((city, index, arr) => arr.indexOf(city) === index)
      .sort();
    return filtered;
  }, [destinations, cityQuery]);

  const filteredSpots = useMemo(() => {
    if (!destinations.length) return [];
    return destinations
      .filter(dest => dest.name.toLowerCase().includes(spotQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [destinations, spotQuery]);

  const currentStageKey = stageConfigs[currentStage].key;
  const progress = ((currentStage + 1) / stageConfigs.length) * 100;

  const handleNext = () => {
    if (currentStageKey === "themes" && preferences.themes.length === 0) return;
    if (currentStage < stageConfigs.length - 1) {
      setCurrentStage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
    }
  };

  const handleAddCustomCity = () => {
    if (customCity.trim()) {
      toggleCity(capitalize(customCity.trim()));
      setCustomCity("");
      setShowCustomInput(prev => ({ ...prev, city: false }));
    }
  };

  const handleAddCustomSpot = () => {
    if (customSpot.trim()) {
      togglePreferredSpot(capitalize(customSpot.trim()));
      setCustomSpot("");
      setShowCustomInput(prev => ({ ...prev, spot: false }));
    }
  };

  const handleGenerate = async () => {
    if (!preferences.startDate || !preferences.days || !preferences.travelers) {
      alert("Mohon lengkapi tanggal, durasi, dan jumlah traveler");
      return;
    }
    
    try {
      console.log('🚀 Starting itinerary generation from preferences page...');
      await generateItinerary();
      console.log('✅ Itinerary generation completed, navigating to plan page...');
      
      // Add a small delay to ensure context updates are propagated
      setTimeout(() => {
        router.push("/dashboard/plan");
      }, 100);
    } catch (error) {
      console.error('❌ Itinerary generation failed:', error);
      alert("Gagal membuat itinerary. Silakan coba lagi.");
    }
  };

  if (!destinations.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <LoadingSkeleton className="h-8 w-64 mb-4" />
          <LoadingSkeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <LoadingSkeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Atur Preferensi Liburan</h1>
          <p className="text-gray-600">Bantu kami memberikan rekomendasi terbaik untukmu</p>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-600">{currentStage + 1} / {stageConfigs.length}</span>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-2">
          {stageConfigs.map((stage, index) => (
            <button
              key={stage.key}
              onClick={() => setCurrentStage(index)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                index === currentStage
                  ? "bg-blue-500 text-white"
                  : index < currentStage
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {stage.title}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Stage Content */}
        {currentStageKey === "themes" && (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gaya Liburan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themeOptions.map((theme) => {
                const Icon = theme.icon;
                const isActive = preferences.themes.includes(theme.id);
                return (
                  <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.color}`}>
                        <Icon />
                      </div>
                      <span className="font-semibold text-gray-900">{theme.title}</span>
                      {isActive && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />}
                    </div>
                    <p className="text-sm text-gray-600">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStageKey === "cities" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Kota Tujuan</h2>
              <p className="text-gray-600 mb-4">Pilih kota yang ingin kamu kunjungi</p>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kota..."
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selected Cities */}
              {preferences.cities.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Terpilih:</h3>
                  <div className="flex flex-wrap gap-2">
                    {preferences.cities.map(city => (
                      <div key={city} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <span>{city}</span>
                        <button onClick={() => toggleCity(city)} className="hover:text-blue-900">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* City Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredCities.map(city => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      preferences.cities.includes(city)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{city}</span>
                      {preferences.cities.includes(city) && <CheckCircle className="h-5 w-5 text-blue-500" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Add Custom City */}
              {showCustomInput.city ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Nama kota..."
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomCity}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Tambah
                    </button>
                    <button
                      onClick={() => setShowCustomInput(prev => ({ ...prev, city: false }))}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(prev => ({ ...prev, city: true }))}
                  className="mt-4 w-full py-2 text-blue-500 hover:text-blue-700 font-medium"
                >
                  <Plus className="h-4 w-4 inline mr-1" /> Tambah kota lainnya
                </button>
              )}
            </div>
          </div>
        )}

        {currentStageKey === "spots" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Destinasi Favorit</h2>
              <p className="text-gray-600 mb-4">Pilih tempat-tempat yang ingin dikunjungi</p>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari destinasi..."
                  value={spotQuery}
                  onChange={(e) => setSpotQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selected Spots */}
              {preferences.preferredSpots.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Terpilih:</h3>
                  <div className="flex flex-wrap gap-2">
                    {preferences.preferredSpots.map(spot => (
                      <div key={spot} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        <span>{spot}</span>
                        <button onClick={() => togglePreferredSpot(spot)} className="hover:text-purple-900">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredSpots.map(dest => (
                  <button
                    key={dest.name}
                    onClick={() => togglePreferredSpot(dest.name)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      preferences.preferredSpots.includes(dest.name)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{dest.name}</span>
                        <p className="text-sm text-gray-500">{dest.city}</p>
                      </div>
                      {preferences.preferredSpots.includes(dest.name) && <CheckCircle className="h-5 w-5 text-purple-500" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Add Custom Spot */}
              {showCustomInput.spot ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Nama destinasi..."
                    value={customSpot}
                    onChange={(e) => setCustomSpot(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomSpot}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      Tambah
                    </button>
                    <button
                      onClick={() => setShowCustomInput(prev => ({ ...prev, spot: false }))}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(prev => ({ ...prev, spot: true }))}
                  className="mt-4 w-full py-2 text-purple-500 hover:text-purple-700 font-medium"
                >
                  <Plus className="h-4 w-4 inline mr-1" /> Tambah destinasi lainnya
                </button>
              )}
            </div>
          </div>
        )}

        {currentStageKey === "logistics" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Detail Perjalanan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={preferences.startDate}
                    onChange={(e) => updatePreferences({ startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Durasi (hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={preferences.days}
                    onChange={(e) => updatePreferences({ days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Jumlah Traveler
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={preferences.travelers}
                    onChange={(e) => updatePreferences({ travelers: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Kebutuhan Khusus
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: ramah anak, vegetarian, akses kursi roda"
                    value={preferences.notes}
                    onChange={(e) => updatePreferences({ notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <Sparkles className="h-5 w-5 inline mr-2" />
                Ringkasan Perjalanan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Gaya Liburan:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {preferences.themes.length > 0 ? (
                      preferences.themes.map(theme => (
                        <span key={theme} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {themeOptions.find(t => t.id === theme)?.title || theme}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">Belum dipilih</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Kota Tujuan:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {preferences.cities.length > 0 ? (
                      preferences.cities.map(city => (
                        <span key={city} className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
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
                  <div className="mt-1 flex flex-wrap gap-1">
                    {preferences.preferredSpots.length > 0 ? (
                      preferences.preferredSpots.slice(0, 3).map(spot => (
                        <span key={spot} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {spot}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">Belum dipilih</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Detail:</span>
                  <div className="mt-1 space-y-1">
                    <div className="text-gray-700">{preferences.startDate ? `Mulai: ${preferences.startDate}` : "Tanggal: Belum diisi"}</div>
                    <div className="text-gray-700">{preferences.days ? `${preferences.days} hari` : "Durasi: Belum diisi"}</div>
                    <div className="text-gray-700">{preferences.travelers ? `${preferences.travelers} orang` : "Traveler: Belum diisi"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStageKey === "smart-budget" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Smart Budget</h2>
              <p className="text-gray-600 mb-4">Atur budget & optimasi cerdas berbasis AI</p>
              
              {/* ML Insights Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Brain className="h-5 w-5" />
                      AI Personalization Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">75%</div>
                        <div className="text-sm text-gray-600">Activity Lover</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">82%</div>
                        <div className="text-sm text-gray-600">Value Seeker</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">68%</div>
                        <div className="text-sm text-gray-600">Spontaneous</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">85%</div>
                        <div className="text-sm text-gray-600">Explorer</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <TrendingUp className="h-5 w-5" />
                      Budget Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Estimated Budget</span>
                        <span className="font-medium">IDR {preferences.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>AI Optimized</span>
                        <span className="font-medium text-green-600">IDR {(preferences.budget * 0.75).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Savings Potential</span>
                        <span className="font-medium text-green-600">25%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Smart Recommendations */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50">
                      <Zap className="h-4 w-4 text-yellow-600 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">Adventure Optimizer</div>
                        <div className="text-sm text-gray-600">Based on your high activity preference, we recommend adding more outdoor adventures.</div>
                      </div>
                      <Badge variant="secondary">85% match</Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                      <DollarSign className="h-4 w-4 text-green-600 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">Budget Optimizer</div>
                        <div className="text-sm text-gray-600">We've identified cost-effective alternatives that match your preferences.</div>
                      </div>
                      <Badge variant="secondary">78% match</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Total Budget (IDR)
                      </label>
                      <input
                        type="number"
                        value={preferences.budget}
                        onChange={(e) => updatePreferences({ budget: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accommodation Type
                      </label>
                      <select
                        value={preferences.accommodationType}
                        onChange={(e) => updatePreferences({ accommodationType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="budget">Budget</option>
                        <option value="moderate">Moderate</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ML Optimization Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Priority Weights</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Cost Optimization</span>
                          <span className="text-sm font-medium">30%</span>
                        </div>
                        <Progress value={30} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Time Efficiency</span>
                          <span className="text-sm font-medium">20%</span>
                        </div>
                        <Progress value={20} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Satisfaction</span>
                          <span className="text-sm font-medium">50%</span>
                        </div>
                        <Progress value={50} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {currentStageKey === "optimization" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Optimasi ML</h2>
              <p className="text-gray-600 mb-4">Tinjau rekomendasi AI sebelum generate itinerary</p>
              
              {/* Optimization Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Target className="h-5 w-5" />
                      Cost Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 mb-2">Up to 25% savings</div>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Smart vendor negotiations</li>
                      <li>• Off-peak timing optimization</li>
                      <li>• Bundle deal recommendations</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Clock className="h-5 w-5" />
                      Time Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 mb-2">30% faster travel</div>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Optimized routing</li>
                      <li>• Crowd avoidance</li>
                      <li>• Smart scheduling</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <Star className="h-5 w-5" />
                      Satisfaction Boost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600 mb-2">40% higher satisfaction</div>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Personalized recommendations</li>
                      <li>• Preference matching</li>
                      <li>• Hidden gems discovery</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Expected Results */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Expected ML Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">AI-Powered Features</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Behavioral preference learning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Dynamic pricing optimization</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Real-time crowd predictions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Weather-aware scheduling</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Personalization Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Interest Match</span>
                            <span>92%</span>
                          </div>
                          <Progress value={92} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Budget Alignment</span>
                            <span>87%</span>
                          </div>
                          <Progress value={87} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Style Preference</span>
                            <span>94%</span>
                          </div>
                          <Progress value={94} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Smart Itinerary Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <div className="mt-1 bg-green-50 text-green-700 px-2 py-1 rounded-full inline-block">
                        {preferences.budget ? `IDR ${preferences.budget.toLocaleString()}` : "Belum diatur"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Destinasi:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {preferences.preferredSpots.length > 0 ? (
                          preferences.preferredSpots.slice(0, 3).map(spot => (
                            <span key={spot} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {spot}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">Belum dipilih</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStage === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali
            </button>

            <div className="flex items-center gap-4">
              {currentStage === stageConfigs.length - 1 ? (
                <button
                  onClick={handleGenerate}
                  disabled={generating || !preferences.startDate || !preferences.days || !preferences.travelers}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? "Mempersiapkan..." : "Buat Itinerary"}
                  <Sparkles className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentStageKey === "themes" && preferences.themes.length === 0}
                  className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lanjut
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
