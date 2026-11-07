import React from "react";
import { Plus, Edit2, Trash2, Circle, Sun, Coffee, Utensils, Moon } from "lucide-react";
import type { Reading, TimeSlot } from "../../types/index.js";
import {
  TIME_SLOTS,
  formatDisplayDate,
  getGlucoseStatus,
  getTodayDateString,
} from "../../utils/glucose.js";

interface DailyTimelineProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  readings: Reading[];
  onAddSlot: (slot: TimeSlot) => void;
  onEditReading: (reading: Reading) => void;
  onDeleteReading: (reading: Reading) => void;
}

const SLOT_ICONS: Record<TimeSlot, React.ReactNode> = {
  "Morning (fasting)": <Sun className="h-5 w-5 text-amber-500" />,
  "After breakfast": <Coffee className="h-5 w-5 text-orange-500" />,
  "After lunch": <Utensils className="h-5 w-5 text-emerald-500" />,
  "After dinner": <Moon className="h-5 w-5 text-indigo-500" />,
};

const SLOT_DESCRIPTIONS: Record<TimeSlot, string> = {
  "Morning (fasting)": "Before breakfast (target: 70–99 mg/dl)",
  "After breakfast": "1–2 hrs post-breakfast (target: < 140 mg/dl)",
  "After lunch": "1–2 hrs post-lunch (target: < 140 mg/dl)",
  "After dinner": "1–2 hrs post-dinner (target: < 140 mg/dl)",
};

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  selectedDate,
  onDateChange,
  readings,
  onAddSlot,
  onEditReading,
  onDeleteReading,
}) => {
  const today = getTodayDateString();
  const isToday = selectedDate === today;

  // Map readings by slot
  const readingsBySlot = new Map<TimeSlot, Reading>();
  readings.forEach((r) => {
    readingsBySlot.set(r.timeSlot, r);
  });

  const completedSlotsCount = readings.length;

  const handleYesterday = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleToday = () => {
    onDateChange(today);
  };

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">
              {formatDisplayDate(selectedDate)}
            </h2>
            {isToday && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {completedSlotsCount === 4
              ? "All 4 daily readings completed. Excellent consistency!"
              : `${completedSlotsCount} of 4 readings logged for this date.`}
          </p>
        </div>

        {/* Date Selector Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleYesterday}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={handleToday}
            disabled={isToday}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              isToday
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            }`}
          >
            Today
          </button>
          <input
            type="date"
            max={today}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white cursor-pointer"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
          <span>Daily Completion</span>
          <span>{Math.round((completedSlotsCount / 4) * 100)}% ({completedSlotsCount}/4 slots)</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completedSlotsCount === 4
                ? "bg-emerald-500"
                : completedSlotsCount > 0
                ? "bg-teal-500"
                : "bg-slate-200"
            }`}
            style={{ width: `${(completedSlotsCount / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* 4 Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIME_SLOTS.map((slot) => {
          const reading = readingsBySlot.get(slot);
          const status = reading ? getGlucoseStatus(reading.value, slot) : null;

          return (
            <div
              key={slot}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                reading
                  ? "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  : "bg-slate-50/70 border-dashed border-slate-300 hover:border-emerald-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100">
                    {SLOT_ICONS[slot]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{slot}</h3>
                    <p className="text-[11px] text-slate-500">
                      {SLOT_DESCRIPTIONS[slot]}
                    </p>
                  </div>
                </div>

                {reading ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditReading(reading)}
                      title="Edit Reading"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteReading(reading)}
                      title="Delete Reading"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </div>

              {reading ? (
                <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {reading.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">
                      mg/dl
                    </span>
                  </div>
                  {status && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.badgeClass}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <button
                    onClick={() => onAddSlot(slot)}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Record Reading</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
