import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import type { Reading } from "../../types/index.js";
import { fetchReadings } from "../../api/readingsApi.js";
import { formatDisplayDate, getGlucoseStatus } from "../../utils/glucose.js";

interface ReadingsHistoryProps {
  onEditReading: (reading: Reading) => void;
  onDeleteReading: (reading: Reading) => void;
}

export const ReadingsHistory: React.FC<ReadingsHistoryProps> = ({
  onEditReading,
  onDeleteReading,
}) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["readingsHistory", page, limit],
    queryFn: () => fetchReadings({ page, limit }),
  });

  const readings = data?.readings || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Readings History
          </h2>
          <p className="text-xs text-slate-500">
            Paginated patient logbook (Page {page} of {totalPages})
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Loading logbook entries...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-rose-500 text-sm">
          Failed to load logbook. Please try again.
        </div>
      ) : readings.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No blood glucose readings found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Clinical Range</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map((reading) => {
                const status = getGlucoseStatus(reading.value, reading.timeSlot);
                return (
                  <tr key={reading.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {formatDisplayDate(reading.readingDate)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {reading.timeSlot}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-base">
                        {reading.value}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">mg/dl</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.badgeClass}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEditReading(reading)}
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteReading(reading)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-medium text-slate-600">
        <div>
          Showing page {page} of {totalPages} ({meta?.total || 0} total records)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-bold text-slate-800">{page}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
