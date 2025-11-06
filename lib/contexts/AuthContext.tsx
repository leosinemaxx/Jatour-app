"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/app/datatypes";
import { userAPI } from "@/lib/api";
import { storage } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean; // alias for compatibility
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "jatour_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedAuth = storage.get<{ userId: string }>(AUTH_STORAGE_KEY);
        if (storedAuth?.userId) {
          const userData = await userAPI.getById(storedAuth.userId);
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        storage.remove(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userData = await userAPI.login(email, password);
      setUser(userData);
      storage.set(AUTH_STORAGE_KEY, { userId: userData.id });
      
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (error) {
      throw new Error("Invalid email or password");
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    try {
      // Check if email already exists
      const existingUser = await userAPI.getByEmail(data.email);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      const newUser = await userAPI.create(data);
      setUser(newUser);
      storage.set(AUTH_STORAGE_KEY, { userId: newUser.id });
      
      // Redirect to dashboard after successful signup
      router.push("/dashboard");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create account");
    }
  };

  const logout = () => {
    setUser(null);
    storage.remove(AUTH_STORAGE_KEY);
    router.push("/signin");
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) throw new Error("No user logged in");

    try {
      const updatedUser = await userAPI.update(user.id, data);
      setUser(updatedUser);
    } catch (error) {
      throw new Error("Failed to update user");
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loading: isLoading, // alias for compatibility
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
