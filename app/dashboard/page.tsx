// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "../components/secure_route";
import NavbarDash from "../components/navbar-dash";
import DestCardEnhanced from "@/components/dest-card-enhanced";
import DestinationDetailModal from "@/components/destination-detail-modal";
import HomeSection from "./section/homepage";
import ExploreSection from "./section/explorepage";
import SmartItinerarySection from "./section/smart-itinerary-section";
import PlannerSection from "./section/plannerpage";
import ItinerarySection from "./section/itinerarypage";
import SettingsSection from "./section/settingspage";
import PromoPage from "./section/promo-page";
import KulinerPage from "./section/kuliner-page";
import CustomerServicePage from "./section/customer-service-page";
import { Destination, Itinerary } from "@/app/datatypes";
import { apiFetch } from "@/lib/api-client";

// Tab type for original navbar
type TabKey = "home" | "explore" | "smart" | "plan" | "settings";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  
  // 🔹 State tab navigasi - Use original tabs for navbar
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // 🔹 State data destinasi & itinerary
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // 🔹 Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && ["home", "explore", "smart", "plan", "settings"].includes(tabParam)) {
      setActiveTab(tabParam as TabKey);
    }
  }, [searchParams]);

  // 🔹 Check for direct page access (for new pages)
  useEffect(() => {
    const pageParam = searchParams?.get("page");
    if (pageParam && ["promo", "kuliner", "customer-service"].includes(pageParam)) {
      // For new pages, show them directly without changing the active tab
      // This maintains navbar consistency while allowing direct navigation
      if (pageParam === "promo") {
        setActiveTab("smart"); // Use smart tab as placeholder
      } else if (pageParam === "kuliner") {
        setActiveTab("plan"); // Use plan tab as placeholder
      } else if (pageParam === "customer-service") {
        setActiveTab("settings"); // Use settings tab as placeholder
      }
    }
  }, [searchParams]);

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

  // 🔹 Konten tiap tab - Include new pages
  const renderSection = () => {
    const pageParam = searchParams?.get("page");
    
    // Check for direct page access first
    if (pageParam === "promo") return <PromoPage />;
    if (pageParam === "kuliner") return <KulinerPage />;
    if (pageParam === "customer-service") return <CustomerServicePage />;
    
    // Otherwise show the regular tabs
    switch (activeTab) {
      case "home":
        return <HomeSection />;

      case "explore":
        return <ExploreSection />;

      case "smart":
        return <SmartItinerarySection />;

      case "plan":
        return <ItinerarySection />;

      case "settings":
        return <SettingsSection />;

      default:
        return <HomeSection />;
    }
  };

  // 🔹 Tampilan utama dashboard - Fullscreen scaling
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-b from-gray-50 to-white text-gray-900 relative overflow-x-hidden">
        <div className="pb-20 sm:pb-24 px-4 sm:px-6 pt-4 sm:pt-6">{renderSection()}</div>
        <NavbarDash activeTab={activeTab} setActiveTab={setActiveTab} />
        <DestinationDetailModal
          destination={selectedDestination}
          isOpen={!!selectedDestination}
          onClose={() => setSelectedDestination(null)}
        />
      </main>
    </ProtectedRoute>
  );
}
