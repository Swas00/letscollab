"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "VIEWER";
  avatarUrl?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("neostats_token");
    const savedUser = localStorage.getItem("neostats_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with server in background
        api.auth.me().then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("neostats_user", JSON.stringify(res.data.user));
          } else if (res.status === 401 || res.status === 403) {
            logout();
          }
        });
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await api.auth.login({ email, password });
    setIsLoading(false);

    if (res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("neostats_token", res.data.token);
      localStorage.setItem("neostats_user", JSON.stringify(res.data.user));
      return { success: true };
    }

    return { success: false, error: res.error || "Login failed" };
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    setIsLoading(true);
    const res = await api.auth.register({ name, email, password, role });
    setIsLoading(false);

    if (res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("neostats_token", res.data.token);
      localStorage.setItem("neostats_user", JSON.stringify(res.data.user));
      return { success: true };
    }

    return { success: false, error: res.error || "Registration failed" };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("neostats_token");
    localStorage.removeItem("neostats_user");
  };

  const refreshUser = async () => {
    const res = await api.auth.me();
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem("neostats_user", JSON.stringify(res.data.user));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
