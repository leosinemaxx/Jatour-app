"use client";

import ProtectedRoute from "../../components/secure_route";
import NavbarDash from "../../components/navbar-dash";
import PriceComparisonPage from "../section/price-comparison-page";

export default function PriceComparisonRoute() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-b from-gray-50 to-white text-gray-900 relative overflow-x-hidden">
        <div className="pb-20 sm:pb-24 px-4 sm:px-6 pt-4 sm:pt-6">
          <PriceComparisonPage />
        </div>
        <NavbarDash activeTab="plan" />
      </main>
    </ProtectedRoute>
  );
}