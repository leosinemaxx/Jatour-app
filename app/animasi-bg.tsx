"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnimatedBg({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🖼️ Daftar background per halaman
  const backgrounds: Record<string, string> = {
    "/signin": "/Bali-Pantai.webp",
    "/signup": "/semeru.webp",
    "/": "/main-bg.webp",
  };

  const [bgImage, setBgImage] = useState(backgrounds["/"]);

  useEffect(() => {
    setBgImage(backgrounds[pathname] || "/default-bg.jpg");
  }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* 🌄 Background utama */}
      <div
        className="absolute inset-0 bg-cover bg-center -z-20"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />

      {/* 🌫 Overlay halus tanpa bentuk kotak */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* 📦 Konten halaman */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
