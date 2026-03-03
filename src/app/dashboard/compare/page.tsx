"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { useDashboard } from "@/contexts/DashboardContext";
import { useGA4Report } from "@/hooks/useGA4Report";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#eab308", "#8b5cf6"];

export default function ComparePage() {
  const { allPropertyIds } = useDashboard();
  const [selected, setSelected] = useState<string[]>([]);

  const comparison = useGA4Report({
    dimensions: ["hostName"],
    metrics: ["activeUsers", "sessions", "totalRevenue", "bounceRate", "ecommercePurchases"],
    orderBy: { field: "activeUsers", desc: true },
  });

  const trend = useGA4Report({
    dimensions: ["date", "hostName"],
    metrics: ["activeUsers"],
    orderBy: { field: "date", desc: false },
  });

  // Filter to selected domains
  const filteredRows = useMemo(() => {
    if (selected.length === 0) return comparison.rows.slice(0, 5);
    return comparison.rows.filter((r) =>
      selected.some((s) => r.dimensions.hostName?.includes(s))
    );
  }, [comparison.rows, selected]);

  const barData = useMemo(
    () =>
      filteredRows.map((r) => ({
        name: r.dimensions.hostName || "",
        users: Number(r.metrics.activeUsers || 0),
        sessions: Number(r.metrics.sessions || 0),
        revenue: Number(r.metrics.totalRevenue || 0),
      })),
    [filteredRows]
  );

  // Trend data pivoted by domain
  const trendData = useMemo(() => {
    const domains = filteredRows.map((r) => r.dimensions.hostName || "");
    const byDate: Record<string, Record<string, unknown>> = {};
    trend.rows.forEach((r) => {
      const host = r.dimensions.hostName || "";
      if (!domains.includes(host)) return;
      const date = r.dimensions.date?.slice(4) ?? "";
      if (!byDate[date]) byDate[date] = { date };
      byDate[date][host] = Number(r.metrics.activeUsers || 0);
    });
    return Object.values(byDate).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }, [trend.rows, filteredRows]);

  const domains = useMemo(
    () => filteredRows.map((r) => r.dimensions.hostName || ""),
    [filteredRows]
  );

  const tableRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        domain: r.dimensions.hostName || "",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        revenue: r.metrics.totalRevenue || "0",
        bounceRate: r.metrics.bounceRate || "0",
        purchases: r.metrics.ecommercePurchases || "0",
      })),
    [filteredRows]
  );

  const fmtPct = (v: string) => `${(Number(v) * 100).toFixed(1)}%`;

  // Get unique hostnames for selection
  const availableDomains = useMemo(
    () => comparison.rows.map((r) => r.dimensions.hostName || "").filter(Boolean),
    [comparison.rows]
  );

  function toggleDomain(domain: string) {
    setSelected((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : prev.length < 5 ? [...prev, domain] : prev
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Domain Comparison</h2>

      {/* Domain selector */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-2 text-xs text-gray-500">
          Select up to 5 domains to compare {selected.length > 0 && `(${selected.length} selected)`}
        </p>
        <div className="flex flex-wrap gap-1">
          {availableDomains.slice(0, 30).map((domain) => (
            <button
              key={domain}
              onClick={() => toggleDomain(domain)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                selected.includes(domain)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Users & Sessions Comparison" loading={comparison.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="users" fill="#2563eb" name="Users" />
                <Bar dataKey="sessions" fill="#16a34a" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Users Trend" loading={trend.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {domains.map((d, i) => (
                  <Line key={d} type="monotone" dataKey={d} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Comparison Table" loading={comparison.loading}>
        <DataTable
          columns={[
            { key: "domain", label: "Domain" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
            { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
            { key: "purchases", label: "Purchases", align: "right", format: (v) => Number(v).toLocaleString() },
          ]}
          rows={tableRows}
          defaultSortKey="users"
        />
      </ChartCard>
    </div>
  );
}
