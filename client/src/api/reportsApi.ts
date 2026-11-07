import { apiClient } from "./client.js";
import type { ApiSuccessResponse, ReportResult, ReportType } from "../types/index.js";

export async function fetchDailyReport(date?: string): Promise<ReportResult> {
  const response = await apiClient.get<ApiSuccessResponse<{ report: ReportResult }>>(
    "/reports/daily",
    { params: date ? { date } : {} }
  );
  return response.data.data.report;
}

export async function fetchMonthToDateReport(date?: string): Promise<ReportResult> {
  const response = await apiClient.get<ApiSuccessResponse<{ report: ReportResult }>>(
    "/reports/month-to-date",
    { params: date ? { date } : {} }
  );
  return response.data.data.report;
}

export async function fetchMonthlyReport(date?: string): Promise<ReportResult> {
  const response = await apiClient.get<ApiSuccessResponse<{ report: ReportResult }>>(
    "/reports/monthly",
    { params: date ? { date } : {} }
  );
  return response.data.data.report;
}

export async function fetchReport(type: ReportType, date?: string): Promise<ReportResult> {
  if (type === "daily") {
    return fetchDailyReport(date);
  }
  if (type === "month-to-date" || type === "mtd") {
    return fetchMonthToDateReport(date);
  }
  return fetchMonthlyReport(date);
}
