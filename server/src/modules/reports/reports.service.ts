import type { IReportsRepository } from "./reports.repository.js";
import { reportsRepository } from "./reports.repository.js";
import type { GetReportQuery, ReportType } from "./reports.validator.js";
import { formatReading, parseDateString, type FormattedReading } from "../readings/readings.service.js";

export interface ReportResult {
  reportType: ReportType;
  selectedDate: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stats: {
    highest: number | null;
    lowest: number | null;
    average: number | null;
    count: number;
  };
  readings?: FormattedReading[];
  isEmpty: boolean;
}

export class ReportsService {
  constructor(private readonly repository: IReportsRepository = reportsRepository) {}

  private formatDateString(d: Date): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private calculateDateRange(type: ReportType, selectedDateStr: string): { startDate: Date; endDate: Date } {
    const [yearStr, monthStr, dayStr] = selectedDateStr.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr); // 1-12
    const day = Number(dayStr);

    if (type === "daily") {
      const targetDate = parseDateString(selectedDateStr);
      return { startDate: targetDate, endDate: targetDate };
    }

    if (type === "mtd") {
      // 1st of the month to selected date
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month - 1, day));
      return { startDate, endDate };
    }

    // Monthly: The whole previous month
    // E.g. if selected date is 15 Oct 2026, whole previous month is 1 Sep - 30 Sep 2026
    const prevMonthDate = new Date(Date.UTC(year, month - 2, 1));
    const prevYear = prevMonthDate.getUTCFullYear();
    const prevMonth = prevMonthDate.getUTCMonth(); // 0-indexed

    const startDate = new Date(Date.UTC(prevYear, prevMonth, 1));
    // Day 0 of next month is last day of prevMonth
    const lastDayOfMonth = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate();
    const endDate = new Date(Date.UTC(prevYear, prevMonth, lastDayOfMonth));

    return { startDate, endDate };
  }

  async generateReport(userId: string, query: GetReportQuery): Promise<ReportResult> {
    const today = new Date();
    const defaultDateStr = this.formatDateString(
      new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
    );
    const selectedDateStr = query.date || defaultDateStr;

    const { startDate, endDate } = this.calculateDateRange(query.type, selectedDateStr);

    const [stats, records] = await Promise.all([
      this.repository.getAggregateStats(userId, startDate, endDate),
      this.repository.findReadingsInRange(userId, startDate, endDate),
    ]);

    const formattedReadings = records.map(formatReading);
    const isEmpty = stats.count === 0;

    return {
      reportType: query.type,
      selectedDate: selectedDateStr,
      dateRange: {
        startDate: this.formatDateString(startDate),
        endDate: this.formatDateString(endDate),
      },
      stats,
      readings: formattedReadings,
      isEmpty,
    };
  }
}

export const reportsService = new ReportsService();

