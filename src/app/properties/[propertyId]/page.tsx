"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SignInButton } from "@/components/auth/SignInButton";
import type { PropertyAuditResult, GA4ReportResult } from "@/lib/ga4/types";

export default function PropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const propertyId = params.propertyId;

  const [audit, setAudit] = useState<PropertyAuditResult | null>(null);
  const [report, setReport] = useState<GA4ReportResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a quick 30-day traffic report on load
  useEffect(() => {
    setReportLoading(true);
    fetch("/api/ga4/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyIds: [propertyId],
        dateRange: { startDate: "30daysAgo", endDate: "today" },
        dimensions: ["date"],
        metrics: ["activeUsers", "sessions", "screenPageViews"],
        orderBy: { field: "activeUsers", desc: true },
        limit: 30,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setReport(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setReportLoading(false));
  }, [propertyId]);

  function runAudit() {
    setAuditLoading(true);
    setError(null);
    fetch("/api/ga4/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyIds: [propertyId] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else if (data.results?.[0]) setAudit(data.results[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setAuditLoading(false));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/properties"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Properties
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Property {propertyId}
            </h1>
          </div>
          <SignInButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Quick Report */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            30-Day Traffic
          </h2>
          {reportLoading && (
            <p className="mt-2 text-sm text-gray-500">Loading report...</p>
          )}
          {report && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Users</th>
                    <th className="pb-2 pr-4">Sessions</th>
                    <th className="pb-2">Page Views</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1 pr-4 text-gray-700">
                        {row.dimensions.date}
                      </td>
                      <td className="py-1 pr-4">
                        {Number(row.metrics.activeUsers).toLocaleString()}
                      </td>
                      <td className="py-1 pr-4">
                        {Number(row.metrics.sessions).toLocaleString()}
                      </td>
                      <td className="py-1">
                        {Number(row.metrics.screenPageViews).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.rows.length > 10 && (
                <p className="mt-2 text-xs text-gray-400">
                  Showing 10 of {report.rowCount} rows
                </p>
              )}
            </div>
          )}
        </section>

        {/* Audit */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Property Audit
            </h2>
            <button
              onClick={runAudit}
              disabled={auditLoading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {auditLoading ? "Running..." : "Run Audit"}
            </button>
          </div>

          {audit && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat
                  label="Users (30d)"
                  value={audit.totalUsers30d.toLocaleString()}
                />
                <Stat
                  label="Sessions (30d)"
                  value={audit.totalSessions30d.toLocaleString()}
                />
                <Stat
                  label="Revenue (30d)"
                  value={`$${audit.totalRevenue30d.toFixed(2)}`}
                />
                <Stat
                  label="E-commerce"
                  value={audit.hasEcommerce ? "Yes" : "No"}
                />
              </div>

              {audit.topEventNames.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Top Events
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {audit.topEventNames.map((name) => (
                      <span
                        key={name}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {audit.issues.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-amber-700">
                    Issues
                  </h3>
                  <ul className="mt-1 space-y-1">
                    {audit.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-amber-600">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
