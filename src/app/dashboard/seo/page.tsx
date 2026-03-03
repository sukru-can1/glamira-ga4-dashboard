"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

export default function SEOPage() {
  const organicTrend = useGA4Report({
    dimensions: ["date"],
    metrics: ["activeUsers", "sessions", "totalRevenue"],
    orderBy: { field: "date", desc: false },
  });

  const landingPages = useGA4Report({
    dimensions: ["landingPage"],
    metrics: ["activeUsers", "sessions", "bounceRate", "totalRevenue"],
    orderBy: { field: "sessions", desc: true },
    limit: 50,
  });

  const contentPerf = useGA4Report({
    dimensions: ["pagePath"],
    metrics: ["screenPageViews", "averageSessionDuration", "bounceRate"],
    orderBy: { field: "screenPageViews", desc: true },
    limit: 50,
  });

  const kpis = useMemo(() => {
    const rows = organicTrend.rows;
    const sum = (key: string) => rows.reduce((s, r) => s + Number(r.metrics[key] || 0), 0);
    return {
      users: sum("activeUsers"),
      sessions: sum("sessions"),
      revenue: sum("totalRevenue"),
    };
  }, [organicTrend.rows]);

  const trendData = useMemo(
    () =>
      organicTrend.rows.map((r) => ({
        date: r.dimensions.date?.slice(4) ?? "",
        users: Number(r.metrics.activeUsers || 0),
        sessions: Number(r.metrics.sessions || 0),
      })),
    [organicTrend.rows]
  );

  const landingRows = useMemo(
    () =>
      landingPages.rows.map((r) => ({
        page: r.dimensions.landingPage || "",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        bounceRate: r.metrics.bounceRate || "0",
        revenue: r.metrics.totalRevenue || "0",
      })),
    [landingPages.rows]
  );

  const contentRows = useMemo(
    () =>
      contentPerf.rows.map((r) => ({
        path: r.dimensions.pagePath || "",
        views: r.metrics.screenPageViews || "0",
        avgDuration: r.metrics.averageSessionDuration || "0",
        bounceRate: r.metrics.bounceRate || "0",
      })),
    [contentPerf.rows]
  );

  const fmtPct = (v: string) => `${(Number(v) * 100).toFixed(1)}%`;
  const fmtDur = (v: string) => {
    const n = Number(v);
    return `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">SEO & Organic</h2>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Organic Users" value={kpis.users.toLocaleString()} />
        <KPICard label="Organic Sessions" value={kpis.sessions.toLocaleString()} />
        <KPICard label="Organic Revenue" value={`$${kpis.revenue.toFixed(2)}`} />
      </div>

      <ChartCard title="Organic Traffic Trend" loading={organicTrend.loading}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
              <Area type="monotone" dataKey="sessions" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Landing Pages" loading={landingPages.loading}>
        <DataTable
          columns={[
            { key: "page", label: "Landing Page" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
          ]}
          rows={landingRows}
          defaultSortKey="sessions"
        />
      </ChartCard>

      <ChartCard title="Content Performance" loading={contentPerf.loading}>
        <DataTable
          columns={[
            { key: "path", label: "Page Path" },
            { key: "views", label: "Views", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "avgDuration", label: "Avg Duration", align: "right", format: fmtDur },
            { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
          ]}
          rows={contentRows}
          defaultSortKey="views"
        />
      </ChartCard>
    </div>
  );
}
