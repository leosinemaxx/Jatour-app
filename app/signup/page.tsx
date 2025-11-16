"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function SignUp() {
  const router = useRouter();
  const { signup } = useAuth(); // 🔹 ambil fungsi signup dari AuthContext

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  // === Handle Submit ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi dasar
    if (!form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields!");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      // 🔹 Simpan data user ke localStorage melalui AuthContext
      await signup({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      });

      // 🔹 Redirect ke Sign In setelah berhasil daftar
      router.push("/signin");
    } catch (err: any) {
      console.error(err);
      setError("Signup failed, please try again!");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden w-full h-full">
      {/* Background Image */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/destinations/semeru.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Dark Overlay to reduce brightness - expanded to cover entire page */}
      <div className="fixed inset-0 w-full h-full bg-black/50 z-0"></div>

      {/* Form Card */}
      <div className="relative z-10 bg-white/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-4 text-white shadow-lg my-8">
        <h2 className="text-center text-2xl font-semibold mb-6">Sign Up</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="password"
            placeholder="Create Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            required
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />

          {error && (
            <p className="text-red-300 text-sm text-center -mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="bg-white text-black rounded-full py-2 mt-2 hover:bg-gray-100 transition"
          >
            Register
          </button>
        </form>

        <p className="text-xs text-center mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="underline hover:text-white">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
