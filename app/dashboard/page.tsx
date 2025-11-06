"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import ProtectedRoute from "../components/secure_route";
import NavbarDash from "../components/navbar-dash";
import DestCard from "../components/dest-card";
import ExploreSection from "./section/feedpage";
import { Destination, Itinerary } from "@/app/datatypes";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  
  // 🔹 State tab navigasi
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "plan" | "settings">("home");

  // 🔹 State data destinasi & itinerary
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch data saat mount
  useEffect(() => {
    if (authLoading || !user) return;

    let mounted = true;
    Promise.all([
      apiFetch("/destinations"),
      apiFetch("/itineraries")
    ])
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
  }, [authLoading, user]);

  // 🔹 Konten tiap tab
  const renderSection = () => {
    if (authLoading || loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <section>
            <h1 className="text-2xl font-bold mb-4">
              Welcome back, {user?.fullName || 'User'}!
            </h1>
            {destinations.length > 0 ? (
              <>
                <h2 className="text-lg font-semibold mb-3 text-slate-800">
                  Recommended Destinations
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {destinations.map((d) => (
                    <div key={d.id} className="flex-shrink-0">
                      <DestCard item={d} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-600">No destinations available yet.</p>
            )}
          </section>
        );

      case "explore":
        return (
          <section className="pb-24">
            <ExploreSection />
          </section>
        );

      case "plan":
        return (
          <section>
            <h1 className="text-2xl font-bold mb-4">My Itineraries</h1>
            {itineraries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {itineraries.map((it) => (
                  <div
                    key={it.id}
                    className="w-full bg-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-lg mb-2">{it.title}</h3>
                    <div className="text-sm text-slate-600">
                      <p>📍 {it.destination}</p>
                      <p>📅 {it.startDate} - {it.endDate}</p>
                      <p className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          it.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                          it.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                          it.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {it.status.charAt(0).toUpperCase() + it.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No itineraries yet. Start planning your first trip!</p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Explore Destinations
                </button>
              </div>
            )}
          </section>
        );

      case "settings":
        return (
          <section>
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <div className="bg-white/80 rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p className="text-sm text-slate-600">Email: {user?.email}</p>
                <p className="text-sm text-slate-600">Name: {user?.fullName}</p>
                <p className="text-sm text-slate-600">Phone: {user?.phone}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Preferences</h3>
                <p className="text-sm text-slate-600">
                  Theme: {user?.preferences?.theme || 'light'}
                </p>
                <p className="text-sm text-slate-600">
                  Language: {user?.preferences?.language || 'en'}
                </p>
                <p className="text-sm text-slate-600">
                  Notifications: {user?.preferences?.notifications ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
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
