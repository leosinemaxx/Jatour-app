"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function SignIn() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[url('/beach.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 bg-white/20 backdrop-blur-lg rounded-2xl p-8 w-80 text-white">
        <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center text-2xl font-semibold mb-6"
>
  Sign In
</motion.h2>

        <motion.form
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
>
          <input
            type="email"
            placeholder="Email"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="password"
            placeholder="Password"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
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
