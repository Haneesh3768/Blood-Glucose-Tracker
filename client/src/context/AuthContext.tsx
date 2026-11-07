import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient, refreshTokenSingleFlight, setSessionExpiredCallback } from "../api/client.js";
import { getAccessToken, setAccessToken } from "../api/tokenStorage.js";
import type { User } from "../types/index.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializingRef = React.useRef(false);

  useEffect(() => {
    // Listen for session expiry from axios interceptor
    setSessionExpiredCallback(() => {
      setUser(null);
    });

    if (initializingRef.current) {
      return;
    }
    initializingRef.current = true;

    // Silent refresh attempt on application mount
    async function initAuth() {
      try {
        const { accessToken, user: refreshedUser } = await refreshTokenSingleFlight();

        if (accessToken) {
          if (refreshedUser) {
            setUser(refreshedUser);
          } else {
            // Fetch user profile identity fallback
            const meRes = await apiClient.get<{ success: boolean; data: { user: User } }>("/auth/me");
            setUser(meRes.data.data.user);
          }
        } else {
          setUser(null);
        }
      } catch (_error) {
        // No active refresh session; start clean
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        user: User;
        accessToken?: string;
        tokens?: { accessToken: string };
      };
    }>("/auth/login", { email, password });

    const payload = response.data.data;
    const accessToken = payload.accessToken || payload.tokens?.accessToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    setUser(payload.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        user: User;
        accessToken?: string;
        tokens?: { accessToken: string };
      };
    }>("/auth/register", { name, email, password });

    const payload = response.data.data;
    const accessToken = payload.accessToken || payload.tokens?.accessToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    setUser(payload.user);
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (_e) {
      // Ignore network errors during logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await apiClient.post("/auth/logout-all");
    } catch (_e) {
      // Ignore errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: getAccessToken(),
        isLoading,
        login,
        signup,
        logout,
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
