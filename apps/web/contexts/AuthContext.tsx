"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, AuthStatus } from "@/types/auth";
import { CoreService } from "@/lib/core";
import { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    type: "github" | "magiclink",
    onError: (err: string) => void,
    onSuccess: () => void,
    email?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const coreService = CoreService.getInstance();

  const checkAuthStatus = async () => {
    try {
      const status = await coreService.getStatus();
      setIsAuthenticated(status.authenticated);
      setUser(status.user || null);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    type: "github" | "magiclink",
    onError: (err: string) => void,
    onSuccess: () => void,
    email?: string,
  ) => {
    try {
      if (type == "magiclink" && email)
        await coreService.magiclinkLogin({ email });
      else await coreService.githubLogin();
      onSuccess();
    } catch (err: any) {
      const error =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Unknown error occurred";

      console.log("Error caught:", error);
      onError(error);
    }
  };

  const logout = async () => {
    const success = await coreService.logout();
    if (success) {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();

    // Check auth status periodically (every 5 minutes)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
