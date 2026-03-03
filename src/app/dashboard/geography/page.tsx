"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGA4Report } from "@/hooks/useGA4Report";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";

export default function GeographyPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const byContinent = useGA4Report({
    dimensions: ["continent"],
    metrics: ["activeUsers"],
    orderBy: { field: "activeUsers", desc: true },
  });

  const byCountry = useGA4Report({
    dimensions: ["country"],
    metrics: ["activeUsers", "sessions", "totalRevenue", "bounceRate"],
    orderBy: { field: "activeUsers", desc: true },
    limit: 50,
  });

  const byCity = useGA4Report({
    dimensions: ["city", "country"],
    metrics: ["activeUsers", "sessions", "totalRevenue"],
    orderBy: { field: "activeUsers", desc: true },
    limit: 200,
  });

  const continentKpis = useMemo(
    () =>
      byContinent.rows.map((r) => ({
        label: r.dimensions.continent || "Unknown",
        value: Number(r.metrics.activeUsers || 0),
      })),
    [byContinent.rows]
  );

  const top10Countries = useMemo(
    () =>
      byCountry.rows.slice(0, 10).map((r) => ({
        name: r.dimensions.country || "Unknown",
        users: Number(r.metrics.activeUsers || 0),
      })),
    [byCountry.rows]
  );

  const countryRows = useMemo(
    () =>
      byCountry.rows.map((r) => ({
        country: r.dimensions.country || "Unknown",
        users: r.metrics.activeUsers || "0",
        sessions: r.metrics.sessions || "0",
        revenue: r.metrics.totalRevenue || "0",
        bounceRate: r.metrics.bounceRate || "0",
      })),
    [byCountry.rows]
  );

  const cityRows = useMemo(() => {
    const filtered = selectedCountry
      ? byCity.rows.filter((r) => r.dimensions.country === selectedCountry)
      : byCity.rows;
    return filtered.map((r) => ({
      city: r.dimensions.city || "Unknown",
      country: r.dimensions.country || "",
      users: r.metrics.activeUsers || "0",
      sessions: r.metrics.sessions || "0",
      revenue: r.metrics.totalRevenue || "0",
    }));
  }, [byCity.rows, selectedCountry]);

  const fmtPct = (v: string) => `${(Number(v) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Geography</h2>

      {/* Continent KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {continentKpis.map((c) => (
          <KPICard key={c.label} label={c.label} value={c.value.toLocaleString()} />
        ))}
      </div>

      <ChartCard title="Top 10 Countries" loading={byCountry.loading}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10Countries} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="users" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Countries" loading={byCountry.loading}>
        <DataTable
          columns={[
            { key: "country", label: "Country" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
            { key: "bounceRate", label: "Bounce Rate", align: "right", format: fmtPct },
          ]}
          rows={countryRows}
          defaultSortKey="users"
        />
      </ChartCard>

      {/* City Drill-down */}
      <ChartCard
        title={selectedCountry ? `Cities in ${selectedCountry}` : "Cities (All)"}
        loading={byCity.loading}
      >
        <div className="mb-3 flex items-center gap-2">
          <select
            value={selectedCountry ?? ""}
            onChange={(e) => setSelectedCountry(e.target.value || null)}
            className="rounded border border-gray-200 px-2 py-1 text-xs"
          >
            <option value="">All countries</option>
            {byCountry.rows.map((r) => (
              <option key={r.dimensions.country} value={r.dimensions.country}>
                {r.dimensions.country}
              </option>
            ))}
          </select>
          {selectedCountry && (
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          )}
        </div>
        <DataTable
          columns={[
            { key: "city", label: "City" },
            { key: "country", label: "Country" },
            { key: "users", label: "Users", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "sessions", label: "Sessions", align: "right", format: (v) => Number(v).toLocaleString() },
            { key: "revenue", label: "Revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
          ]}
          rows={cityRows}
          defaultSortKey="users"
        />
      </ChartCard>
    </div>
  );
}
