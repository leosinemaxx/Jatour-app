"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/app/components/auth/auth-context"; // pastikan path ini benar

export default function SignIn() {
  const { signin } = useAuth(); // ambil fungsi signin dari AuthContext
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  

  const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    await signin({ email, password }); 
  } catch (err: any) {
    setError(err.message || "Email atau password salah!");
  }
};

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[url('/beach.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 bg-white/20 backdrop-blur-lg rounded-2xl p-8 w-80 text-white shadow-lg">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center text-2xl font-semibold mb-6"
        >
          Sign In
        </motion.h2>

        <motion.form
          onSubmit={handleSignIn}
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />

          {error && (
            <p className="text-red-300 text-xs text-center -mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="bg-white text-black rounded-full py-2 mt-2 hover:bg-gray-100 transition"
          >
            Log In
          </button>
        </motion.form>

        <p className="text-xs text-center mt-4">
          Not registered yet?{" "}
          <Link href="/signup" className="underline hover:text-white">
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  );
}
