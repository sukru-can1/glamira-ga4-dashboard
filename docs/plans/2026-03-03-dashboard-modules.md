# Dashboard Modules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 10 dashboard modules with sidebar navigation, shared components, and Recharts visualizations for 70 Glamira GA4 properties.

**Architecture:** Sidebar layout with React Context for global filters (domain picker, date range). Each module is a page under `/dashboard/[module]` that fetches GA4 data via existing `/api/ga4/report` endpoint. Shared components (KPICard, DataTable, ChartCard) used across all modules.

**Tech Stack:** Next.js 16, React 19, Recharts, Tailwind CSS 4, existing GA4 Data API client

---

## Phase 1: Foundation (Shared Components + Layout)

### Task 1: Install Recharts

**Files:**
- Modify: `package.json`

**Step 1: Install recharts**

Run: `npm install recharts`

**Step 2: Verify installation**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts dependency"
```

---

### Task 2: Create DashboardContext

**Files:**
- Create: `src/contexts/DashboardContext.tsx`

**Step 1: Create the context**

```tsx
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const DATE_PRESETS: DateRange[] = [
  { startDate: "7daysAgo", endDate: "today", label: "7d" },
  { startDate: "30daysAgo", endDate: "today", label: "30d" },
  { startDate: "90daysAgo", endDate: "today", label: "90d" },
  { startDate: "365daysAgo", endDate: "today", label: "YTD" },
];

