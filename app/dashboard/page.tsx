// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../components/secure_route";
import NavbarDash from "../components/navbar-dash";
import DestCard from "../components/dest-card";
import ExploreSection from "./section/feedpage"; // ✅ integrasi ExploreSection
import { Destination, Itinerary } from "@/app/datatypes";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  // 🔹 State tab navigasi
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "plan" | "settings">("home");

  // 🔹 State data destinasi & itinerary
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch data saat mount
  useEffect(() => {
    let mounted = true;
    Promise.all([apiFetch("/destinations"), apiFetch("/itineraries")])
      .then(([dests, its]) => {
        if (!mounted) return;
        setDestinations(dests ?? []);
        setItineraries(its ?? []);
      })
      .catch((e) => console.error("fetch error:", e))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // 🔹 Konten tiap tab
  const renderSection = () => {
    switch (activeTab) {
      case "home":
        return (
          <section>
            <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
            {!loading && (
              <>
                <h2 className="text-lg font-semibold mb-3 text-slate-800">Recommended Destinations</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {destinations.map((d) => (
                    <div key={d.id} className="flex-shrink-0">
                      <DestCard item={d} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        );

      case "explore":
        // 🔹 Explore Section terintegrasi penuh
        return (
          <section className="pb-24">
            <ExploreSection />
          </section>
        );

      case "plan":
        return (
          <section>
            <h1 className="text-2xl font-bold mb-4">My Itineraries</h1>
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {itineraries.map((it) => (
                  <div key={it.id} className="w-full bg-white/80 rounded-2xl p-3 text-slate-900">
                    <strong>{it.title}</strong>
                    <div className="text-xs opacity-80">
                      {it.city} • {it.startDate} - {it.endDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case "settings":
        return (
          <section>
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-slate-700">Manage your account, preferences, and security options here.</p>
          </section>
        );

      default:
        return null;
    }
  };

  // 🔹 Tampilan utama dashboard
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-900 relative">
        <div className="pb-24 px-5 pt-6">{renderSection()}</div>
        <NavbarDash activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </ProtectedRoute>
  );
}
