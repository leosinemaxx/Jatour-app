// app/dashboard/components/PlanSection.tsx
"use client";

export default function PlanSection() {
  const itineraries = [
    { id: 1, city: "Surabaya", date: "Aug 21 - Aug 30" },
    { id: 2, city: "Bojonegoro", date: "Sep 12 - Sep 30" },
    { id: 3, city: "Probolinggo", date: "Oct 20 - Nov 3" },
  ];

  return (
    <section>
      <h1 className="text-2xl font-bold mb-5">My Itinerary</h1>
      <div className="flex flex-col gap-4">
        {itineraries.map((it) => (
          <div key={it.id} className="bg-white/60 p-3 rounded-xl shadow-sm">
            <img
              src={`https://source.unsplash.com/600x300/?${it.city}`}
              alt={it.city}
              className="rounded-lg mb-2"
            />
            <div className="flex justify-between">
              <p className="font-medium">{it.city}, Indonesia</p>
              <p className="text-xs opacity-70">{it.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
