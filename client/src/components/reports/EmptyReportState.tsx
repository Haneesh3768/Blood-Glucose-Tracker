import React from "react";
import { ClipboardList, Plus } from "lucide-react";

interface EmptyReportStateProps {
  reportType: "daily" | "mtd" | "monthly";
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onAddReading: () => void;
}

export const EmptyReportState: React.FC<EmptyReportStateProps> = ({
  reportType,
  dateRange,
  onAddReading,
}) => {
  const getScopeMessage = () => {
    switch (reportType) {
      case "daily":
        return `No blood glucose readings were logged on ${dateRange.startDate}.`;
      case "mtd":
        return `No blood glucose readings recorded from ${dateRange.startDate} to ${dateRange.endDate}.`;
      case "monthly":
        return `No blood glucose readings recorded for the previous month (${dateRange.startDate} – ${dateRange.endDate}).`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
      <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
        <ClipboardList className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">
        No Readings Recorded Yet
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        {getScopeMessage()} Regular daily logs help you track glycemic trends and share clear summaries with your healthcare provider.
      </p>
      <button
        onClick={onAddReading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition"
      >
        <Plus className="h-4 w-4" />
        <span>Record a Reading</span>
      </button>
    </div>
  );
};
