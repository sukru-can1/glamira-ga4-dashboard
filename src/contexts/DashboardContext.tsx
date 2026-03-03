"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const DATE_PRESETS: DateRange[] = [
  { startDate: "7daysAgo", endDate: "today", label: "7d" },
  { startDate: "30daysAgo", endDate: "today", label: "30d" },
  { startDate: "90daysAgo", endDate: "today", label: "90d" },
  { startDate: "365daysAgo", endDate: "today", label: "YTD" },
];

interface DashboardContextType {
  selectedPropertyIds: string[];
  setSelectedPropertyIds: (ids: string[]) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  datePresets: DateRange[];
  allPropertyIds: string[];
  setAllPropertyIds: (ids: string[]) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [allPropertyIds, setAllPropertyIds] = useState<string[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(DATE_PRESETS[1]);

  const setAllProps = useCallback((ids: string[]) => {
    setAllPropertyIds(ids);
    setSelectedPropertyIds(ids);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        selectedPropertyIds,
        setSelectedPropertyIds,
        dateRange,
        setDateRange,
        datePresets: DATE_PRESETS,
        allPropertyIds,
        setAllPropertyIds: setAllProps,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
}
