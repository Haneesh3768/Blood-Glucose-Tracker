import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import type { Reading, TimeSlot } from "../../types/index.js";
import { TIME_SLOTS, getTodayDateString } from "../../utils/glucose.js";
import { createReading, updateReading } from "../../api/readingsApi.js";

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialReading?: Reading | null;
  defaultDate?: string;
  defaultSlot?: TimeSlot;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialReading,
  defaultDate,
  defaultSlot,
}) => {
  const today = getTodayDateString();

  const [readingDate, setReadingDate] = useState(defaultDate || today);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(
    defaultSlot || "Morning (fasting)"
  );
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialReading) {
      setReadingDate(initialReading.readingDate);
      setTimeSlot(initialReading.timeSlot);
      setValue(String(initialReading.value));
    } else {
      setReadingDate(defaultDate || today);
      setTimeSlot(defaultSlot || "Morning (fasting)");
      setValue("");
    }
    setError(null);
  }, [initialReading, defaultDate, defaultSlot, isOpen, today]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    // Rule 1: Value is required
    if (value === undefined || value === null || value.trim() === "") {
      setError("Please enter a glucose value.");
      return false;
    }

    // Rule 2: Value must be a whole number between 40 and 600
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
      setError("Value must be between 40 and 600 mg/dl.");
      return false;
    }

    // Rule 5: Date cannot be in the future
    if (readingDate > today) {
      setError("Date cannot be in the future.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        readingDate,
        timeSlot,
        glucoseValue: Number(value),
        value: Number(value),
      };

      if (initialReading) {
        await updateReading(initialReading.id, payload);
      } else {
        await createReading(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const serverError =
        err.response?.data?.error ||
        err.message ||
        "An error occurred while saving the reading.";
      setError(serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {initialReading ? "Edit Glucose Reading" : "Record Blood Glucose"}
            </h3>
            <p className="text-xs text-slate-500">
              Record up to 4 clinical slots per day
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm animate-shake"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              max={today}
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lavender-500/20 focus:border-lavender-600 text-sm transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Readings cannot be logged for future dates.
            </p>
          </div>

          {/* Slot Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Time Slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lavender-500/20 focus:border-lavender-600 text-sm transition bg-white"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Glucose Value Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Glucose Value
              </label>
              <span className="text-xs font-medium text-slate-500">mg/dl</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="40"
                max="600"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lavender-500/20 focus:border-lavender-600 text-base font-semibold transition"
              />
              <span className="absolute right-3.5 top-3 text-xs font-medium text-slate-400">
                mg/dl
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Whole number between 40 and 600 mg/dl.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : initialReading
                ? "Update Reading"
                : "Record Reading"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
