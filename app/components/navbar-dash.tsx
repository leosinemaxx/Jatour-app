// app/dashboard/components/navbar-dash.tsx
"use client";

import { Home, Compass, CalendarDays, Settings } from "lucide-react";
import { motion } from "framer-motion";

type TabKey = "home" | "explore" | "plan" | "settings";

interface NavbarDashProps {
  activeTab: TabKey;
  setActiveTab: React.Dispatch<React.SetStateAction<TabKey>>;
}

export default function NavbarDash({ activeTab, setActiveTab }: NavbarDashProps) {
  const items: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "home", label: "Home", icon: Home },
    { key: "explore", label: "Explore", icon: Compass },
    { key: "plan", label: "My Plan", icon: CalendarDays },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 z-50">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`relative flex flex-col items-center gap-1 text-xs transition-all ${
              active ? "text-sky-600 font-semibold" : "text-slate-500"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.4 : 1.6}
              className="transition-transform duration-200"
            />
            {item.label}

            {/* animasi garis aktif */}
            {active && (
              <motion.div
                layoutId="active-underline"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-sky-500 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
