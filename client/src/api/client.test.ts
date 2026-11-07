import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import {
  apiClient,
  setSessionExpiredCallback,
} from "./client.js";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  subscribeToTokenChange,
} from "./tokenStorage.js";

describe("Frontend Client Security & Token Interceptors Audit", () => {
  beforeEach(() => {
    clearAccessToken();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    clearAccessToken();
    vi.restoreAllMocks();
  });

  describe("In-Memory Token Storage (XSS Mitigation)", () => {
    it("stores and retrieves token purely in memory without touching localStorage or sessionStorage", () => {
      setAccessToken("test_access_token_123");
      expect(getAccessToken()).toBe("test_access_token_123");

      // Verify ZERO localStorage or sessionStorage contamination
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
      expect(sessionStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      clearAccessToken();
      expect(getAccessToken()).toBeNull();
    });

    it("notifies subscribers when token changes or clears", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToTokenChange(listener);

      setAccessToken("token_alpha");
      expect(listener).toHaveBeenCalledWith("token_alpha");

      clearAccessToken();
      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
      setAccessToken("token_beta");
      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe("Single-Flight Refresh Token Interceptor & Simultaneous 401 Handling", () => {
    it("queues simultaneous 401 requests and replays all with the new token after a single refresh", async () => {
      // Mock axios.post for the refresh endpoint
      const refreshSpy = vi.spyOn(axios, "post").mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            accessToken: "rotated_access_token_new",
          },
        },
      });

      let requestCount = 0;
      // Mock apiClient execution adapter
      const adapterSpy = vi
        .spyOn(apiClient.defaults, "adapter" as any, "get")
        .mockReturnValue(async (config: any) => {
          requestCount++;
          // First attempt for all 3 calls fails with 401
          if (!config.headers?.Authorization?.includes("rotated_access_token_new")) {
            const error: any = new Error("Request failed with status code 401");
            error.response = { status: 401, data: { error: "Unauthorized" } };
            error.config = config;
            throw error;
          }

          // Replayed attempt with rotated token succeeds
          return {
            data: { success: true, requestedUrl: config.url },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
        });

      // Fire 3 simultaneous requests while unauthenticated or expired
      const [res1, res2, res3] = await Promise.all([
        apiClient.get("/readings?page=1"),
        apiClient.get("/reports/daily?date=2026-10-15"),
        apiClient.get("/auth/me"),
      ]);

      // Exactly ONE refresh call should have been triggered
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe("rotated_access_token_new");

      // All 3 requests should resolve successfully
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);

      adapterSpy.mockRestore();
    });

    it("rejects all queued requests and invokes session expiry callback when refresh fails", async () => {
      const expiredCallback = vi.fn();
      setSessionExpiredCallback(expiredCallback);

      // Refresh endpoint fails with 401 (e.g. refresh cookie expired)
      vi.spyOn(axios, "post").mockRejectedValueOnce({
        response: { status: 401, data: { error: "Invalid refresh token" } },
      });

      const adapterSpy = vi
        .spyOn(apiClient.defaults, "adapter" as any, "get")
        .mockReturnValue(async (config: any) => {
          const error: any = new Error("Unauthorized");
          error.response = { status: 401, data: { error: "Unauthorized" } };
          error.config = config;
          throw error;
        });

      // Fire 2 simultaneous requests
      const promises = Promise.all([
        apiClient.get("/readings?page=1"),
        apiClient.get("/readings/some-uuid"),
      ]);

      await expect(promises).rejects.toBeDefined();
      expect(getAccessToken()).toBeNull();
      expect(expiredCallback).toHaveBeenCalledTimes(1);

      adapterSpy.mockRestore();
    });
  });
});
