"use client";

import { useEffect, useState } from "react";
import { SignInButton } from "@/components/auth/SignInButton";
import { PropertyList } from "@/components/properties/PropertyList";
import type { GA4Property } from "@/lib/ga4/types";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ga4/properties")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProperties(data.properties);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            GA4 Properties
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Settings
            </Link>
            <SignInButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            Discovering properties...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && <PropertyList properties={properties} />}
      </main>
    </div>
  );
}
