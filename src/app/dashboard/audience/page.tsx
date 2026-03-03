"use client";

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line,
} from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

export default function AudiencePage() {
  const userType = useGA4Report({
    dimensions: ["newVsReturning"],
    metrics: ["activeUsers", "sessions", "totalRevenue"],
  });

  const byCountry = useGA4Report({
    dimensions: ["country"],
    metrics: ["activeUsers", "sessions", "totalRevenue"],
    orderBy: { field: "activeUsers", desc: true },
    limit: 20,
  });

  const byLanguage = useGA4Report({
    dimensions: ["language"],
    metrics: ["activeUsers", "sessions", "totalRevenue"],
    orderBy: { field: "activeUsers", desc: true },
    limit: 30,
  });

  const engagementTrend = useGA4Report({
    dimensions: ["date"],
    metrics: ["engagementRate"],
    orderBy: { field: "date", desc: false },
  });

  const COLORS = ["#2563eb", "#16a34a"];

  const pieData = useMemo(
    () =>
      userType.rows.map((r) => ({
        name: r.dimensions.newVsReturning || "Unknown",
        value: Number(r.metrics.activeUsers || 0),
      })),
    [userType.rows]
  );

  const kpis = useMemo(() => {
    const newRow = userType.rows.find((r) => r.dimensions.newVsReturning === "new");
    const retRow = userType.rows.find((r) => r.dimensions.newVsReturning === "returning");
    const total = Number(newRow?.metrics.activeUsers || 0) + Number(retRow?.metrics.activeUsers || 0);
    return {
      newUsers: Number(newRow?.metrics.activeUsers || 0),
      returning: Number(retRow?.metrics.activeUsers || 0),
      newPct: total > 0 ? (Number(newRow?.metrics.activeUsers || 0) / total) * 100 : 0,
    };
  }, [userType.rows]);

  const countryData = useMemo(
    () =>
      byCountry.rows.slice(0, 20).map((r) => ({
        name: r.dimensions.country || "Unknown",
        users: Number(r.metrics.activeUsers || 0),
      })),
    [byCountry.rows]
  );

  const languageRows = useMemo(
    () =>
      byLanguage.rows.map((r) => ({
        language: r.dimensions.language || "Unknown",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        revenue: r.metrics.totalRevenue || "0",
      })),
    [byLanguage.rows]
  );

  const engagementData = useMemo(
    () =>
      engagementTrend.rows.map((r) => ({
        date: r.dimensions.date?.slice(4) ?? "",
        rate: Number(r.metrics.engagementRate || 0) * 100,
      })),
    [engagementTrend.rows]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Audience</h2>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="New Users" value={kpis.newUsers.toLocaleString()} />
        <KPICard label="Returning Users" value={kpis.returning.toLocaleString()} />
        <KPICard label="New User %" value={`${kpis.newPct.toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="New vs Returning" loading={userType.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top Countries" loading={byCountry.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="users" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Engagement Rate Trend" loading={engagementTrend.loading}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={engagementData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Languages" loading={byLanguage.loading}>
        <DataTable
          columns={[
            { key: "language", label: "Language" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
          ]}
          rows={languageRows}
          defaultSortKey="users"
        />
      </ChartCard>
    </div>
  );
}
