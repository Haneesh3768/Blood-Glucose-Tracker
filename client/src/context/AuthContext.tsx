import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/client.js";
import type { User } from "../types/index.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("sweety_access_token")
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<{ success: boolean; data: { user: User } }>("/auth/me");
        setUser(response.data.data.user);
      } catch (_error) {
        localStorage.removeItem("sweety_access_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { user: User; tokens: { accessToken: string; refreshToken: string } };
    }>("/auth/login", { email, password });

    const { user: authedUser, tokens } = response.data.data;
    localStorage.setItem("sweety_access_token", tokens.accessToken);
    setToken(tokens.accessToken);
    setUser(authedUser);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { user: User; tokens: { accessToken: string; refreshToken: string } };
    }>("/auth/signup", { name, email, password });

    const { user: authedUser, tokens } = response.data.data;
    localStorage.setItem("sweety_access_token", tokens.accessToken);
    setToken(tokens.accessToken);
    setUser(authedUser);
  };

  const logout = () => {
    localStorage.removeItem("sweety_access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
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
