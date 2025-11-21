"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Leaf,
  Landmark,
  MoonStar,
  Mountain,
  Search,
  SlidersHorizontal,
  Sprout,
  TreePine,
  Users,
  Utensils,
  Waves,
} from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { cn, capitalize } from "@/lib/utils";

type StageKey = "themes" | "cities" | "spots" | "logistics";

interface ThemeOption {
  id: string;
  title: string;
  description: string;
  accent: string;
  icon: LucideIcon;
}

const themeOptions: ThemeOption[] = [
  { id: "nature", title: "Wisata Alam", description: "Air terjun, hutan, savana", accent: "from-emerald-100 to-emerald-200", icon: TreePine },
  { id: "urban", title: "Urban Explorer", description: "Kota modern & landmark", accent: "from-slate-100 to-slate-200", icon: Building2 },
  { id: "beach", title: "Pantai & Laut", description: "Sunset & snorkeling", accent: "from-sky-100 to-sky-200", icon: Waves },
  { id: "mountain", title: "Pegunungan", description: "Pendakian & sunrise", accent: "from-orange-100 to-orange-200", icon: Mountain },
  { id: "culture", title: "Budaya", description: "Seni & tradisi lokal", accent: "from-rose-100 to-rose-200", icon: Landmark },
  { id: "heritage", title: "Heritage", description: "Candi & sejarah", accent: "from-amber-100 to-amber-200", icon: Landmark },
  { id: "culinary", title: "Kuliner", description: "Street food & kopi", accent: "from-lime-100 to-lime-200", icon: Utensils },
  { id: "adventure", title: "Petualangan", description: "Off-road & rafting", accent: "from-purple-100 to-purple-200", icon: Activity },
  { id: "family", title: "Family Friendly", description: "Taman bermain & edukasi", accent: "from-indigo-100 to-indigo-200", icon: Users },
  { id: "eco", title: "Eco-Tourism", description: "Konservasi & desa wisata", accent: "from-green-100 to-green-200", icon: Leaf },
  { id: "wellness", title: "Wellness", description: "Spa & retreat", accent: "from-pink-100 to-pink-200", icon: Sprout },
  { id: "nightlife", title: "Nightlife", description: "Bar & city lights", accent: "from-slate-900 to-slate-700 text-white", icon: MoonStar },
];

const cityCards = [
  { name: "Surabaya", image: "/destinations/surabaya.webp", tags: ["urban", "culinary", "heritage", "nightlife"] },
  { name: "Malang", image: "/destinations/malang.webp", tags: ["nature", "culture", "family"] },
  { name: "Banyuwangi", image: "/destinations/banyuwangi.webp", tags: ["nature", "beach", "eco"] },
  { name: "Probolinggo", image: "/destinations/probolinggo.webp", tags: ["mountain", "adventure"] },
  { name: "Batu", image: "/destinations/batu.webp", tags: ["family", "nature", "adventure"] },
  { name: "Madura", image: "/destinations/madura.webp", tags: ["culture", "heritage", "culinary"] },
  { name: "Lumajang", image: "/destinations/lumajang.webp", tags: ["nature", "mountain", "adventure"] },
  { name: "Pacitan", image: "/destinations/pacitan.webp", tags: ["beach", "adventure"] },
  { name: "Jember", image: "/destinations/main-bg.webp", tags: ["culture", "beach", "culinary"] },
  { name: "Blitar", image: "/destinations/main-bg.webp", tags: ["heritage", "culture"] },
  { name: "Kediri", image: "/destinations/main-bg.webp", tags: ["culture", "urban", "culinary"] },
  { name: "Pasuruan", image: "/destinations/main-bg.webp", tags: ["eco", "nature", "family"] },
];

const spotCards = [
  { name: "Bukit Bentar", image: "/destinations/bukit-bentar.webp", tags: ["sunrise", "nature", "mountain"] },
  { name: "Kawah Ijen", image: "/destinations/kawahijen.webp", tags: ["adventure", "nature", "nightlight"] },
  { name: "Pantai Pasir Putih", image: "/destinations/pasir-putih.webp", tags: ["beach", "family"] },
  { name: "Candi Singosari", image: "/destinations/candi-singosari.webp", tags: ["heritage", "culture"] },
  { name: "Taman Nasional Bromo", image: "/destinations/bromo.webp", tags: ["mountain", "adventure", "nature"] },
  { name: "Kampung Warna-Warni Jodipan", image: "/destinations/main-bg.webp", tags: ["urban", "culture", "family"] },
  { name: "Baluran Savanna", image: "/destinations/main-bg.webp", tags: ["eco", "nature", "wildlife"] },
  { name: "Pantai Plengkung (G-Land)", image: "/destinations/main-bg.webp", tags: ["beach", "adventure"] },
  { name: "Museum House of Sampoerna", image: "/destinations/main-bg.webp", tags: ["heritage", "urban"] },
  { name: "Taman Safari Prigen", image: "/destinations/main-bg.webp", tags: ["family", "eco"] },
];

