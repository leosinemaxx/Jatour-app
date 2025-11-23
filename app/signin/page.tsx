"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isValidEmail } from "@/lib/utils";
import { FaFacebook, FaGoogle, FaMicrosoft } from "react-icons/fa";

export default function SignIn() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields!");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address!");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      // Redirect is handled in AuthContext
    } catch (err: any) {
      setError(err.message || "Invalid email or password!");
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

      {/* Sign In Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="flex flex-col gap-4 mb-6">
          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Log In
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            Not registered yet?{" "}
            <Link
              href="/signup"
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Sign In with Existing Account</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-3">
          {/* Facebook */}
          <button
            type="button"
            onClick={() => alert("Facebook login coming soon!")}
            disabled={isSubmitting}
            className="w-full bg-white border border-gray-200 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <FaFacebook className="w-5 h-5 text-blue-600" />
            Log In with FaceBook
          </button>

          {/* Outlook */}
          <button
            type="button"
            onClick={() => alert("Outlook login coming soon!")}
            disabled={isSubmitting}
            className="w-full bg-white border border-gray-200 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <FaMicrosoft className="w-5 h-5 text-blue-500" />
            Log In with Outlook
          </button>

          {/* Google */}
          <button
            type="button"
            onClick={() => alert("Google login coming soon!")}
            disabled={isSubmitting}
            className="w-full bg-white border border-gray-200 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <FaGoogle className="w-5 h-5 text-red-500" />
            Log In with Google
          </button>
        </div>
      </motion.div>
    </main>
  );
}
