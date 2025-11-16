import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedLayout from "./layout-animasi";
import AnimatedBg from "./animasi-bg";
import { AuthProvider } from "@/lib/contexts/AuthContext"; // ✅ path sesuai struktur kamu

// === Font Configuration ===
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// === Metadata ===
export const metadata: Metadata = {
  title: "Jatour App",
  description: "Login/Register UI",
};

// === Root Layout ===
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#0ea5e9" />
        {/* ✅ Preload images for smoother transitions */}
        <link rel="preload" as="image" href="/destinations/Bali-Pantai.webp" />
        <link rel="preload" as="image" href="/destinations/semeru.webp" />
        <link rel="preload" as="image" href="/destinations/main-bg.webp" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        {/* ✅ Global Auth Context Wrapper */}
        <AuthProvider>
          {/* ✅ Background and layout animation layers */}
          <AnimatedBg>
            <AnimatedLayout>{children}</AnimatedLayout>
          </AnimatedBg>
        </AuthProvider>
      </body>
    </html>
  );
}
