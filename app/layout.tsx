// Client component for the actual layout
"use client";

import "@/app/globals.css";
import { NotificationProvider, useNotification } from "@/lib/components/NotificationProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SmartItineraryProvider } from "@/lib/contexts/SmartItineraryContext";
import { UnifiedPlanningProvider } from "@/lib/contexts/UnifiedPlanningContext";
import { useEffect } from "react";

// Global notification hook component
function GlobalNotificationHandler() {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Expose notification function globally
    (window as any).showNotification = (notification: {
      title: string;
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
      duration?: number;
    }) => {
      addNotification(notification);
    };

    // Listen for custom notification events
    const handleCustomNotification = (event: CustomEvent) => {
      addNotification(event.detail);
    };

    window.addEventListener('jatour-notification', handleCustomNotification as EventListener);

    return () => {
      window.removeEventListener('jatour-notification', handleCustomNotification as EventListener);
      delete (window as any).showNotification;
    };
  }, [addNotification]);

  return null;
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle smooth scrolling behavior
    const handleNavigation = () => {
      if (window.location.hash) {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Initial scroll on page load
    handleNavigation();

    // Listen for route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handleNavigation, 100);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleNavigation, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <SmartItineraryProvider>
            <UnifiedPlanningProvider>
              <NotificationProvider>
                <GlobalNotificationHandler />
                {children}
              </NotificationProvider>
            </UnifiedPlanningProvider>
          </SmartItineraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}
