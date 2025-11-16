"use client";

import { Home, Compass, CalendarDays, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type TabKey = "home" | "explore" | "smart" | "plan" | "settings";

interface NavbarDashProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function NavbarDash({ activeTab, setActiveTab }: NavbarDashProps) {
  const items: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "home", label: "Home", icon: Home },
    { key: "explore", label: "Explore", icon: Compass },
    { key: "smart", label: "Smart", icon: Sparkles },
    { key: "plan", label: "My Plan", icon: CalendarDays },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around h-16 sm:h-20 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            
            return (
              <motion.button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative"
                whileTap={{ scale: 0.9 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-t-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? "#3b82f6" : "#6b7280",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </motion.div>
                <span
                  className={`text-xs sm:text-sm font-medium transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
