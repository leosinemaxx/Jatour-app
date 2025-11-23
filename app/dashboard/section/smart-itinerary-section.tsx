"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

export default function SmartItinerarySection() {
  return (
    <div className="space-y-10 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-blue-500 font-semibold">
              Smart Itinerary
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Itinerary & Budget Planner
            </h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              Discover personalized itineraries and optimize your travel budget with our smart planning tools.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl w-full"
        >
          <div className="relative rounded-[32px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 shadow-[0_25px_60px_rgba(59,130,246,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10 text-center text-white">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
                <Calculator className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Itinerary & Budget Planner</h2>
              <p className="text-white/90 mb-8 max-w-md mx-auto">
                Explore comprehensive trip planning stages from goal setting to budget optimization. Start your journey with our intelligent planning tools.
              </p>
              <Link
                href="/dashboard/smart/planning"
                className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Planning
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
