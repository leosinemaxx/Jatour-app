"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnimatedBg({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Daftar background sesuai halaman
  const backgrounds: Record<string, string> = {
    "/signin": "/Bali-Pantai.webp",
    "/signup": "/semeru.webp",
    "/": "/main-bg.webp",
  };

  // State background aktif
  const [bgImage, setBgImage] = useState(backgrounds["/"]);

  useEffect(() => {
    setBgImage(backgrounds[pathname] || "/default-bg.jpg");
  }, [pathname]);

  // Efek parallax scroll
  const { scrollY } = useScroll();
  const yTransform = useTransform(scrollY, [0, 300], ["0%", "10%"]);

  // Efek hover
  const [hovered, setHovered] = useState(false);

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        className="relative min-h-screen overflow-hidden flex items-center justify-center"
      >
        {/* 🌄 Background utama dengan transisi halus */}
        <motion.div
          key={bgImage}
          className="absolute inset-0 bg-cover bg-center -z-20"
          style={{
            backgroundImage: `url(${bgImage})`,
            y: yTransform,
            scale: hovered ? 1.1 : 1,
            filter: "brightness(0.9) contrast(1.05) saturate(1.1)",
          }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.8, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />

        {/* Overlay permanen (tidak ikut animasi exit, biar tidak white flash) */}
        <div className="absolute inset-0 bg-black/40 -z-10" />

        {/* 🌈 Konten halaman */}
        <motion.div
          key={`${pathname}-content`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 w-full flex items-center justify-center"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