const stageConfigs: { key: StageKey; title: string; subtitle: string }[] = [
  { key: "themes", title: "Jenis Wisata Favorit", subtitle: "Pilih gaya liburan yang paling kamu sukai" },
  { key: "cities", title: "Kota Impian", subtitle: "Tentukan kota yang ingin kamu jelajahi" },
  { key: "spots", title: "Spot Wajib", subtitle: "Daftar destinasi spesifik yang ingin dikunjungi" },
  { key: "logistics", title: "Detail Perjalanan", subtitle: "Isi jadwal dan informasi traveler" },
];

export default function PreferencesPage() {
  const router = useRouter();
  const {
    preferences,
    updatePreferences,
    toggleCity,
    toggleTheme,
    togglePreferredSpot,
    generateItinerary,
    generating,
  } = useSmartItinerary();

  const [currentStage, setCurrentStage] = useState(0);
  const [cityQuery, setCityQuery] = useState("");
  const [spotQuery, setSpotQuery] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customSpot, setCustomSpot] = useState("");
  const [stageError, setStageError] = useState<string | null>(null);
  const logisticsComplete = Boolean(preferences.startDate && preferences.days > 0 && preferences.travelers > 0);

  const filteredCities = useMemo(
    () =>
      cityCards.filter((card) =>
        card.name.toLowerCase().includes(cityQuery.toLowerCase())
      ),
    [cityQuery]
  );

  const filteredSpots = useMemo(
    () =>
      spotCards.filter((card) =>
        card.name.toLowerCase().includes(spotQuery.toLowerCase())
      ),
    [spotQuery]
  );

  const stageCompletion: Record<StageKey, boolean> = {
    themes: preferences.themes.length > 0,
    cities: preferences.cities.length > 0,
    spots: preferences.preferredSpots.length > 0,
    logistics: logisticsComplete,
  };

  const canJumpToStage = (index: number) => {
    if (index <= currentStage) return true;
    const targetKey = stageConfigs[index].key;
    return stageCompletion[targetKey];
  };

  const validateStage = () => {
    const key = stageConfigs[currentStage].key;
    if (key === "themes" && preferences.themes.length === 0) {
      setStageError("Pilih minimal satu jenis wisata terlebih dahulu.");
      return false;
    }
    if (
      key === "logistics" &&
      (!preferences.startDate || preferences.days <= 0 || preferences.travelers <= 0)
    ) {
      setStageError("Lengkapi tanggal mulai, durasi, dan jumlah traveler.");
      return false;
    }
    setStageError(null);
    return true;
  };

  const goNext = () => {
    if (!validateStage()) return;
    setCurrentStage((prev) => Math.min(prev + 1, stageConfigs.length - 1));
  };

  const goPrev = () => {
    setStageError(null);
    setCurrentStage((prev) => Math.max(prev - 1, 0));
  };

  const skipStage = () => {
    setStageError(null);
    setCurrentStage((prev) => Math.min(prev + 1, stageConfigs.length - 1));
  };

  const handleAddCity = () => {
    if (!customCity.trim()) return;
    toggleCity(capitalize(customCity.trim()));
    setCustomCity("");
  };

  const handleAddSpot = () => {
    if (!customSpot.trim()) return;
    togglePreferredSpot(capitalize(customSpot.trim()));
    setCustomSpot("");
  };

  const handleGenerate = async () => {
    await generateItinerary();
    router.push("/dashboard/homepage/itinerary");
  };

  const currentStageKey = stageConfigs[currentStage].key;

  return (
    <div className="space-y-8 pb-16">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400 font-semibold">Smart Preferences</p>
        <h1 className="text-3xl font-bold">Sesuaikan Rekomendasi Wisata Kamu</h1>
        <p className="text-slate-600 max-w-2xl">
          Jawab pertanyaan singkat mengenai gaya liburan, kota impian, dan kebutuhan perjalananmu.
          Data ini akan kami gunakan untuk memfilter rekomendasi wisata di seluruh Jawa Timur.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
              style={{ width: `${((currentStage + 1) / stageConfigs.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-600">
            Langkah {currentStage + 1} / {stageConfigs.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {stageConfigs.map((stage, index) => (
            <button
              key={stage.key}
              disabled={!canJumpToStage(index)}
              onClick={() => setCurrentStage(index)}
              className={cn(
                "flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition",
                index === currentStage && "border-green-500 bg-green-50",
                stageCompletion[stage.key] && index !== currentStage && "border-emerald-200 bg-emerald-50",
                !canJumpToStage(index) && "opacity-60 cursor-not-allowed"
              )}
            >
              <span className="text-xs uppercase tracking-wide text-slate-400">Langkah {index + 1}</span>
              <span className="font-semibold text-slate-900">{stage.title}</span>
              <span className="text-xs text-slate-500">{stage.subtitle}</span>
            </button>
          ))}
        </div>
      </header>

      {stageError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {stageError}
        </div>
      )}

      {currentStageKey === "themes" && (
        <section className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeOptions.map((theme) => {
              const Icon = theme.icon;
              const active = preferences.themes.includes(theme.id);
              const nightTheme = theme.id === "nightlife";
              return (
                <button
                  key={theme.id}
                  onClick={() => toggleTheme(theme.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-3xl border p-4 text-left transition shadow-sm",
                    nightTheme
                      ? "bg-gradient-to-br from-slate-900 to-slate-700 text-white"
                      : `bg-gradient-to-br ${theme.accent}`,
                    active ? "ring-2 ring-green-500" : "border-transparent hover:ring-2 hover:ring-emerald-200"
                  )}
                >
                  <div className={cn("rounded-2xl p-3", nightTheme ? "bg-white/10" : "bg-white/70") }>
                    <Icon className={cn("h-6 w-6", nightTheme ? "text-white" : "text-emerald-700") } />
                  </div>
                  <div className={nightTheme ? "text-white" : "text-slate-900"}>
                    <p className="font-semibold">{theme.title}</p>
                    <p className={cn("text-sm", nightTheme ? "text-white/80" : "text-slate-600")}>{theme.description}</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold uppercase tracking-wide">
                    {active ? "Dipilih" : "Pilih"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {currentStageKey === "cities" && (
        <section className="space-y-5">
          <div className="bg-[#F5F9FF] rounded-3xl p-6 border border-white shadow-inner">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400 font-semibold">Kota Impian</p>
              <h2 className="text-3xl font-bold text-slate-900">Pilih Kota Tujuan</h2>
              <p className="text-slate-600 text-sm">Pilih beberapa kota Jawa Timur yang ingin kamu jelajahi.</p>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kota"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
              <button className="p-2 rounded-2xl bg-slate-100" aria-label="Filter">
                <SlidersHorizontal className="h-4 w-4 text-slate-600" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCities.map((card) => {
                const active = preferences.cities.includes(card.name);
                const recommended = preferences.themes.some((theme) => card.tags.includes(theme));
                return (
                  <button
                    key={card.name}
                    onClick={() => toggleCity(card.name)}
                    className={cn(
                      "relative h-40 rounded-3xl overflow-hidden text-left shadow",
                      active ? "ring-4 ring-green-400" : "ring-1 ring-white"
                    )}
                  >
                    <Image src={card.image} alt={card.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {recommended && (
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">Direkomendasikan</span>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-lg font-semibold">{card.name}</p>
                      <p className="text-xs text-white/80">Tap untuk {active ? "menghapus" : "memilih"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow flex flex-col gap-3 border border-slate-100">
            <label className="text-sm text-slate-500 font-semibold">Tambahkan Kota Kustom</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g., Kota favorit lainnya"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                onClick={handleAddCity}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Tambahkan
              </button>
            </div>
            {preferences.cities.length === 0 && (
              <p className="text-xs text-slate-400">Melewati langkah ini akan mengurangi ketepatan rekomendasi kota.</p>
            )}
          </div>
        </section>
      )}

      {currentStageKey === "spots" && (
        <section className="space-y-5">
          <div className="bg-[#F0F6F2] rounded-3xl p-6 border border-white shadow-inner">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400 font-semibold">Spot Favorit</p>
              <h2 className="text-3xl font-bold text-slate-900">Masukkan Destinasi Spesifik</h2>
              <p className="text-slate-600 text-sm">Boleh berupa candi, pantai, desa wisata, atau tempat unik lainnya.</p>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari spot"
                value={spotQuery}
                onChange={(e) => setSpotQuery(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredSpots.map((card) => {
                const active = preferences.preferredSpots.includes(card.name);
                const matchingTag = preferences.themes.find((theme) => card.tags.includes(theme));
                return (
                  <button
                    key={card.name}
                    onClick={() => togglePreferredSpot(card.name)}
                    className={cn(
                      "relative h-36 rounded-3xl overflow-hidden text-left shadow",
                      active ? "ring-4 ring-blue-400" : "ring-1 ring-white"
                    )}
                  >
                    <Image src={card.image} alt={card.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {matchingTag && (
                        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-700">
                          Cocok untuk {matchingTag}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-sm font-semibold leading-tight">{card.name}</p>
                      <p className="text-[10px] text-white/80">{active ? "Diprioritaskan" : "Tap untuk prioritas"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow flex flex-col gap-3 border border-slate-100">
            <label className="text-sm text-slate-500 font-semibold">Tambahkan Spot Kustom</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Misal: Kedai kopi favorit, desa wisata"
                value={customSpot}
                onChange={(e) => setCustomSpot(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                onClick={handleAddSpot}
                className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Simpan Spot
              </button>
            </div>
            {preferences.preferredSpots.length === 0 && (
              <p className="text-xs text-slate-400">Lewati bila belum ada spot tertentu. Kamu bisa menambahkannya kapan saja.</p>
            )}
          </div>
        </section>
      )}

      {currentStageKey === "logistics" && (
        <section className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-white rounded-3xl p-5 shadow flex flex-col gap-3 border border-slate-100">
              <label className="text-sm text-slate-500 font-semibold">Tanggal Mulai</label>
              <input
                type="date"
                value={preferences.startDate}
                onChange={(e) => updatePreferences({ startDate: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <label className="text-sm text-slate-500 font-semibold mt-4">Durasi (hari)</label>
              <input
                type="number"
                min={1}
                value={preferences.days}
                onChange={(e) => updatePreferences({ days: Number(e.target.value) })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="bg-white rounded-3xl p-5 shadow flex flex-col gap-3 border border-slate-100">
              <label className="text-sm text-slate-500 font-semibold">Jumlah Traveler</label>
              <input
                type="number"
                min={1}
                value={preferences.travelers}
                onChange={(e) => updatePreferences({ travelers: Number(e.target.value) })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <label className="text-sm text-slate-500 font-semibold mt-4">Catatan khusus</label>
              <textarea
                rows={4}
                placeholder="Contoh: butuh itinerary ramah anak, vegetarian friendly"
                value={preferences.notes}
                onChange={(e) => updatePreferences({ notes: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400 font-semibold">Ringkasan Preferensi</p>
                <h3 className="text-xl font-semibold mt-1">Cek kembali pilihanmu</h3>
              </div>
              <Calendar className="h-6 w-6 text-slate-500" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SummaryBox
                label="Themes"
                values={preferences.themes.map((theme) => themeOptions.find((opt) => opt.id === theme)?.title || theme)}
                onEdit={() => setCurrentStage(0)}
              />
              <SummaryBox label="Kota" values={preferences.cities} onEdit={() => setCurrentStage(1)} />
              <SummaryBox label="Spot" values={preferences.preferredSpots} onEdit={() => setCurrentStage(2)} />
              <SummaryBox
                label="Logistik"
                values={[
                  preferences.startDate ? `Mulai: ${preferences.startDate}` : "Tanggal belum diisi",
                  preferences.days ? `${preferences.days} hari` : "Durasi belum diisi",
                  preferences.travelers ? `${preferences.travelers} traveler` : "Traveler belum diisi",
                ]}
                onEdit={() => setCurrentStage(3)}
              />
            </div>
          </div>
        </section>
      )}

      <footer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <button
            onClick={goPrev}
            disabled={currentStage === 0}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <button
            onClick={goNext}
            disabled={currentStage === stageConfigs.length - 1}
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-200"
          >
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </button>
          {(currentStageKey === "cities" || currentStageKey === "spots") && (
            <button
              onClick={skipStage}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Lewati dulu
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <button
            disabled={!logisticsComplete || currentStage !== stageConfigs.length - 1}
            onClick={() => router.push("/dashboard/homepage/budget")}
            className="rounded-2xl border border-green-200 bg-white px-6 py-3 text-sm font-semibold text-green-600 disabled:opacity-50"
          >
            Lanjut ke Budgeting
          </button>
          <button
            disabled={!logisticsComplete || generating}
            onClick={handleGenerate}
            className="rounded-2xl bg-gradient-to-r from-[#94e2d5] to-[#5fc9a9] px-6 py-3 text-sm font-semibold text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Menyiapkan Itinerary..." : "Generate Smart Itinerary"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function SummaryBox({ label, values, onEdit }: { label: string; values: string[]; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <button onClick={onEdit} className="text-xs font-semibold text-emerald-600">Edit</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value, index) => (
            <span key={`${value}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {value}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">Belum ada pilihan</span>
        )}
      </div>
    </div>
  );
}


