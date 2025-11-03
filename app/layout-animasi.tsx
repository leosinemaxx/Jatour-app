"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AnimatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="relative min-h-screen overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/main-bg.webp')", 
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* 🌈 Optional overlay (gradient gelap agar teks lebih jelas) */}
        <div className="absolute inset-0 bg-black/30 -z-10" />

        {/* 📦 Page content animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