interface DashboardContextType {
  selectedPropertyIds: string[];
  setSelectedPropertyIds: (ids: string[]) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  datePresets: DateRange[];
  allPropertyIds: string[];
  setAllPropertyIds: (ids: string[]) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [allPropertyIds, setAllPropertyIds] = useState<string[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(DATE_PRESETS[1]); // 30d default

  const setAllProps = useCallback((ids: string[]) => {
    setAllPropertyIds(ids);
    setSelectedPropertyIds(ids); // select all by default
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        selectedPropertyIds,
        setSelectedPropertyIds,
        dateRange,
        setDateRange,
        datePresets: DATE_PRESETS,
        allPropertyIds,
        setAllPropertyIds: setAllProps,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
}
```

**Step 2: Commit**

```bash
git add src/contexts/DashboardContext.tsx
git commit -m "feat: add DashboardContext for global filter state"
```

---

### Task 3: Create shared dashboard components

**Files:**
- Create: `src/components/dashboard/KPICard.tsx`
- Create: `src/components/dashboard/DataTable.tsx`
- Create: `src/components/dashboard/ChartCard.tsx`
- Create: `src/components/dashboard/DateRangePicker.tsx`
- Create: `src/components/dashboard/DomainPicker.tsx`

**Step 1: Create KPICard**

```tsx
"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KPICardProps {
  label: string;
  value: string;
  change?: number; // percentage change vs previous period
  sparklineData?: number[];
}

export function KPICard({ label, value, change, sparklineData }: KPICardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        {change !== undefined && (
          <span
            className={`text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        )}
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((v) => ({ v }))}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={change && change >= 0 ? "#16a34a" : "#dc2626"}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create ChartCard**

```tsx
"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, loading, children }: ChartCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
```

**Step 3: Create DataTable**

```tsx
"use client";

import { useState, useMemo } from "react";

interface Column {
  key: string;
  label: string;
  format?: (value: string) => string;
  align?: "left" | "right";
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, string>[];
  defaultSortKey?: string;
  defaultSortDesc?: boolean;
  pageSize?: number;
}

export function DataTable({
  columns,
  rows,
  defaultSortKey,
  defaultSortDesc = true,
  pageSize = 25,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? columns[0]?.key);
  const [sortDesc, setSortDesc] = useState(defaultSortDesc);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aVal = Number(a[sortKey]) || 0;
      const bVal = Number(b[sortKey]) || 0;
      return sortDesc ? bVal - aVal : aVal - bVal;
    });
  }, [rows, sortKey, sortDesc]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(rows.length / pageSize);

  function toggleSort(key: string) {
    if (key === sortKey) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
    setPage(0);
  }

  function exportCSV() {
    const header = columns.map((c) => c.label).join(",");
    const body = sorted
      .map((row) => columns.map((c) => `"${row[c.key] ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {rows.length} rows{totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
        </p>
        <button
          onClick={exportCSV}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`cursor-pointer pb-2 pr-4 hover:text-gray-700 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDesc ? "↓" : "↑"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-1.5 pr-4 ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.format ? col.format(row[col.key] ?? "") : row[col.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded border px-2 py-1 text-xs disabled:opacity-30"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded border px-2 py-1 text-xs disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create DateRangePicker**

```tsx
"use client";

import { useDashboard } from "@/contexts/DashboardContext";

export function DateRangePicker() {
  const { dateRange, setDateRange, datePresets } = useDashboard();

  return (
    <div className="flex items-center gap-1">
      {datePresets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => setDateRange(preset)}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            dateRange.label === preset.label
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 5: Create DomainPicker**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/contexts/DashboardContext";

export function DomainPicker() {
  const { allPropertyIds, selectedPropertyIds, setSelectedPropertyIds } = useDashboard();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSelected = selectedPropertyIds.length === allPropertyIds.length;
  const filtered = allPropertyIds.filter((id) => id.includes(search));

  function toggleAll() {
    setSelectedPropertyIds(allSelected ? [] : [...allPropertyIds]);
  }

  function toggle(id: string) {
    setSelectedPropertyIds(
      selectedPropertyIds.includes(id)
        ? selectedPropertyIds.filter((p) => p !== id)
        : [...selectedPropertyIds, id]
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-300"
      >
        <span>
          {allSelected
            ? "All Properties"
            : `${selectedPropertyIds.length} of ${allPropertyIds.length}`}
        </span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b p-2">
            <input
              type="text"
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
            />
          </div>
          <div className="border-b p-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded"
              />
              <span className="font-medium">All Properties</span>
            </label>
          </div>
          <div className="max-h-48 overflow-y-auto p-2">
            {filtered.map((id) => (
              <label key={id} className="flex items-center gap-2 py-0.5 text-xs">
                <input
                  type="checkbox"
                  checked={selectedPropertyIds.includes(id)}
                  onChange={() => toggle(id)}
                  className="rounded"
                />
                {id}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add shared dashboard components (KPICard, DataTable, ChartCard, DateRangePicker, DomainPicker)"
```

---

### Task 4: Create DashboardLayout and routing

**Files:**
- Create: `src/components/dashboard/DashboardLayout.tsx`
- Create: `src/components/dashboard/Sidebar.tsx`
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`
- Modify: `src/proxy.ts` — add `/dashboard/:path*` to matcher

**Step 1: Create Sidebar**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Overview", icon: "◉" },
  { href: "/dashboard/traffic", label: "Traffic", icon: "↗" },
  { href: "/dashboard/ecommerce", label: "E-commerce", icon: "$" },
  { href: "/dashboard/seo", label: "SEO", icon: "◎" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "▶" },
  { href: "/dashboard/audience", label: "Audience", icon: "♟" },
  { href: "/dashboard/devices", label: "Devices", icon: "▢" },
  { href: "/dashboard/geography", label: "Geography", icon: "◈" },
  { href: "/dashboard/compare", label: "Compare", icon: "⇄" },
  { href: "/dashboard/reports", label: "Reports", icon: "☰" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <Link href="/dashboard/overview" className="text-sm font-bold text-gray-900">
          GA4 Dashboard
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 px-4 py-3">
        <Link href="/properties" className="text-xs text-gray-400 hover:text-gray-600">
          ← Properties
        </Link>
      </div>
    </aside>
  );
}
```

**Step 2: Create DashboardLayout**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { DateRangePicker } from "./DateRangePicker";
import { DomainPicker } from "./DomainPicker";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { SignInButton } from "@/components/auth/SignInButton";
import type { GA4Property } from "@/lib/ga4/types";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { setAllPropertyIds } = useDashboard();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ga4/properties")
      .then((res) => res.json())
      .then((data) => {
        if (data.properties) {
          setAllPropertyIds(
            data.properties.map((p: GA4Property) => p.propertyId)
          );
        }
      })
      .finally(() => setLoading(false));
  }, [setAllPropertyIds]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <DomainPicker />
          <div className="flex items-center gap-4">
            <DateRangePicker />
            <SignInButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardInner>{children}</DashboardInner>
    </DashboardProvider>
  );
}
```

**Step 3: Create dashboard layout route**

```tsx
// src/app/dashboard/layout.tsx
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
```

**Step 4: Create dashboard index redirect**

```tsx
// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/overview");
}
```

**Step 5: Update proxy.ts to protect dashboard routes**

Add `"/dashboard/:path*"` to the matcher array in `src/proxy.ts`.

**Step 6: Update landing page redirect**

In `src/app/page.tsx`, change `redirect("/properties")` to `redirect("/dashboard/overview")` so authenticated users go straight to the dashboard.

**Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx src/components/dashboard/DashboardLayout.tsx src/app/dashboard/ src/proxy.ts src/app/page.tsx
git commit -m "feat: add dashboard layout with sidebar navigation and global filters"
```

---

### Task 5: Create useGA4Report hook

**Files:**
- Create: `src/hooks/useGA4Report.ts`

**Step 1: Create the hook**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import type { GA4ReportRow } from "@/lib/ga4/types";

interface ReportConfig {
  dimensions: string[];
  metrics: string[];
  limit?: number;
  orderBy?: { field: string; desc?: boolean };
  dimensionFilter?: { dimension: string; value: string };
}

interface ReportData {
  rows: GA4ReportRow[];
  rowCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGA4Report(config: ReportConfig): ReportData {
  const { selectedPropertyIds, dateRange } = useDashboard();
  const [rows, setRows] = useState<GA4ReportRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (selectedPropertyIds.length === 0) {
      setRows([]);
      setRowCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ga4/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: selectedPropertyIds,
          dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate },
          dimensions: config.dimensions,
          metrics: config.metrics,
          limit: config.limit ?? 10000,
          orderBy: config.orderBy,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Single property returns GA4ReportResult, multi returns MultiPropertyReportResult
      if (data.results) {
        // Multi-property: merge all rows
        const allRows = data.results.flatMap(
          (r: { rows: GA4ReportRow[] }) => r.rows
        );
        setRows(allRows);
        setRowCount(allRows.length);
      } else {
        setRows(data.rows ?? []);
        setRowCount(data.rowCount ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyIds, dateRange, config.dimensions, config.metrics, config.limit, config.orderBy]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { rows, rowCount, loading, error, refetch: fetchReport };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useGA4Report.ts
git commit -m "feat: add useGA4Report hook for dashboard data fetching"
```

---

## Phase 2: Dashboard Modules

### Task 6: Overview module

**Files:**
- Create: `src/app/dashboard/overview/page.tsx`

**Step 1: Create Overview page**

```tsx
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
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/dashboard/overview/
git commit -m "feat: add Overview dashboard module with KPIs, trend chart, channel donut, domain table"
```

---

### Task 7: Traffic Sources module

**Files:**
- Create: `src/app/dashboard/traffic/page.tsx`

**Step 1: Create Traffic page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/traffic/
git commit -m "feat: add Traffic Sources module with channel trend, top sources, source/medium table"
```

---

### Task 8: E-commerce module

**Files:**
- Create: `src/app/dashboard/ecommerce/page.tsx`

**Step 1: Create E-commerce page**

```tsx
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
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/ecommerce/
git commit -m "feat: add E-commerce module with revenue trend, conversion funnel, products table"
```

---

### Task 9: SEO module

**Files:**
- Create: `src/app/dashboard/seo/page.tsx`

**Step 1: Create SEO page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/seo/
git commit -m "feat: add SEO module with organic trend, landing pages, content performance"
```

---

### Task 10: Campaigns module

**Files:**
- Create: `src/app/dashboard/campaigns/page.tsx`

**Step 1: Create Campaigns page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/campaigns/
git commit -m "feat: add Campaigns module with spend vs revenue, ROAS, campaign table"
```

---

### Task 11: Audience module

**Files:**
- Create: `src/app/dashboard/audience/page.tsx`

**Step 1: Create Audience page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/audience/
git commit -m "feat: add Audience module with new vs returning, countries, languages, engagement"
```

---

### Task 12: Devices module

**Files:**
- Create: `src/app/dashboard/devices/page.tsx`

**Step 1: Create Devices page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/devices/
git commit -m "feat: add Devices module with device split, browsers, OS, screen resolutions"
```

---

### Task 13: Geography module

**Files:**
- Create: `src/app/dashboard/geography/page.tsx`

**Step 1: Create Geography page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/geography/
git commit -m "feat: add Geography module with continents, countries, city drill-down"
```

---

### Task 14: Domain Comparison module

**Files:**
- Create: `src/app/dashboard/compare/page.tsx`

**Step 1: Create Compare page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/compare/
git commit -m "feat: add Domain Comparison module with selector, grouped bars, trend overlay"
```

---

### Task 15: Custom Reports module

**Files:**
- Create: `src/app/dashboard/reports/page.tsx`

**Step 1: Create Custom Reports page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/reports/
git commit -m "feat: add Custom Reports module with dimension/metric pickers and dynamic table"
```

---

## Phase 3: Final Integration

### Task 16: Build, verify, and deploy

**Step 1: Run build**

Run: `npm run build`
Expected: All 22+ routes compile successfully

**Step 2: Fix any type errors or build issues**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete 10 dashboard modules with shared components and layout"
```

**Step 4: Push and deploy**

```bash
git push origin master
vercel --prod --yes
```
