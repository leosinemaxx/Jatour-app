"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Calendar,
  MapPin,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ElementType;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification; 
  onClose: () => void; 
}) {
  const getIcon = () => {
    if (notification.icon) {
      return <notification.icon className="h-5 w-5" />;
    }

    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-full"
    >
      <Card className={`border ${getColorClasses()}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{notification.title}</h4>
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              {notification.action && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={notification.action.onClick}
                    className="text-xs"
                  >
                    {notification.action.label}
                  </Button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

// Utility functions for common notification types
export function useItineraryNotifications() {
  const { addNotification } = useNotification();

  const showItineraryCreated = (cities: string[], days: number) => {
    addNotification({
      type: "success",
      title: "Itinerary Berhasil Dibuat! 🎉",
      message: `Itinerary ${days} hari ke ${cities.join(', ')} telah siap. Cek di halaman My Itinerary.`,
      duration: 8000,
      action: {
        label: "Lihat Itinerary",
        onClick: () => {
          // Navigate to itinerary page
          window.location.href = "/dashboard?tab=plan";
        }
      },
      icon: Calendar
    });
  };

  const showBudgetCalculated = (total: number) => {
    addNotification({
      type: "info",
      title: "Budget Kalkulasi Selesai 💰",
      message: `Total budget perjalanan: IDR ${total.toLocaleString('id-ID')}`,
      duration: 5000,
      icon: DollarSign
    });
  };

  const showDestinationAdded = (destinationName: string) => {
    addNotification({
      type: "success",
      title: "Destinasi Ditambahkan",
      message: `${destinationName} telah ditambahkan ke itinerary Anda.`,
      duration: 4000,
      icon: MapPin
    });
  };

  return {
    showItineraryCreated,
    showBudgetCalculated,
    showDestinationAdded,
  };
}
