"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProtectedRoute from "../../components/secure_route";
import NavbarDash from "../../components/navbar-dash";
import { SmartItineraryProvider } from "@/lib/contexts/SmartItineraryContext";
import { Sparkles } from "lucide-react";

const tabs = [
  { label: "Preferences", href: "/dashboard/homepage/preferences" },
  { label: "Itinerary", href: "/dashboard/homepage/itinerary" },
  { label: "Budget", href: "/dashboard/homepage/budget" },
];

export default function SmartItineraryLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabChange = (tab: "home" | "explore" | "smart" | "plan" | "settings") => {
    if (tab === "smart") {
      router.push("/dashboard/homepage/preferences");
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  return (
    <ProtectedRoute>
      <SmartItineraryProvider>
        <div className="min-h-screen bg-[#e7ffe7]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-28 space-y-6">
            <header className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-md">
                <Sparkles className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-green-600 font-semibold">Smart itinerary</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Design your trip in focused screens</h1>
                <p className="text-slate-600 text-sm mt-1">
                  Move between Preferences, Itinerary, and Budget just like the mobile mockups.
                </p>
              </div>
            </header>

            <nav className="bg-white rounded-full shadow-lg p-1 flex items-center gap-2">
              {tabs.map((tab) => {
                const active = pathname?.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-semibold transition ${
                      active ? "bg-gradient-to-r from-green-400 to-teal-400 text-white shadow" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            <section className="bg-white/70 rounded-[32px] p-6 sm:p-8 shadow-xl backdrop-blur">
              {children}
            </section>
          </div>
          <NavbarDash activeTab="smart" setActiveTab={handleTabChange} />
        </div>
      </SmartItineraryProvider>
    </ProtectedRoute>
  );
}

