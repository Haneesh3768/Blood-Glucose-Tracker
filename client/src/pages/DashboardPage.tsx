import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { fetchReadings, deleteReading } from "../api/readingsApi.js";
import { fetchDailyReport } from "../api/reportsApi.js";
import { DailyTimeline } from "../components/dashboard/DailyTimeline.js";
import { GlycemicTrendChart } from "../components/reports/GlycemicTrendChart.js";
import { ReadingModal } from "../components/readings/ReadingModal.js";
import { DeleteConfirmModal } from "../components/readings/DeleteConfirmModal.js";
import { getTodayDateString, formatDisplayDate } from "../utils/glucose.js";
import type { Reading, TimeSlot } from "../types/index.js";

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Modal states
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<TimeSlot | undefined>(undefined);

  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 1. Fetch daily readings for selected date
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["dailyReadings", selectedDate],
    queryFn: () => fetchReadings({ date: selectedDate }),
  });

  const dailyReadings = dailyData?.readings || [];

  // 2. Fetch daily report stats for selected date
  const { data: dailyReport } = useQuery({
    queryKey: ["dailyReport", selectedDate],
    queryFn: () => fetchDailyReport(selectedDate),
  });

  // 3. Fetch past 30 days of readings for the monthly trend chart
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: trendData } = useQuery({
    queryKey: ["monthlyTrend", startDateStr, today],
    queryFn: () => fetchReadings({ startDate: startDateStr, endDate: today, limit: 100 }),
  });

  const trendReadings = trendData?.readings || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReading(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyReadings"] });
      queryClient.invalidateQueries({ queryKey: ["dailyReport"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyTrend"] });
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      setIsDeleteModalOpen(false);
      setDeletingReading(null);
    },
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

  const handleOpenAdd = (slot?: TimeSlot) => {
    setEditingReading(null);
    setDefaultSlot(slot || "Morning (fasting)");
    setIsReadingModalOpen(true);
  };

  const handleOpenEdit = (reading: Reading) => {
    setEditingReading(reading);
    setDefaultSlot(undefined);
    setIsReadingModalOpen(true);
  };

  const handleOpenDelete = (reading: Reading) => {
    setDeletingReading(reading);
    setIsDeleteModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["dailyReadings"] });
    queryClient.invalidateQueries({ queryKey: ["dailyReport"] });
    queryClient.invalidateQueries({ queryKey: ["monthlyTrend"] });
    queryClient.invalidateQueries({ queryKey: ["readings"] });
  };

  const stats = dailyReport?.stats;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Date Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Patient Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record blood glucose readings across physiological slots and view instant analytics
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
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
              {selectedDate === today && (
                <span className="text-[10px] bg-lavender-100 text-lavender-700 px-1.5 py-0.2 rounded-md font-medium">
                  Today
                </span>
              )}
            </div>
            <button
              onClick={handleNextDay}
              disabled={selectedDate >= today}
              title="Next Day"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-3 py-1.5 text-xs font-medium text-lavender-700 bg-lavender-50 hover:bg-lavender-100 rounded-xl border border-lavender-200 transition"
            >
              Back to Today
            </button>
          )}

          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition"
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
          >
            <Plus className="w-4 h-4" />
            <span>Record Reading</span>
          </button>
        </div>
      </div>

      {/* 4 Daily Metric Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highest Card */}
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
            <span className="text-2xl font-bold text-slate-900">
              {stats?.highest !== null && stats?.highest !== undefined ? stats.highest : "—"}
            </span>
            {stats?.highest && <span className="text-xs text-slate-400 font-medium">mg/dl</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Peak daily reading</p>
        </div>

        {/* Lowest Card */}
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
            <span className="text-2xl font-bold text-slate-900">
              {stats?.lowest !== null && stats?.lowest !== undefined ? stats.lowest : "—"}
            </span>
            {stats?.lowest && <span className="text-xs text-slate-400 font-medium">mg/dl</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Minimum daily reading</p>
        </div>

        {/* Average Card (Rounded to 1 decimal) */}
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
            <span className="text-2xl font-bold text-slate-900">
              {stats?.average !== null && stats?.average !== undefined ? stats.average : "—"}
            </span>
            {stats?.average && <span className="text-xs text-slate-400 font-medium">mg/dl</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mean glycemic value (1 dec)</p>
        </div>

        {/* Readings Count Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daily Readings
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-slate-900">{stats?.count || 0}</span>
            <span className="text-xs text-slate-400 font-medium">of 4 slots</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.count === 4 ? "All slots completed" : "Maximum 4 per day"}
          </p>
        </div>
      </div>

      {/* Daily Readings Grouped by 4 Physiological Slots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Daily Clinical Slots</h2>
          <span className="text-xs text-slate-400 font-medium">
            Morning · Breakfast · Lunch · Dinner
          </span>
        </div>

        {dailyLoading ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-lavender-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DailyTimeline
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            readings={dailyReadings}
            onAddSlot={handleOpenAdd}
            onEditReading={handleOpenEdit}
            onDeleteReading={handleOpenDelete}
          />
        )}
      </div>

      {/* Monthly Trend Chart (Recharts) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Glycemic Trend (Past 30 Days)</h2>
            <p className="text-xs text-slate-500">
              Historical progression with clinical target reference band
            </p>
          </div>
          <Link
            to="/reports/monthly"
            className="text-xs font-semibold text-lavender-600 hover:text-lavender-700"
          >
            View Full Reports →
          </Link>
        </div>

        {trendReadings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-2xl bg-lavender-50 text-lavender-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Historical Readings Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start logging your blood glucose readings daily to view trends, patterns, and clinical insights.
            </p>
            <button
              onClick={() => handleOpenAdd()}
              className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition"
              style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            >
              Record First Reading
            </button>
          </div>
        ) : (
          <GlycemicTrendChart readings={trendReadings} />
        )}
      </div>

      {/* Modals */}
      <ReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialReading={editingReading}
        defaultDate={selectedDate}
        defaultSlot={defaultSlot}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (deletingReading) {
            deleteMutation.mutate(deletingReading.id);
          }
        }}
        reading={deletingReading}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

