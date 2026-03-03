"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

const COLORS = ["#2563eb", "#16a34a", "#eab308"];

export default function DevicesPage() {
  const deviceSplit = useGA4Report({
    dimensions: ["deviceCategory"],
    metrics: ["activeUsers", "sessions", "bounceRate", "totalRevenue"],
    orderBy: { field: "activeUsers", desc: true },
  });

  const browsers = useGA4Report({
    dimensions: ["browser"],
    metrics: ["activeUsers", "sessions", "bounceRate"],
    orderBy: { field: "sessions", desc: true },
    limit: 20,
  });

  const os = useGA4Report({
    dimensions: ["operatingSystem"],
    metrics: ["activeUsers", "sessions"],
    orderBy: { field: "sessions", desc: true },
    limit: 15,
  });

  const screenRes = useGA4Report({
    dimensions: ["screenResolution"],
    metrics: ["activeUsers"],
    orderBy: { field: "activeUsers", desc: true },
    limit: 20,
  });

  const pieData = useMemo(
    () =>
      deviceSplit.rows.map((r) => ({
        name: r.dimensions.deviceCategory || "Unknown",
        value: Number(r.metrics.activeUsers || 0),
      })),
    [deviceSplit.rows]
  );

  const kpis = useMemo(() => {
    const find = (cat: string) =>
      deviceSplit.rows.find((r) => r.dimensions.deviceCategory?.toLowerCase() === cat);
    return {
      desktop: Number(find("desktop")?.metrics.activeUsers || 0),
      mobile: Number(find("mobile")?.metrics.activeUsers || 0),
      tablet: Number(find("tablet")?.metrics.activeUsers || 0),
    };
  }, [deviceSplit.rows]);

  const browserRows = useMemo(
    () =>
      browsers.rows.map((r) => ({
        browser: r.dimensions.browser || "Unknown",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        bounceRate: r.metrics.bounceRate || "0",
      })),
    [browsers.rows]
  );

  const osRows = useMemo(
    () =>
      os.rows.map((r) => ({
        os: r.dimensions.operatingSystem || "Unknown",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
      })),
    [os.rows]
  );

  const resRows = useMemo(
    () =>
      screenRes.rows.map((r) => ({
        resolution: r.dimensions.screenResolution || "Unknown",
        users: r.metrics.activeUsers || "0",
      })),
    [screenRes.rows]
  );

  const fmtPct = (v: string) => `${(Number(v) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Devices & Technology</h2>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Desktop" value={kpis.desktop.toLocaleString()} />
        <KPICard label="Mobile" value={kpis.mobile.toLocaleString()} />
        <KPICard label="Tablet" value={kpis.tablet.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Device Split" loading={deviceSplit.loading}>
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

        <ChartCard title="Browsers" loading={browsers.loading}>
          <DataTable
            columns={[
              { key: "browser", label: "Browser" },
              { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
              { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
              { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
            ]}
            rows={browserRows}
            defaultSortKey="users"
            pageSize={10}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Operating Systems" loading={os.loading}>
          <DataTable
            columns={[
              { key: "os", label: "OS" },
              { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
              { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            ]}
            rows={osRows}
            defaultSortKey="users"
            pageSize={10}
          />
        </ChartCard>

        <ChartCard title="Screen Resolutions" loading={screenRes.loading}>
          <DataTable
            columns={[
              { key: "resolution", label: "Resolution" },
              { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            ]}
            rows={resRows}
            defaultSortKey="users"
            pageSize={10}
          />
        </ChartCard>
      </div>
    </div>
  );
}
