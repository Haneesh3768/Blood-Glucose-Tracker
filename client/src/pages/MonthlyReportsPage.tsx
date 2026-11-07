import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { fetchMonthToDateReport, fetchMonthlyReport } from "../api/reportsApi.js";
import { getTodayDateString, formatDisplayDate } from "../utils/glucose.js";
import { GlycemicTrendChart } from "../components/reports/GlycemicTrendChart.js";
import { EmptyReportState } from "../components/reports/EmptyReportState.js";

type ScopeTab = "mtd" | "monthly";

export const MonthlyReportsPage: React.FC = () => {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<ScopeTab>("mtd");

  const { data: report, isLoading } = useQuery({
    queryKey: ["reportScope", activeTab, selectedDate],
    queryFn: () =>
      activeTab === "mtd"
        ? fetchMonthToDateReport(selectedDate)
        : fetchMonthlyReport(selectedDate),
  });

  const handlePrevMonth = () => {
    const parts = selectedDate.split("-").map(Number);
    const y = parts[0] ?? new Date().getFullYear();
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    const date = new Date(Date.UTC(y, m - 2, d));
    const nextY = date.getUTCFullYear();
    const nextM = String(date.getUTCMonth() + 1).padStart(2, "0");
    const nextD = String(date.getUTCDate()).padStart(2, "0");
    setSelectedDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleNextMonth = () => {
    const parts = selectedDate.split("-").map(Number);
    const y = parts[0] ?? new Date().getFullYear();
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    const date = new Date(Date.UTC(y, m, d));
    const nextY = date.getUTCFullYear();
    const nextM = String(date.getUTCMonth() + 1).padStart(2, "0");
    const nextD = String(date.getUTCDate()).padStart(2, "0");
    const result = `${nextY}-${nextM}-${nextD}`;
    if (result <= today) {
      setSelectedDate(result);
    }
  };

  const stats = report?.stats;
  const readings = report?.readings || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Monthly Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated glycemic statistics and historical progression over monthly scopes
          </p>
        </div>

        {/* Tab & Anchor Date Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Toggle Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setActiveTab("mtd")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "mtd"
                  ? "bg-white text-lavender-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month-to-Date
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "monthly"
                  ? "bg-white text-lavender-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Whole Previous Month
            </button>
          </div>

          {/* Anchor Date Controls */}
          <div className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-200 p-1">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 py-1 text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-lavender-600" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={selectedDate >= today}
              title="Next Month"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Scope Indicator */}
      {report?.dateRange && (
        <div className="p-3.5 bg-lavender-50/70 border border-lavender-200/60 rounded-xl text-xs text-lavender-900 flex items-center justify-between">
          <span>
            <strong className="font-semibold text-lavender-950">Active Range:</strong>{" "}
            {formatDisplayDate(report.dateRange.startDate)} – {formatDisplayDate(report.dateRange.endDate)}
          </span>
          <span className="text-[11px] text-lavender-600 uppercase font-bold tracking-wider">
            {activeTab === "mtd" ? "Month-to-Date" : "Full Previous Month"}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-lavender-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report?.isEmpty ? (
        <EmptyReportState
          scope={activeTab === "mtd" ? "Month-to-Date" : "Monthly"}
          dateRange={`${formatDisplayDate(report.dateRange.startDate)} – ${formatDisplayDate(
            report.dateRange.endDate
          )}`}
          onAction={() => {}}
        />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Highest
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-slate-900">{stats?.highest}</span>
                <span className="text-xs text-slate-400 font-medium">mg/dl</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Peak reading across range</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Lowest
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-slate-900">{stats?.lowest}</span>
                <span className="text-xs text-slate-400 font-medium">mg/dl</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Minimum reading across range</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Average
                </span>
                <div className="w-8 h-8 rounded-xl bg-lavender-100 text-lavender-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-slate-900">{stats?.average}</span>
                <span className="text-xs text-slate-400 font-medium">mg/dl</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Actual record-level average</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Readings
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-slate-900">{stats?.count}</span>
                <span className="text-xs text-slate-400 font-medium">entries</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total aggregated readings</p>
            </div>
          </div>

          {/* Glycemic Chart */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Period Trend Progression</h2>
            {readings.length > 0 ? (
              <GlycemicTrendChart readings={readings} />
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <div className="w-10 h-10 rounded-2xl bg-lavender-50 text-lavender-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500">No chart entries for this date range.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
