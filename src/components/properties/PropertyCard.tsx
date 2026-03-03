"use client";

import Link from "next/link";
import type { GA4Property } from "@/lib/ga4/types";

export function PropertyCard({ property }: { property: GA4Property }) {
  return (
    <Link
      href={`/properties/${property.propertyId}`}
      className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50"
    >
      <h3 className="font-semibold text-gray-900">{property.displayName}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Property ID: {property.propertyId}
      </p>
      <p className="text-sm text-gray-400">
        {property.accountName} ({property.accountId})
      </p>
    </Link>
  );
}
