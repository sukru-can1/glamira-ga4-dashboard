"use client";

import type { GA4Property } from "@/lib/ga4/types";
import { PropertyCard } from "./PropertyCard";

export function PropertyList({ properties }: { properties: GA4Property[] }) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">No properties found.</p>
        <p className="mt-1 text-sm text-gray-400">
          Make sure your Google account has access to GA4 properties.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {properties.length} {properties.length === 1 ? "property" : "properties"} found
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.propertyId} property={property} />
        ))}
      </div>
    </div>
  );
}
