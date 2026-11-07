import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { ReportType } from "../../types/index.js";
import { fetchReport } from "../../api/reportsApi.js";
import { formatDisplayDate, getGlucoseStatus } from "../../utils/glucose.js";
import { EmptyReportState } from "./EmptyReportState.js";
import { GlycemicTrendChart } from "./GlycemicTrendChart.js";

interface ReportsViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddReading: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  selectedDate,
  onDateChange,
  onAddReading,
}) => {
  const [reportType, setReportType] = useState<ReportType>("daily");

  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["report", reportType, selectedDate],
    queryFn: () => fetchReport(reportType, selectedDate),
  });

  const getScopeBadge = () => {
    switch (reportType) {
      case "daily":
        return `Selected Date: ${formatDisplayDate(selectedDate)}`;
      case "mtd":
        return report?.dateRange
          ? `Month-to-Date: ${formatDisplayDate(report.dateRange.startDate)} – ${formatDisplayDate(report.dateRange.endDate)}`
          : "Month-to-Date Range";
      case "monthly":
        return report?.dateRange
          ? `Full Previous Month: ${formatDisplayDate(report.dateRange.startDate)} – ${formatDisplayDate(report.dateRange.endDate)}`
          : "Previous Month Range";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Report Scope Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">
              Glycemic Reports & Summary
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Aggregated Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500">{getScopeBadge()}</p>
        </div>

        {/* Tab Controls & Reference Date */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportType("daily")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === "daily"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setReportType("mtd")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === "mtd"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month-to-Date
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Previous Month
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              title="Change reference date"
            />
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            Calculating aggregate statistics...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load report</p>
            <p className="text-xs text-rose-600 mt-1">
              {(error as any)?.message || "Please check connection or retry."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Report Content */}
      {report && (
        <>
          {report.isEmpty ? (
            <EmptyReportState
              reportType={reportType}
              dateRange={report.dateRange}
              onAddReading={onAddReading}
            />
          ) : (
            <>
              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Highest */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Highest
                    </span>
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {report.stats.highest ?? "—"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      mg/dl
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Peak reading recorded
                  </p>
                </div>

                {/* Lowest */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Lowest
                    </span>
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {report.stats.lowest ?? "—"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      mg/dl
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nadir reading recorded
                  </p>
                </div>

                {/* Average (rounded to 1 decimal) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Average
                    </span>
                    <Activity className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {report.stats.average !== null
                        ? Number(report.stats.average).toFixed(1)
                        : "—"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      mg/dl
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mean glycemic concentration
                  </p>
                </div>

                {/* Number of Readings */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Readings
                    </span>
                    <Layers className="h-4 w-4 text-teal-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {report.stats.count}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      entries
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total valid observations
                  </p>
                </div>
              </div>

              {/* Trend Chart */}
              {report.readings && report.readings.length > 0 && (
                <GlycemicTrendChart readings={report.readings} />
              )}

              {/* Daily Report Breakdown (Lists each reading with its slot) */}
              {reportType === "daily" && report.readings && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">
                      Daily Slot Observations ({report.readings.length}/4 recorded)
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Date: {formatDisplayDate(report.selectedDate)}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {report.readings.map((reading) => {
                      const status = getGlucoseStatus(
                        reading.value,
                        reading.timeSlot
                      );
                      return (
                        <div
                          key={reading.id}
                          className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {reading.timeSlot}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Logged at {new Date(reading.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.badgeClass}`}
                            >
                              {status.label}
                            </span>
                            <div className="text-right">
                              <span className="text-xl font-extrabold text-slate-900">
                                {reading.value}
                              </span>
                              <span className="text-xs font-semibold text-slate-500 ml-1">
                                mg/dl
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
