import type { IReportsRepository, AggregateStats } from "./reports.repository.js";
import { reportsRepository } from "./reports.repository.js";
import type { GetReportQuery, ReportType } from "./reports.validator.js";
import {
  formatReading,
  parseDateString,
  type FormattedReading,
} from "../readings/readings.service.js";

export interface ReportResult {
  reportType: ReportType;
  selectedDate: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stats: AggregateStats;
  readings: FormattedReading[];
  isEmpty: boolean;
}

export function calculateDateRange(
  type: ReportType,
  selectedDateStr: string
): {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
} {
  const [yearStr, monthStr, dayStr] = selectedDateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-12
  const day = Number(dayStr);

  if (type === "daily") {
    const targetDate = parseDateString(selectedDateStr);
    return {
      startDate: targetDate,
      endDate: targetDate,
      startDateStr: selectedDateStr,
      endDateStr: selectedDateStr,
    };
  }

  if (type === "month-to-date") {
    // 1st of current month to selected date
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month - 1, day));
    const startDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
    return {
      startDate,
      endDate,
      startDateStr,
      endDateStr: selectedDateStr,
    };
  }

  // Monthly: The whole previous calendar month relative to selected date
  let prevYear = year;
  let prevMonth = month - 1; // 1-12
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const startDate = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
  // Day 0 of next month in UTC gives the exact last calendar day of prevMonth
  // This deterministically handles 28, 29, 30, and 31 day months and leap years
  const lastDayDate = new Date(Date.UTC(prevYear, prevMonth, 0));
  const lastDay = lastDayDate.getUTCDate();
  const endDate = new Date(Date.UTC(prevYear, prevMonth - 1, lastDay));

  const startDateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const endDateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return {
    startDate,
    endDate,
    startDateStr,
    endDateStr,
  };
}

export class ReportsService {
  constructor(private readonly repository: IReportsRepository = reportsRepository) {}

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private normalizeReportType(type: string): ReportType {
    if (type === "mtd" || type === "month-to-date") return "month-to-date";
    if (type === "monthly") return "monthly";
    return "daily";
  }

  async getDailyReport(userId: string, dateStr?: string): Promise<ReportResult> {
    return this.generateReport(userId, { type: "daily", date: dateStr });
  }

  async getMonthToDateReport(userId: string, dateStr?: string): Promise<ReportResult> {
    return this.generateReport(userId, { type: "month-to-date", date: dateStr });
  }

  async getMonthlyReport(userId: string, dateStr?: string): Promise<ReportResult> {
    return this.generateReport(userId, { type: "monthly", date: dateStr });
  }

  async generateReport(userId: string, query: GetReportQuery): Promise<ReportResult> {
    const selectedDateStr = query.date || this.getTodayDateString();
    const normalizedType = this.normalizeReportType(query.type);

    const { startDate, endDate, startDateStr, endDateStr } = calculateDateRange(
      normalizedType,
      selectedDateStr
    );

    // Run aggregations and readings queries in parallel scoped strictly to authenticated userId
    const [stats, records] = await Promise.all([
      this.repository.getAggregateStats(userId, startDate, endDate),
      this.repository.findReadingsInRange(userId, startDate, endDate),
    ]);

    const formattedReadings = records.map(formatReading);
    const isEmpty = stats.count === 0;

    return {
      reportType: normalizedType,
      selectedDate: selectedDateStr,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      stats,
      readings: formattedReadings,
      isEmpty,
    };
  }
}

export const reportsService = new ReportsService();
