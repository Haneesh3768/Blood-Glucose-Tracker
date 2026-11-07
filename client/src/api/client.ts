import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "../config/env.js";
import { getAccessToken, setAccessToken } from "./tokenStorage.js";
import type { User } from "../types/index.js";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send HTTP-only refresh cookies
});

// Attach in-memory access token to outgoing requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh token queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Global hook for AuthContext to know when refresh fails (session ended)
let onSessionExpiredCallback: (() => void) | null = null;
export function setSessionExpiredCallback(cb: () => void): void {
  onSessionExpiredCallback = cb;
}

// Unified single-flight refresh promise shared across the entire application
type RefreshResult = { accessToken: string; user?: User };

let activeRefreshPromise: Promise<RefreshResult> | null = null;

export async function refreshTokenSingleFlight(): Promise<RefreshResult> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  isRefreshing = true;
  activeRefreshPromise = (async () => {
    try {
      const refresh = () =>
        axios.post<{
          success: boolean;
          data?: {
            accessToken?: string;
            tokens?: { accessToken: string };
            user?: User;
          };
        }>(`${env.VITE_API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });

      let response;
      try {
        response = await refresh();
      } catch (error: unknown) {
        // The failed response clears the retired /api/v1/auth cookie. Retry
        // once so a valid Path=/ cookie can restore the session immediately.
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          response = await refresh();
        } else {
          throw error;
        }
      }

      const payload = response.data.data;
      const newAccessToken = payload?.accessToken || payload?.tokens?.accessToken;

      if (!newAccessToken) {
        throw new Error("No access token received from refresh");
      }

      setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);
      return { accessToken: newAccessToken, user: payload?.user };
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);
      if (onSessionExpiredCallback) {
        onSessionExpiredCallback();
      }
      throw refreshError;
    } finally {
      isRefreshing = false;
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If no response or already retried or it's an auth endpoint, reject directly
    const url = originalRequest?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh");

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing || activeRefreshPromise) {
      // Another request is already refreshing the token; queue this request
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;

    try {
      const { accessToken } = await refreshTokenSingleFlight();
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
