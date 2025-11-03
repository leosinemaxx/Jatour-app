import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedLayout from "./layout-animasi";
import AnimatedBg from "./animasi-bg";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Jatour App",
  description: "Login/Register UI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/Bali-Pantai.webp" />
        <link rel="preload" as="image" href="/semeru.webp" />
        <link rel="preload" as="image" href="/main-bg.webp" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 overflow-hidden`}
      >
        
        <AnimatedBg><AnimatedLayout>{children}</AnimatedLayout></AnimatedBg>
      </body>
    </html>
  );
}
