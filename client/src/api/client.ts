import axios from "axios";
import { env } from "../config/env.js";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sweety_access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, could notify auth provider or clear token
    if (error.response?.status === 401) {
      localStorage.removeItem("sweety_access_token");
    }
    return Promise.reject(error);
  }
);
