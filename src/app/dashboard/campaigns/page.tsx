"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

export default function CampaignsPage() {
  const campaignData = useGA4Report({
    dimensions: ["sessionCampaignName", "sessionMedium", "sessionSource"],
    metrics: ["activeUsers", "sessions", "totalRevenue", "advertiserAdCost", "advertiserAdClicks", "returnOnAdSpend"],
    orderBy: { field: "sessions", desc: true },
    limit: 100,
  });

  const trend = useGA4Report({
    dimensions: ["date"],
    metrics: ["advertiserAdCost", "totalRevenue"],
    orderBy: { field: "date", desc: false },
  });

  const kpis = useMemo(() => {
    const rows = campaignData.rows;
    const sum = (key: string) => rows.reduce((s, r) => s + Number(r.metrics[key] || 0), 0);
    const adCost = sum("advertiserAdCost");
    const revenue = sum("totalRevenue");
    return {
      adSpend: adCost,
      adRevenue: revenue,
      roas: adCost > 0 ? revenue / adCost : 0,
    };
  }, [campaignData.rows]);

  const trendData = useMemo(
    () =>
      trend.rows.map((r) => ({
        date: r.dimensions.date?.slice(4) ?? "",
        spend: Number(r.metrics.advertiserAdCost || 0),
        revenue: Number(r.metrics.totalRevenue || 0),
      })),
    [trend.rows]
  );

  const topCampaigns = useMemo(
    () =>
      campaignData.rows.slice(0, 10).map((r) => ({
        name: r.dimensions.sessionCampaignName || "(not set)",
        revenue: Number(r.metrics.totalRevenue || 0),
      })),
    [campaignData.rows]
  );

  const campaignRows = useMemo(
    () =>
      campaignData.rows.map((r) => ({
        campaign: r.dimensions.sessionCampaignName || "(not set)",
        medium: r.dimensions.sessionMedium || "(none)",
        source: r.dimensions.sessionSource || "(direct)",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        revenue: r.metrics.totalRevenue || "0",
        cost: r.metrics.advertiserAdCost || "0",
        roas: r.metrics.returnOnAdSpend || "0",
      })),
    [campaignData.rows]
  );

  const fmtMoney = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Campaigns & Paid</h2>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Ad Spend" value={fmtMoney(kpis.adSpend)} />
        <KPICard label="Ad Revenue" value={fmtMoney(kpis.adRevenue)} />
        <KPICard label="ROAS" value={`${kpis.roas.toFixed(2)}x`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Spend vs Revenue" loading={trend.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="spend" stroke="#dc2626" strokeWidth={2} dot={false} name="Spend" />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top Campaigns by Revenue" loading={campaignData.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCampaigns} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="revenue" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="All Campaigns" loading={campaignData.loading}>
        <DataTable
          columns={[
            { key: "campaign", label: "Campaign" },
            { key: "source", label: "Source" },
            { key: "medium", label: "Medium" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
            { key: "cost", label: "Cost", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
            { key: "roas", label: "ROAS", align: "right", format: (v) => `${Number(v).toFixed(2)}x` },
          ]}
          rows={campaignRows}
          defaultSortKey="sessions"
        />
      </ChartCard>
    </div>
  );
}
