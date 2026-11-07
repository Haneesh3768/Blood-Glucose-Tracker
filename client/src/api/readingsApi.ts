import { apiClient } from "./client.js";
import type { ApiSuccessResponse, Reading, TimeSlot } from "../types/index.js";

export interface CreateReadingPayload {
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  value: number;
}

export interface UpdateReadingPayload {
  readingDate: string;
  timeSlot: TimeSlot;
  value: number;
}

export interface GetReadingsParams {
  page?: number;
  limit?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchReadings(params: GetReadingsParams = {}) {
  const response = await apiClient.get<
    ApiSuccessResponse<{ readings: Reading[] }>
  >("/readings", { params });
  return {
    readings: response.data.data.readings,
    meta: response.data.meta,
  };
}

export async function createReading(payload: CreateReadingPayload) {
  const response = await apiClient.post<
    ApiSuccessResponse<{ reading: Reading }>
  >("/readings", payload);
  return response.data.data.reading;
}

export async function updateReading(id: string, payload: UpdateReadingPayload) {
  const response = await apiClient.put<
    ApiSuccessResponse<{ reading: Reading }>
  >(`/readings/${id}`, payload);
  return response.data.data.reading;
}

export async function deleteReading(id: string) {
  const response = await apiClient.delete<
    ApiSuccessResponse<{ message: string }>
  >(`/readings/${id}`);
  return response.data.data;
}

