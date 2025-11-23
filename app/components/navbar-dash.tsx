"use client";

import { Home, Compass, CalendarDays, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

type TabKey = "home" | "explore" | "smart" | "plan" | "settings";

interface NavbarDashProps {
  activeTab?: TabKey;
}

export default function NavbarDash({ activeTab }: NavbarDashProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const items: { key: TabKey; label: string; icon: React.ElementType; route: string; hasDropdown?: boolean }[] = [
    { key: "home", label: "Home", icon: Home, route: "/dashboard/home" },
    { key: "explore", label: "Explore", icon: Compass, route: "/dashboard/explore" },
    { key: "smart", label: "Smart", icon: Sparkles, route: "/dashboard/smart", hasDropdown: true },
    { key: "plan", label: "My Plan", icon: CalendarDays, route: "/dashboard/plan", hasDropdown: true },
    { key: "settings", label: "Settings", icon: Settings, route: "/dashboard/settings", hasDropdown: true },
  ];

  const handleNavigation = (route: string, hasDropdown?: boolean) => {
    if (hasDropdown) {
      // For tabs with dropdown content, we'll navigate to the main tab
      // The dropdown content can be accessed via other navigation methods
      router.push(route);
    } else {
      // Navigate to the new route
      router.push(route);
    }
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                onClick={() => handleNavigation(item.route)}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative"
                whileTap={{ scale: 0.9 }}
                aria-label={item.label}
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
