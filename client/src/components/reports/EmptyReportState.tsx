import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import type { ReportType } from "../../types/index.js";

interface EmptyReportStateProps {
  reportType?: ReportType | string;
  scope?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  } | string;
  onAddReading?: () => void;
  onAction?: () => void;
}

export const EmptyReportState: React.FC<EmptyReportStateProps> = ({
  reportType,
  scope,
  dateRange,
  onAddReading,
  onAction,
}) => {
  const rangeDisplay = typeof dateRange === "string"
    ? dateRange
    : dateRange
    ? `${dateRange.startDate} – ${dateRange.endDate}`
    : "";

  const handleAction = onAddReading || onAction;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
      <div className="h-16 w-16 rounded-2xl bg-lavender-50 border border-lavender-100 text-lavender-500 flex items-center justify-center mx-auto mb-4">
        <ClipboardList className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">
        No Readings Recorded Yet
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        No blood glucose readings were logged for {scope || reportType || "this period"}
        {rangeDisplay ? ` (${rangeDisplay})` : ""}. Logging daily readings across your clinical
        slots provides accurate averages and historical trend insights.
      </p>
      {handleAction ? (
        <button
          onClick={handleAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-sm shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Record a Reading</span>
        </button>
      ) : (
        <Link
          to="/readings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-sm shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Record a Reading</span>
        </Link>
      )}
    </div>
  );
};
