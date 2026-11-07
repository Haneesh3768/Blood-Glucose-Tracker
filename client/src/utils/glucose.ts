import type { TimeSlot } from "../types/index.js";

export type GlucoseStatus = "low" | "normal" | "elevated" | "high";

export interface StatusInfo {
  status: GlucoseStatus;
  label: string;
  badgeClass: string;
  color: string;
}

export function getGlucoseStatus(value: number, slot: TimeSlot): StatusInfo {
  const isFasting = slot === "Morning (fasting)";

  if (value < 70) {
    return {
      status: "low",
      label: "Low (Hypo)",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      color: "#EF4444",
    };
  }

  if (isFasting) {
    if (value <= 99) {
      return {
        status: "normal",
        label: "Normal Fasting",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "#10B981",
      };
    }
    if (value <= 125) {
      return {
        status: "elevated",
        label: "Pre-diabetes Range",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        color: "#F59E0B",
      };
    }
    return {
      status: "high",
      label: "Elevated Fasting",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      color: "#DC2626",
    };
  } else {
    // Post-meal
    if (value < 140) {
      return {
        status: "normal",
        label: "Normal Post-meal",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "#10B981",
      };
    }
    if (value <= 199) {
      return {
        status: "elevated",
        label: "Elevated Post-meal",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        color: "#F59E0B",
      };
    }
    return {
      status: "high",
      label: "High Post-meal",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      color: "#DC2626",
    };
  }
}

export const TIME_SLOTS: TimeSlot[] = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return dateStr;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

