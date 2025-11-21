"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, ChevronRight } from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";

const paymentOptions = ["Transfer Bank", "Debit", "Kartu Kredit", "E-Wallet"];
const travelModes = ["Personal", "Group", "Premium"];

export default function BudgetPage() {
  const router = useRouter();
  const { preferences, updatePreferences, generateItinerary, calculateBudget, itinerary, budgetBreakdown, loading, generating } =
    useSmartItinerary();
  const [selectedPayment, setSelectedPayment] = useState(paymentOptions[0]);
  const [selectedMode, setSelectedMode] = useState(travelModes[0]);

  const handleGenerate = async () => {
    await generateItinerary();
    router.push("/dashboard/homepage/itinerary");
  };

  const handleCalculate = async () => {
    if (itinerary.length === 0) {
      await generateItinerary();
    }
    await calculateBudget();
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#F4F7FB] rounded-[32px] p-6 shadow-inner border border-white/60">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400 font-semibold">Budgeting</p>
        <h2 className="text-3xl font-bold text-slate-900 mt-2">Choose your numbers</h2>
        <p className="text-slate-600 mt-1 text-sm">Match the input layout from your design: stacked fields with pill selects.</p>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase">Total Budget (IDR)</label>
          <input
            type="number"
            placeholder="Masukan Total Budget"
            value={preferences.budget || ""}
            onChange={(e) => updatePreferences({ budget: Number(e.target.value) })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          <label className="block text-xs font-semibold text-slate-500 uppercase mt-4">Orang</label>
          <input
            type="number"
            min={1}
            value={preferences.travelers}
            onChange={(e) => updatePreferences({ travelers: Number(e.target.value) })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          <label className="block text-xs font-semibold text-slate-500 uppercase mt-4">Jumlah Hari</label>
          <input
            type="number"
            min={1}
            value={preferences.days}
            onChange={(e) => updatePreferences({ days: Number(e.target.value) })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          <label className="block text-xs font-semibold text-slate-500 uppercase mt-4">Tanggal Mulai</label>
          <input
            type="date"
            value={preferences.startDate}
            onChange={(e) => updatePreferences({ startDate: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          <label className="block text-xs font-semibold text-slate-500 uppercase mt-4">Tipe Akomodasi</label>
          <div className="grid grid-cols-3 gap-3">
            {(["budget", "moderate", "luxury"] as const).map((type) => (
              <button
                key={type}
                onClick={() => updatePreferences({ accommodationType: type })}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize ${
                  preferences.accommodationType === type
                    ? "border-green-500 bg-green-50 text-green-700 shadow"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-500 uppercase mt-4">Metode Pembayaran</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedPayment(option)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                  selectedPayment === option ? "border-slate-900 bg-white text-slate-900 shadow" : "border-slate-200 text-slate-500"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-500 uppercase mt-4">Mode Perjalanan</label>
          <div className="grid grid-cols-3 gap-3">
            {travelModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                  selectedMode === mode ? "border-slate-900 bg-white text-slate-900 shadow" : "border-slate-200 text-slate-500"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !preferences.startDate || preferences.budget === 0}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white py-4 text-lg font-semibold disabled:opacity-50"
          >
            {generating ? "Generating Itinerary..." : "Generate Itinerary"}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-900 text-white">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Budget Overview</h3>
            <p className="text-slate-500 text-sm">Calculate breakdown once itinerary exists.</p>
          </div>
          <button
            onClick={handleCalculate}
            className="ml-auto rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </div>

        {budgetBreakdown ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Accommodation", value: budgetBreakdown.accommodation, color: "from-slate-900 to-slate-700" },
              { label: "Transportation", value: budgetBreakdown.transportation, color: "from-green-500 to-emerald-500" },
              { label: "Food & Drinks", value: budgetBreakdown.food, color: "from-blue-500 to-indigo-500" },
              { label: "Activities", value: budgetBreakdown.activities, color: "from-orange-500 to-pink-500" },
              { label: "Miscellaneous", value: budgetBreakdown.miscellaneous, color: "from-slate-400 to-slate-500" },
            ].map((item) => (
              <div key={item.label} className={`rounded-3xl p-4 text-white bg-gradient-to-br ${item.color}`}>
                <p className="text-sm uppercase tracking-wide">{item.label}</p>
                <p className="text-2xl font-bold mt-2">IDR {item.value.toLocaleString("id-ID")}</p>
                <p className="text-xs mt-1 text-white/80">
                  {((item.value / budgetBreakdown.total) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-500 text-sm">
            Generate the itinerary first, then tap calculate to see the breakdown.
          </div>
        )}
      </div>
    </div>
  );
}

