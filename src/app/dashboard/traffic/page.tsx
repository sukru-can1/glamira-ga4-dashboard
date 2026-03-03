"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#16a34a",
  "Direct": "#2563eb",
  "Referral": "#eab308",
  "Paid Search": "#dc2626",
  "Social": "#8b5cf6",
  "Email": "#06b6d4",
  "Display": "#f97316",
};

export default function TrafficPage() {
  const channelTrend = useGA4Report({
    dimensions: ["date", "defaultChannelGroup"],
    metrics: ["sessions"],
    orderBy: { field: "date", desc: false },
  });

  const sourceMedium = useGA4Report({
    dimensions: ["sessionSource", "sessionMedium"],
    metrics: ["activeUsers", "sessions", "bounceRate", "totalRevenue", "engagementRate"],
    orderBy: { field: "sessions", desc: true },
    limit: 100,
  });

  // Pivot channel data by date
  const trendData = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    channelTrend.rows.forEach((r) => {
      const date = r.dimensions.date?.slice(4) ?? "";
      const channel = r.dimensions.defaultChannelGroup || "Other";
      if (!byDate[date]) byDate[date] = { date: Number(date) } as never;
      byDate[date][channel] = (byDate[date][channel] || 0) + Number(r.metrics.sessions || 0);
      (byDate[date] as Record<string, unknown>).date = date;
    });
    return Object.values(byDate).sort((a, b) =>
      String((a as Record<string, unknown>).date).localeCompare(String((b as Record<string, unknown>).date))
    );
  }, [channelTrend.rows]);

  const channels = useMemo(() => {
    const set = new Set<string>();
    channelTrend.rows.forEach((r) => set.add(r.dimensions.defaultChannelGroup || "Other"));
    return Array.from(set);
  }, [channelTrend.rows]);

  // Top referrers (source)
  const topReferrers = useMemo(() => {
    return sourceMedium.rows
      .slice(0, 10)
      .map((r) => ({
        name: `${r.dimensions.sessionSource}/${r.dimensions.sessionMedium}`,
        sessions: Number(r.metrics.sessions || 0),
      }));
  }, [sourceMedium.rows]);

  const sourceRows = useMemo(
    () =>
      sourceMedium.rows.map((r) => ({
        source: r.dimensions.sessionSource || "(direct)",
        medium: r.dimensions.sessionMedium || "(none)",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        bounceRate: r.metrics.bounceRate || "0",
        revenue: r.metrics.totalRevenue || "0",
        engagement: r.metrics.engagementRate || "0",
      })),
    [sourceMedium.rows]
  );

  const fmtPct = (v: string) => `${(Number(v) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Traffic Sources</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Channel Trend" loading={channelTrend.loading}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {channels.map((ch) => (
                  <Area
                    key={ch}
                    type="monotone"
                    dataKey={ch}
                    stackId="1"
                    stroke={CHANNEL_COLORS[ch] || "#94a3b8"}
                    fill={CHANNEL_COLORS[ch] || "#94a3b8"}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top 10 Sources" loading={sourceMedium.loading}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topReferrers} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Source / Medium" loading={sourceMedium.loading}>
        <DataTable
          columns={[
            { key: "source", label: "Source" },
            { key: "medium", label: "Medium" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
            { key: "engagement", label: "Engagement", align: "right", format: fmtPct },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
          ]}
          rows={sourceRows}
          defaultSortKey="sessions"
        />
      </ChartCard>
    </div>
  );
}
