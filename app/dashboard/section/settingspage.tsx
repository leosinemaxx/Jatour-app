"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Bell, 
  Calendar, 
  Receipt, 
  Settings, 
  Shield, 
  Scale, 
  Palette,
  LogOut,
  MapPin,
  ArrowRight,
  Plane,
  Briefcase
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SettingsSection() {
  const accountSettings = [
    { icon: User, label: "Edit Profile", color: "text-blue-600" },
    { icon: Bell, label: "Notification Settings", color: "text-purple-600" },
    { icon: Calendar, label: "Calendar", color: "text-green-600" },
    { icon: Receipt, label: "My Transaction", color: "text-orange-600" },
  ];

  const generalSettings = [
    { icon: Settings, label: "App Settings", color: "text-gray-600" },
    { icon: Shield, label: "Privacy Policy", color: "text-indigo-600" },
    { icon: Scale, label: "Terms & Conditions", color: "text-gray-600" },
    { icon: Palette, label: "Theme Settings", color: "text-pink-600" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Account</h1>
      </motion.div>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-white/30">
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                    LT
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">Lanang Tegar Augurio</h2>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <MapPin className="h-4 w-4" />
                    <span>Bojonegoro Jawa Timur</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="relative">
                  <Briefcase className="h-12 w-12 opacity-80" />
                  <Plane className="h-8 w-8 absolute -top-2 -right-2 opacity-60" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Account</h2>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {accountSettings.map((setting, index) => (
              <motion.button
                key={setting.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${setting.color}`}>
                    <setting.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-gray-900">{setting.label}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </motion.button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-3">General</h2>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {generalSettings.map((setting, index) => (
              <motion.button
                key={setting.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${setting.color}`}>
                    <setting.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-gray-900">{setting.label}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </motion.button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Log Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Log Out</span>
          </div>
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
