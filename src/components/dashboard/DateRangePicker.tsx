"use client";

import { useDashboard } from "@/contexts/DashboardContext";

export function DateRangePicker() {
  const { dateRange, setDateRange, datePresets } = useDashboard();

  return (
    <div className="flex items-center gap-1">
      {datePresets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => setDateRange(preset)}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            dateRange.label === preset.label
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
