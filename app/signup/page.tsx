"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isValidEmail } from "@/lib/utils";

export default function SignUp() {
  const { signup } = useAuth();

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password || !form.confirmPassword || !form.fullName.trim()) {
      setError("Please fill in all required fields!");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address!");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      });
      // Redirect handled in AuthContext
    } catch (err: any) {
      const errorMessage = err?.message || "Signup failed, please try again!";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden w-full">
      {/* Background Image */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/destinations/Bali-Pantai.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark Overlay */}
      <div className="fixed inset-0 w-full h-full bg-black/20"></div>

      {/* Location Badge - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-8 left-8 z-10"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800">Pantai Klayar</h3>
          <p className="text-sm text-gray-600">Pacitan</p>
        </div>
      </motion.div>

      {/* Sign Up Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign Up</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          {/* Full Name Input */}
          <input
            type="text"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            disabled={isSubmitting}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={isSubmitting}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          {/* Phone Number Input */}
          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={isSubmitting}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          {/* Password Section Label */}
          <div className="mt-2">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Password
            </label>
          </div>

          {/* Create Password Input */}
          <input
            type="password"
            placeholder="Create Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={isSubmitting}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          {/* Confirm Password Input */}
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            disabled={isSubmitting}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-800 text-white rounded-lg py-3 font-medium hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Register
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
