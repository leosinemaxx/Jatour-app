import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedLayout from "./layout-animasi";
import AnimatedBg from "./animasi-bg";
import { AuthProvider } from "@/app/components/auth/auth-context"; // ✅ path sesuai struktur kamu

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
        {/* ✅ Preload images for smoother transitions */}
        <link rel="preload" as="image" href="/Bali-Pantai.webp" />
        <link rel="preload" as="image" href="/semeru.webp" />
        <link rel="preload" as="image" href="/main-bg.webp" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 overflow-hidden`}
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
