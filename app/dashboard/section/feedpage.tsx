// app/dashboard/components/ExploreSection.tsx
"use client";

export default function ExploreSection() {
  const categories = ["Flight", "Train", "Bus", "Restaurant", "Cafe", "Event"];

  return (
    <section>
      <input
        type="text"
        placeholder="Cari itinerary pilihanmu..."
        className="w-full rounded-xl border border-slate-200 px-4 py-2 mb-4"
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {categories.map((cat) => (
          <div
            key={cat}
            className="bg-white/40 text-center py-3 rounded-xl text-slate-800 shadow-sm"
          >
            {cat}
          </div>
        ))}
      </div>

      <h2 className="font-semibold text-lg mb-3">Itinerary Populer</h2>
      <div className="grid grid-cols-2 gap-3">
        {["Surabaya", "Malang", "Banyuwangi", "Probolinggo"].map((city) => (
          <div key={city} className="bg-white/50 p-3 rounded-xl shadow-sm">
            <img
              src={`https://source.unsplash.com/300x200/?${city}`}
              alt={city}
              className="rounded-lg mb-2"
            />
            <p className="font-medium">{city}</p>
            <p className="text-xs opacity-70">3 Destinations</p>
          </div>
        ))}
      </div>
    </section>
  );
}
