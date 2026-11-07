import { apiClient } from "./client.js";
import type { ApiSuccessResponse, ReportResult, ReportType } from "../types/index.js";

export async function fetchReport(type: ReportType, date?: string) {
  const response = await apiClient.get<
    ApiSuccessResponse<{ report: ReportResult }>
  >("/reports/summary", {
    params: {
      type,
      ...(date ? { date } : {}),
    },
  });
  return response.data.data.report;
}
