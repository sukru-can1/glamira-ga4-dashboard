"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import type { GA4ReportRow } from "@/lib/ga4/types";

interface ReportConfig {
  dimensions: string[];
  metrics: string[];
  limit?: number;
  orderBy?: { field: string; desc?: boolean };
}

interface ReportData {
  rows: GA4ReportRow[];
  rowCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGA4Report(config: ReportConfig): ReportData {
  const { selectedPropertyIds, dateRange } = useDashboard();
  const [rows, setRows] = useState<GA4ReportRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (selectedPropertyIds.length === 0) {
      setRows([]);
      setRowCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ga4/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: selectedPropertyIds,
          dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate },
          dimensions: config.dimensions,
          metrics: config.metrics,
          limit: config.limit ?? 10000,
          orderBy: config.orderBy,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.results) {
        const allRows = data.results.flatMap((r: { rows: GA4ReportRow[] }) => r.rows);
        setRows(allRows);
        setRowCount(allRows.length);
      } else {
        setRows(data.rows ?? []);
        setRowCount(data.rowCount ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyIds, dateRange, config.dimensions, config.metrics, config.limit, config.orderBy]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { rows, rowCount, loading, error, refetch: fetchReport };
}
