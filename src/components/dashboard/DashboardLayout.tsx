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
          setAllPropertyIds(data.properties.map((p: GA4Property) => p.propertyId));
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
