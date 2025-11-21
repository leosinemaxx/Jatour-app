// Client component for the actual layout
"use client";

import "@/app/globals.css";
import { NotificationProvider, useNotification } from "@/lib/components/NotificationProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SmartItineraryProvider } from "@/lib/contexts/SmartItineraryContext";
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
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <SmartItineraryProvider>
            <NotificationProvider>
              <GlobalNotificationHandler />
              {children}
            </NotificationProvider>
          </SmartItineraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}
