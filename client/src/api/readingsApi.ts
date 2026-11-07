import { apiClient } from "./client.js";
import type { ApiSuccessResponse, Reading, TimeSlot } from "../types/index.js";

export interface CreateReadingPayload {
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  glucoseValue?: number;
  value?: number;
}

export interface UpdateReadingPayload {
  readingDate?: string;
  timeSlot?: TimeSlot;
  glucoseValue?: number;
  value?: number;
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

export async function fetchReadingById(id: string) {
  const response = await apiClient.get<
    ApiSuccessResponse<{ reading: Reading }>
  >(`/readings/${id}`);
  return response.data.data.reading;
}

export async function createReading(payload: CreateReadingPayload) {
  const response = await apiClient.post<
    ApiSuccessResponse<{ reading: Reading }>
  >("/readings", {
    readingDate: payload.readingDate,
    timeSlot: payload.timeSlot,
    glucoseValue: payload.glucoseValue ?? payload.value,
  });
  return response.data.data.reading;
}

export async function updateReading(id: string, payload: UpdateReadingPayload) {
  const response = await apiClient.patch<
    ApiSuccessResponse<{ reading: Reading }>
  >(`/readings/${id}`, {
    ...(payload.readingDate ? { readingDate: payload.readingDate } : {}),
    ...(payload.timeSlot ? { timeSlot: payload.timeSlot } : {}),
    ...(payload.glucoseValue !== undefined || payload.value !== undefined
      ? { glucoseValue: payload.glucoseValue ?? payload.value }
      : {}),
  });
  return response.data.data.reading;
}

export async function deleteReading(id: string) {
  const response = await apiClient.delete<
    ApiSuccessResponse<{ message: string; id?: string }>
  >(`/readings/${id}`);
  return response.data.data;
}
