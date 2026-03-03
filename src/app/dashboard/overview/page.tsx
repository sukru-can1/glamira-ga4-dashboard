"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#8b5cf6", "#06b6d4"];

export default function OverviewPage() {
  const trafficByDate = useGA4Report({
    dimensions: ["date"],
    metrics: ["activeUsers", "sessions", "screenPageViews", "totalRevenue", "bounceRate", "averageSessionDuration"],
    orderBy: { field: "date", desc: false },
  });

  const byDomain = useGA4Report({
    dimensions: ["hostName"],
    metrics: ["activeUsers", "sessions", "totalRevenue", "bounceRate"],
    orderBy: { field: "activeUsers", desc: true },
    limit: 20,
  });

  const byChannel = useGA4Report({
    dimensions: ["defaultChannelGroup"],
    metrics: ["activeUsers", "sessions"],
    orderBy: { field: "sessions", desc: true },
  });

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const rows = trafficByDate.rows;
    const sum = (key: string) => rows.reduce((s, r) => s + Number(r.metrics[key] || 0), 0);
    const avg = (key: string) => rows.length ? sum(key) / rows.length : 0;
    return {
      users: sum("activeUsers"),
      sessions: sum("sessions"),
      revenue: sum("totalRevenue"),
      pageViews: sum("screenPageViews"),
      bounceRate: avg("bounceRate") * 100,
      avgDuration: avg("averageSessionDuration"),
    };
  }, [trafficByDate.rows]);

  const sparkline = useMemo(
    () => trafficByDate.rows.map((r) => Number(r.metrics.activeUsers || 0)),
    [trafficByDate.rows]
  );

  // Chart data
  const trendData = useMemo(
    () =>
      trafficByDate.rows.map((r) => ({
        date: r.dimensions.date?.slice(4) ?? "",
        users: Number(r.metrics.activeUsers || 0),
        sessions: Number(r.metrics.sessions || 0),
      })),
    [trafficByDate.rows]
  );

  const channelData = useMemo(
    () =>
      byChannel.rows.map((r) => ({
        name: r.dimensions.defaultChannelGroup || "Other",
        value: Number(r.metrics.sessions || 0),
      })),
    [byChannel.rows]
  );

  const domainRows = useMemo(
    () =>
      byDomain.rows.map((r) => ({
        domain: r.dimensions.hostName || "",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        revenue: r.metrics.totalRevenue || "0",
        bounceRate: r.metrics.bounceRate || "0",
      })),
    [byDomain.rows]
  );

  const fmt = (n: number) => n.toLocaleString();
  const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (v: string) => `${(Number(v) * 100).toFixed(1)}%`;
  const fmtDur = (n: number) => {
    const m = Math.floor(n / 60);
    const s = Math.round(n % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard label="Users" value={fmt(kpis.users)} sparklineData={sparkline} />
        <KPICard label="Sessions" value={fmt(kpis.sessions)} />
        <KPICard label="Revenue" value={fmtMoney(kpis.revenue)} />
        <KPICard label="Page Views" value={fmt(kpis.pageViews)} />
        <KPICard label="Bounce Rate" value={`${kpis.bounceRate.toFixed(1)}%`} />
        <KPICard label="Avg Duration" value={fmtDur(kpis.avgDuration)} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Traffic Trend" loading={trafficByDate.loading} subtitle="Users & Sessions">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                <Area type="monotone" dataKey="sessions" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Channel Breakdown" loading={byChannel.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top Domains Table */}
      <ChartCard title="Top Domains" loading={byDomain.loading}>
        <DataTable
          columns={[
            { key: "domain", label: "Domain" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
            { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
          ]}
          rows={domainRows}
          defaultSortKey="users"
        />
      </ChartCard>
    </div>
  );
}
