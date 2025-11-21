"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Users, Calendar, Calculator } from "lucide-react";

const steps = [
  {
    title: "Setup your own Holiday!",
    description: "Pick cities, interests, and travel style to inspire the plan.",
    icon: Users,
    href: "/dashboard/homepage/preferences",
    accent: "from-[#7BC8F1] to-[#3B82F6]",
  },
  {
    title: "Itinerary Builder",
    description: "Review AI-generated agendas styled like your mobile concept.",
    icon: Calendar,
    href: "/dashboard/homepage/itinerary",
    accent: "from-[#FBC2EB] to-[#A18CD1]",
  },
  {
    title: "Smart Budget Engine",
    description: "Adjust totals, payment methods, and compare spending.",
    icon: Calculator,
    href: "/dashboard/homepage/budget",
    accent: "from-[#C1FF72] to-[#4ADE80]",
  },
];

export default function SmartItinerarySection() {
  return (
    <div className="space-y-10 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-blue-500 font-semibold">
              Smart Itinerary
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Three dedicated pages, one seamless planning flow
            </h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              We separated Preferences, Itinerary, and Budget so each screen can follow the mobile
              references you provided. Choose a step below to continue crafting the experience.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <Link
              href={step.href}
              className="relative block h-full rounded-[28px] bg-white border border-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.08)] p-6 overflow-hidden"
            >
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${step.accent}`}
              />
              <div className="relative z-10 flex flex-col gap-4 text-left">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-white/20 transition">
                  <step.icon className="h-6 w-6 text-slate-800 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.4em] uppercase text-slate-400 group-hover:text-white/80">
                    Step {index + 1}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-white transition">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 group-hover:text-white/80">
                    {step.description}
                  </p>
                </div>
                <div className="mt-auto flex items-center text-blue-600 font-semibold group-hover:text-white">
                  View page
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="rounded-[32px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-8 flex flex-col lg:flex-row gap-6 items-center shadow-[0_20px_70px_rgba(79,70,229,0.45)]">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70 font-semibold">Quick launch</p>
          <h3 className="text-2xl font-bold mt-2">Start where you left off</h3>
          <p className="text-white/80 mt-2 max-w-2xl">
            Each standalone page mirrors the mobile layouts you showed: immersive destination cards,
            a clean budgeting form, and a stacked itinerary timeline. Jump into whichever step you need to polish.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {steps.map((step) => (
            <Link
              key={step.title}
              href={step.href}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 transition text-sm font-semibold flex items-center gap-2 backdrop-blur"
            >
              {step.title}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

