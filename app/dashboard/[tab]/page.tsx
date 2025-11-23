"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProtectedRoute from "../../components/secure_route";
import NavbarDash from "../../components/navbar-dash";
import HomeSection from "../../dashboard/section/homepage";
import ExploreSection from "../../dashboard/section/explorepage";
import SmartItinerarySection from "../../dashboard/section/smart-itinerary-section";
import PlannerSection from "../../dashboard/section/itinerarypage";
import SettingsSection from "../../dashboard/section/settingspage";
import PromoPage from "../../dashboard/section/promo-page";
import KulinerPage from "../../dashboard/section/kuliner-page";
import CustomerServicePage from "../../dashboard/section/customer-service-page";
import { Destination, Itinerary } from "@/app/datatypes";
import { apiFetch } from "@/lib/api-client";

type TabKey = "home" | "explore" | "smart" | "plan" | "settings";

interface TabRouteMap {
  [key: string]: TabKey;
}

const tabRouteMap: TabRouteMap = {
  "home": "home",
  "explore": "explore", 
  "smart": "smart",
  "plan": "plan",
  "settings": "settings"
};

export default function DashboardTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Extract tab from URL params using React.use()
  const { tab: urlTab } = React.use(params);
  const validTab = tabRouteMap[urlTab] || "home";
  
  // 🔹 State data destinasi & itinerary
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // 🔹 Redirect invalid tabs to home
  useEffect(() => {
    if (!tabRouteMap[urlTab]) {
      router.replace("/dashboard/home");
      return;
    }
  }, [urlTab, router]);

  // 🔹 Fetch data saat mount
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [dests, its] = await Promise.all([
          apiFetch("/destinations").catch(() => []),
          apiFetch("/itineraries").catch(() => [])
        ]);
        if (!mounted) return;
        setDestinations(Array.isArray(dests) ? dests : []);
        setItineraries(Array.isArray(its) ? its : []);
      } catch (e) {
        console.error("fetch error:", e);
        if (mounted) {
          setDestinations([]);
          setItineraries([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // 🔹 Konten tiap tab
  const renderSection = () => {
    const pageParam = searchParams?.get("page");
    
    // Check for direct page access first (for legacy support)
    if (pageParam === "promo") return <PromoPage />;
    if (pageParam === "kuliner") return <KulinerPage />;
    if (pageParam === "customer-service") return <CustomerServicePage />;
    
    // Otherwise show the regular tabs based on URL
    switch (validTab) {
      case "home":
        return <HomeSection />;

      case "explore":
        return <ExploreSection />;

      case "smart":
        return <SmartItinerarySection />;

      case "plan":
        return <PlannerSection />;

      case "settings":
        return <SettingsSection />;

      default:
        return <HomeSection />;
    }
  };


  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-b from-gray-50 to-white text-gray-900 relative overflow-x-hidden">
        <div className="pb-20 sm:pb-24 px-4 sm:px-6 pt-4 sm:pt-6">{renderSection()}</div>
        <NavbarDash activeTab={validTab} />
        {/* Modal akan ditangani oleh masing-masing section */}
      </main>
    </ProtectedRoute>
  );
}
