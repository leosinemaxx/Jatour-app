"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnimatedBg({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🖼️ Daftar background per halaman
  const backgrounds: Record<string, string> = {
    "/signin": "/destinations/Bali-Pantai.webp",
    "/signup": "/destinations/semeru.webp",
    "/": "/destinations/main-bg.webp",
  };

  const [bgImage, setBgImage] = useState(backgrounds["/"]);

  useEffect(() => {
    setBgImage(backgrounds[pathname] || "/destinations/main-bg.webp");
  }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* 🌄 Background utama */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />


      {/* 📦 Konten halaman */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
