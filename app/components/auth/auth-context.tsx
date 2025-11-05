"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signup: (payload: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }) => Promise<void>;
  signin: (payload: { email: string; password: string }) => Promise<void>;
  signout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Restore session from localStorage saat pertama kali load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = localStorage.getItem("jatour_session");
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem("jatour_session");
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ✅ SIGN UP
  async function signup(payload: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }) {
    if (!payload.email || !payload.password)
      throw new Error("Email dan password wajib diisi!");

    // Cek apakah user sudah terdaftar
    const existing = await apiFetch(`/users?email=${encodeURIComponent(payload.email)}`);
    if (existing && existing.length) throw new Error("Email sudah terdaftar!");

    // Simpan user baru
    await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    router.push("/signin");
  }

  // ✅ SIGN IN
  async function signin(payload: { email: string; password: string }) {
    if (!payload.email || !payload.password)
      throw new Error("Email dan password wajib diisi!");

    const found = await apiFetch(
      `/users?email=${encodeURIComponent(payload.email)}&password=${encodeURIComponent(payload.password)}`
    );

    if (!found || !found.length) throw new Error("Email atau password salah!");

    const u = found[0];
    setUser(u);
    localStorage.setItem("jatour_session", JSON.stringify(u));

    router.push("/dashboard");
  }

  // ✅ SIGN OUT
  function signout() {
    setUser(null);
    localStorage.removeItem("jatour_session");
    router.push("/signin");
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
