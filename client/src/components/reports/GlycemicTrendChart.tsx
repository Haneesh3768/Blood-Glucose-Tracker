import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { Reading } from "../../types/index.js";
import { formatDisplayDate } from "../../utils/glucose.js";

interface GlycemicTrendChartProps {
  readings: Reading[];
}

export const GlycemicTrendChart: React.FC<GlycemicTrendChartProps> = ({ readings }) => {
  if (!readings || readings.length === 0) return null;

  // Format data chronologically for the chart
  const data = readings.map((r, idx) => ({
    id: r.id,
    index: idx + 1,
    date: r.readingDate,
    displayDate: formatDisplayDate(r.readingDate),
    slot: r.timeSlot,
    value: r.value,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-semibold text-emerald-400">{item.displayDate}</p>
          <p className="text-slate-300">{item.slot}</p>
          <p className="text-base font-bold text-white">{item.value} mg/dl</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Glycemic Variation Trend
          </h3>
          <p className="text-xs text-slate-500">
            Glucose readings timeline over the reporting period
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Target Range (70–140 mg/dl)</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
            />
            <YAxis
              domain={[40, "auto"]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
              unit=" mg"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Target Range Reference Lines */}
            <ReferenceLine
              y={70}
              stroke="#10B981"
              strokeDasharray="4 4"
              label={{ value: "Low threshold (70)", fill: "#10B981", fontSize: 10 }}
            />
            <ReferenceLine
              y={140}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{ value: "Post-meal target (140)", fill: "#F59E0B", fontSize: 10 }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#059669", strokeWidth: 2, stroke: "#FFFFFF" }}
              activeDot={{ r: 6, fill: "#047857", strokeWidth: 2, stroke: "#FFFFFF" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

