"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Hotel, MapPin, Navigation, Wallet } from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";

export default function ItineraryPage() {
  const router = useRouter();
  const { itinerary, preferences } = useSmartItinerary();

  const summary = useMemo(() => {
    if (itinerary.length === 0) return null;
    const firstDay = itinerary[0];
    const lastDay = itinerary[itinerary.length - 1];
    return {
      budget: preferences.budget,
      accommodation: firstDay.accommodation?.name ?? "TBD Hotel",
      transportation: itinerary.find((day) => day.transportation)?.transportation?.type ?? "Private car",
      checkIn: firstDay.date,
      checkOut: lastDay.date,
    };
  }, [itinerary, preferences.budget]);

  if (itinerary.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p className="text-lg font-semibold text-slate-800">No itinerary yet</p>
        <p className="text-slate-500">Complete the Preferences and Budget steps, then generate your plan.</p>
        <button
          onClick={() => router.push("/dashboard/homepage/preferences")}
          className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-semibold"
        >
          Go to Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#F0F4FF] rounded-[32px] p-6 border border-white shadow-inner text-slate-800">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500 font-semibold">Itinerary</p>
        <h2 className="text-3xl font-bold mt-2">Cari Destinasi Wisata</h2>

        {summary && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-4 shadow">
              <div className="flex items-center gap-3 text-slate-800">
                <Wallet className="h-6 w-6 text-slate-900" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Total Budget</p>
                  <p className="text-xl font-bold">IDR {summary.budget.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow flex items-center gap-3">
              <Hotel className="h-6 w-6 text-slate-900" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Accommodation</p>
                <p className="text-lg font-semibold">{summary.accommodation}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow flex items-center gap-3">
              <Navigation className="h-6 w-6 text-slate-900" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Transportation</p>
                <p className="text-lg font-semibold capitalize">{summary.transportation}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-slate-900" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Check-in / Check-out</p>
                <p className="text-sm font-semibold leading-tight">
                  {summary.checkIn}
                  <br />→ {summary.checkOut}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {itinerary.map((day) => (
        <div key={day.id} className="rounded-[32px] bg-white border border-slate-100 shadow-xl p-6 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">Agenda</p>
              <h3 className="text-2xl font-bold text-slate-900">{day.date}</h3>
            </div>
            <button className="px-4 py-2 text-sm rounded-2xl bg-slate-900 text-white font-semibold shadow">
              Pesan Transportasi
            </button>
          </header>

          <div className="space-y-4">
            {day.destinations.map((dest, index) => (
              <div key={dest.id} className="rounded-3xl border border-slate-100 p-4 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-slate-400">{dest.time}</p>
                      <h4 className="text-lg font-semibold text-slate-900">{dest.name}</h4>
                    </div>
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{dest.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

