import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Plus,
} from "lucide-react";
import { fetchDailyReport } from "../api/reportsApi.js";
import { getTodayDateString, formatDisplayDate, getGlucoseStatus } from "../utils/glucose.js";
import { EmptyReportState } from "../components/reports/EmptyReportState.js";

export const DailyReportPage: React.FC = () => {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const { data: report, isLoading } = useQuery({
    queryKey: ["dailyReport", selectedDate],
    queryFn: () => fetchDailyReport(selectedDate),
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const nextDate = `${y}-${m}-${day}`;
    if (nextDate <= today) {
      setSelectedDate(nextDate);
    }
  };

  const stats = report?.stats;
  const readings = report?.readings || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Date Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Daily Clinical Report</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated statistical summary and individual slot readings for the selected date
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-200 p-1">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-lavender-600" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextDay}
              disabled={selectedDate >= today}
              title="Next Day"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            to={`/readings/new?date=${selectedDate}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition"
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Reading</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-lavender-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report?.isEmpty ? (
        <EmptyReportState
          scope="Daily"
          dateRange={formatDisplayDate(selectedDate)}
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
              <p className="text-[11px] text-slate-400 mt-1">Peak reading on this date</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Minimum reading on this date</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Arithmetic mean (1 decimal)</p>
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
                <span className="text-xs text-slate-400 font-medium">recorded</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Slots logged for this date</p>
            </div>
          </div>

          {/* Daily Slot Breakdown Table / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Recorded Readings Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each reading with its clinical physiological slot and glycemic classification
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {readings.map((r) => {
                const status = getGlucoseStatus(r.glucoseValue ?? r.value, r.timeSlot);
                return (
                  <div
                    key={r.id}
                    className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{r.timeSlot}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Logged on {formatDisplayDate(r.readingDate)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {r.glucoseValue ?? r.value}{" "}
                          <span className="text-xs font-normal text-slate-400">mg/dl</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.badgeClass}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

