"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Funnel, FunnelChart, LabelList,
} from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

export default function EcommercePage() {
  const revenueTrend = useGA4Report({
    dimensions: ["date"],
    metrics: ["totalRevenue", "ecommercePurchases", "averagePurchaseRevenue", "purchaserConversionRate"],
    orderBy: { field: "date", desc: false },
  });

  const products = useGA4Report({
    dimensions: ["itemName"],
    metrics: ["itemRevenue", "itemsViewed", "itemsAddedToCart", "itemsPurchased"],
    orderBy: { field: "itemRevenue", desc: true },
    limit: 50,
  });

  const byDomain = useGA4Report({
    dimensions: ["hostName"],
    metrics: ["totalRevenue", "ecommercePurchases"],
    orderBy: { field: "totalRevenue", desc: true },
    limit: 10,
  });

  const funnel = useGA4Report({
    dimensions: [],
    metrics: ["itemsViewed", "itemsAddedToCart", "itemsCheckedOut", "itemsPurchased"],
  });

  // KPIs
  const kpis = useMemo(() => {
    const rows = revenueTrend.rows;
    const sum = (key: string) => rows.reduce((s, r) => s + Number(r.metrics[key] || 0), 0);
    const avg = (key: string) => rows.length ? sum(key) / rows.length : 0;
    return {
      revenue: sum("totalRevenue"),
      transactions: sum("ecommercePurchases"),
      aov: avg("averagePurchaseRevenue"),
      convRate: avg("purchaserConversionRate") * 100,
    };
  }, [revenueTrend.rows]);

  const trendData = useMemo(
    () =>
      revenueTrend.rows.map((r) => ({
        date: r.dimensions.date?.slice(4) ?? "",
        revenue: Number(r.metrics.totalRevenue || 0),
        transactions: Number(r.metrics.ecommercePurchases || 0),
      })),
    [revenueTrend.rows]
  );

  const funnelData = useMemo(() => {
    if (funnel.rows.length === 0) return [];
    const r = funnel.rows[0].metrics;
    return [
      { name: "Viewed", value: Number(r.itemsViewed || 0), fill: "#2563eb" },
      { name: "Add to Cart", value: Number(r.itemsAddedToCart || 0), fill: "#16a34a" },
      { name: "Checkout", value: Number(r.itemsCheckedOut || 0), fill: "#eab308" },
      { name: "Purchased", value: Number(r.itemsPurchased || 0), fill: "#dc2626" },
    ];
  }, [funnel.rows]);

  const domainData = useMemo(
    () =>
      byDomain.rows.map((r) => ({
        name: r.dimensions.hostName || "",
        revenue: Number(r.metrics.totalRevenue || 0),
      })),
    [byDomain.rows]
  );

  const productRows = useMemo(
    () =>
      products.rows.map((r) => ({
        product: r.dimensions.itemName || "",
        revenue: r.metrics.itemRevenue || "0",
        views: r.metrics.itemsViewed || "0",
        addToCart: r.metrics.itemsAddedToCart || "0",
        purchased: r.metrics.itemsPurchased || "0",
      })),
    [products.rows]
  );

  const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">E-commerce</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Revenue" value={fmtMoney(kpis.revenue)} />
        <KPICard label="Transactions" value={kpis.transactions.toLocaleString()} />
        <KPICard label="Avg Order Value" value={fmtMoney(kpis.aov)} />
        <KPICard label="Conversion Rate" value={`${kpis.convRate.toFixed(2)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" loading={revenueTrend.loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Conversion Funnel" loading={funnel.loading}>
          <div className="space-y-2 py-4">
            {funnelData.map((step, i) => {
              const maxVal = funnelData[0]?.value || 1;
              const pct = ((step.value / maxVal) * 100).toFixed(1);
              return (
                <div key={step.name} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-500">{step.name}</span>
                  <div className="flex-1">
                    <div
                      className="h-8 rounded"
                      style={{
                        width: `${(step.value / maxVal) * 100}%`,
                        backgroundColor: step.fill,
                        minWidth: "2rem",
                      }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-gray-700">
                    {step.value.toLocaleString()} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Revenue by Domain" loading={byDomain.loading}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={180} />
              <Tooltip formatter={(v) => fmtMoney(Number(v))} />
              <Bar dataKey="revenue" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Top Products" loading={products.loading}>
        <DataTable
          columns={[
            { key: "product", label: "Product" },
            { key: "views", label: "Views", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "addToCart", label: "Add to Cart", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "purchased", label: "Purchased", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
          ]}
          rows={productRows}
          defaultSortKey="revenue"
        />
      </ChartCard>
    </div>
  );
}
