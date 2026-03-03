"use client";

import { useState, useCallback } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import type { GA4ReportRow } from "@/lib/ga4/types";

const AVAILABLE_DIMENSIONS = [
  "date", "hostName", "pagePath", "landingPage", "pageTitle",
  "sessionSource", "sessionMedium", "defaultChannelGroup", "sessionCampaignName",
  "country", "city", "continent", "region",
  "deviceCategory", "browser", "operatingSystem", "screenResolution",
  "newVsReturning", "language",
  "itemName", "itemCategory", "itemBrand",
];

const AVAILABLE_METRICS = [
  "activeUsers", "newUsers", "sessions", "engagedSessions",
  "screenPageViews", "bounceRate", "averageSessionDuration", "engagementRate",
  "totalRevenue", "ecommercePurchases", "averagePurchaseRevenue",
  "eventCount", "conversions",
  "itemRevenue", "itemsViewed", "itemsAddedToCart", "itemsPurchased",
  "advertiserAdCost", "advertiserAdClicks", "returnOnAdSpend",
];

export default function ReportsPage() {
  const { selectedPropertyIds, dateRange } = useDashboard();
  const [dims, setDims] = useState<string[]>(["date"]);
  const [mets, setMets] = useState<string[]>(["activeUsers", "sessions"]);
  const [rows, setRows] = useState<GA4ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runReport = useCallback(async () => {
    if (dims.length === 0 || mets.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ga4/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: selectedPropertyIds,
          dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate },
          dimensions: dims,
          metrics: mets,
          limit: 500,
          orderBy: { field: mets[0], desc: true },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.results) {
        setRows(data.results.flatMap((r: { rows: GA4ReportRow[] }) => r.rows));
      } else {
        setRows(data.rows ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run report");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyIds, dateRange, dims, mets]);

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  const tableColumns = [
    ...dims.map((d) => ({ key: d, label: d })),
    ...mets.map((m) => ({
      key: m,
      label: m,
      align: "right" as const,
      format: (v: string) => {
        const n = Number(v);
        if (m.includes("Rate") || m.includes("rate")) return `${(n * 100).toFixed(1)}%`;
        if (m.includes("Revenue") || m.includes("Cost") || m.includes("revenue")) return `$${n.toFixed(2)}`;
        return n.toLocaleString();
      },
    })),
  ];

  const tableRows = rows.map((r) => {
    const row: Record<string, string> = {};
    dims.forEach((d) => (row[d] = r.dimensions[d] || ""));
    mets.forEach((m) => (row[m] = r.metrics[m] || "0"));
    return row;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Custom Reports</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dimensions */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-gray-700">Dimensions</p>
          <div className="flex flex-wrap gap-1">
            {AVAILABLE_DIMENSIONS.map((d) => (
              <button
                key={d}
                onClick={() => toggleItem(dims, setDims, d)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  dims.includes(d)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-gray-700">Metrics</p>
          <div className="flex flex-wrap gap-1">
            {AVAILABLE_METRICS.map((m) => (
              <button
                key={m}
                onClick={() => toggleItem(mets, setMets, m)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  mets.includes(m)
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={runReport}
          disabled={loading || dims.length === 0 || mets.length === 0}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Report"}
        </button>
        <span className="text-xs text-gray-400">
          {dims.length} dimensions, {mets.length} metrics
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <ChartCard title={`Results (${rows.length} rows)`}>
          <DataTable
            columns={tableColumns}
            rows={tableRows}
            defaultSortKey={mets[0]}
            pageSize={50}
          />
        </ChartCard>
      )}
    </div>
  );
}
