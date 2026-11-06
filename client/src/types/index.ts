export type TimeSlot =
  | "Morning (fasting)"
  | "After breakfast"
  | "After lunch"
  | "After dinner";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Reading {
  id: string;
  userId: string;
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  value: number; // mg/dl
  createdAt: string;
  updatedAt: string;
}

export interface AggregateStats {
  count: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
}

export type ReportType = "daily" | "mtd" | "monthly";

export interface ReportResult {
  reportType: ReportType;
  selectedDate: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stats: AggregateStats;
  readings?: Reading[];
  isEmpty: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
