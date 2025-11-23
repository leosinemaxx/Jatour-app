"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SpendingInsights from "@/app/components/SpendingInsights";
import NavbarDash from "@/app/components/navbar-dash";

export default function SpendingInsightsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage or context
    // For now, using a mock user ID - in real implementation, get from auth context
    const mockUserId = localStorage.getItem('userId') || 'user-123';
    setUserId(mockUserId);
  }, []);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarDash />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SpendingInsights userId={userId} />
      </div>
    </div>
  );
}