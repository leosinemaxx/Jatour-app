"use client";

import ProtectedRoute from "../components/secure_route";

export default function Dashboard() {

  return (
    <ProtectedRoute>
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-teal-500 text-white">
        <h1 className="text-3xl font-semibold">Welcome to Dashboard!</h1>
        <p className="mt-2">You are successfully logged in 🎉</p>
      </main>
    </ProtectedRoute>
  );
}
