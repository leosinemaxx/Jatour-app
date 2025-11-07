"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Destination {
  id: number;
  name: string;
  city: string;
  image: string;
  description: string;
  category?: string;
}

export default function ExploreSection() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = ["Flight", "Train", "Bus", "Restaurant", "Cafe", "Event"];

  // === Fetch data dari API kamu ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/destinations"); // 🔁 ganti sesuai endpoint server kamu
        const data = await res.json();
        setDestinations(data);
      } catch (error) {
        console.error("Gagal memuat data destinasi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // === Filter berdasarkan search ===
  const filtered = destinations.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="relative pb-24">
      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Cari itinerary pilihanmu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2 mb-4 focus:ring-2 focus:ring-sky-400 focus:outline-none"
      />

      {/* 🏷️ Category Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {categories.map((cat) => (
          <motion.div
            key={cat}
            whileHover={{ scale: 1.05 }}
            className="bg-white/40 text-center py-3 rounded-xl text-slate-800 shadow-sm cursor-pointer hover:bg-sky-100 transition"
          >
            {cat}
          </motion.div>
        ))}
      </div>

      {/* 🌍 Destination Grid */}
      <h2 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">
        Itinerary Populer
      </h2>

      {loading ? (
        <p className="text-slate-500 text-center py-10">Memuat destinasi...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-10">Tidak ada hasil ditemukan.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((d) => (
            <motion.div
              key={d.id}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => setSelected(d)}
              className="bg-white/60 dark:bg-gray-800 p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition"
            >
              <div className="relative w-full h-36 rounded-lg overflow-hidden mb-2">
                <Image
                  src={d.image}
                  alt={d.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
              </div>
              <p className="font-medium text-slate-900 dark:text-white">{d.name}</p>
              <p className="text-xs opacity-70">{d.city}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🏠 Modal Detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden max-w-lg w-full mx-4 relative"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 w-full">
                <Image
                  src={selected.image}
                  alt={selected.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {selected.name}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                  {selected.city}
                </p>
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                  {selected.description}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-5 w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
