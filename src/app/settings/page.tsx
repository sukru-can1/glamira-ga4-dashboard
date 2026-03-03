"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SignInButton } from "@/components/auth/SignInButton";

interface EnvStatus {
  name: string;
  configured: boolean;
}

interface BigQueryStatus {
  connected: boolean;
  projectId: string | null;
  datasets: string[];
  error?: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [bqStatus, setBqStatus] = useState<BigQueryStatus | null>(null);
  const [bqLoading, setBqLoading] = useState(false);

  // Check which env vars are configured (we infer from session/behavior, not exposing values)
  const envVars: EnvStatus[] = [
    { name: "AUTH_GOOGLE_ID", configured: !!session },
    { name: "AUTH_GOOGLE_SECRET", configured: !!session },
    { name: "AUTH_SECRET", configured: !!session },
    { name: "AUTH_URL", configured: true },
  ];

  function checkBigQuery() {
    setBqLoading(true);
    fetch("/api/bigquery/status")
      .then((res) => res.json())
      .then((data) => setBqStatus(data))
      .catch((err) =>
        setBqStatus({
          connected: false,
          projectId: null,
          datasets: [],
          error: err.message,
        })
      )
      .finally(() => setBqLoading(false));
  }

  useEffect(() => {
    if (session) checkBigQuery();
  }, [session]);

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
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          <SignInButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Auth Status */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Authentication
          </h2>
          <div className="mt-4 space-y-2">
            {envVars.map((env) => (
              <div key={env.name} className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    env.configured ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-mono text-gray-700">{env.name}</span>
                <span className="text-gray-400">
                  {env.configured ? "Configured" : "Missing"}
                </span>
              </div>
            ))}
          </div>
          {session?.error === "RefreshTokenError" && (
            <p className="mt-3 text-sm text-red-600">
              Session expired. Please sign out and sign in again.
            </p>
          )}
        </section>

        {/* BigQuery Status */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">BigQuery</h2>
            <button
              onClick={checkBigQuery}
              disabled={bqLoading}
              className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {bqLoading ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {bqStatus && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    bqStatus.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-gray-700">
                  {bqStatus.connected ? "Connected" : "Not connected"}
                </span>
              </div>
              {bqStatus.projectId && (
                <p className="text-sm text-gray-500">
                  Project: {bqStatus.projectId}
                </p>
              )}
              {bqStatus.datasets.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">
                    Datasets: {bqStatus.datasets.length}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {bqStatus.datasets.map((ds) => (
                      <span
                        key={ds}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {ds}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {bqStatus.error && (
                <p className="text-sm text-red-600">{bqStatus.error}</p>
              )}
            </div>
          )}
        </section>

        {/* Setup Instructions */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Setup Checklist
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-600">
            <li>
              Create a Google Cloud project at{" "}
              <span className="font-mono text-gray-800">console.cloud.google.com</span>
            </li>
            <li>
              Enable APIs: Analytics Data API, Analytics Admin API, BigQuery API
            </li>
            <li>
              Create OAuth consent screen with scopes:{" "}
              <span className="font-mono text-gray-800">analytics.readonly</span>,{" "}
              <span className="font-mono text-gray-800">bigquery.readonly</span>
            </li>
            <li>
              Create OAuth 2.0 Client ID (redirect URI:{" "}
              <span className="font-mono text-gray-800">
                http://localhost:3000/api/auth/callback/google
              </span>
              )
            </li>
            <li>
              Copy credentials to{" "}
              <span className="font-mono text-gray-800">.env.local</span>
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
