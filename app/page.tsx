"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}     // Saat pertama kali muncul
      animate={{ opacity: 1, y: 0 }}      // Animasi muncul
      exit={{ opacity: 0, y: -20 }}       // Saat keluar
      transition={{ duration: 0.6, ease: "easeInOut" }} // Durasi dan kurva
      className="flex flex-col items-center justify-center min-h-screen bg-[url('/beach.jpg')] bg-cover bg-center"
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative text-center text-white z-10 px-4">
        <h1 className="text-3xl font-semibold mb-4">Pantai Klayar</h1>
        <p className="mb-6 text-sm opacity-90">Pacitan</p>

        <Link
          href="/signup"
          className="bg-white text-black font-medium rounded-full px-8 py-3 hover:bg-gray-100 transition"
        >
          Register
        </Link>

        <p className="text-xs mt-4 opacity-80">
          Already have an account?{" "}
          <Link href="/signin" className="underline hover:text-white">
            Sign in here
          </Link>
        </p>
      </div>
    </motion.main>
  );
}
