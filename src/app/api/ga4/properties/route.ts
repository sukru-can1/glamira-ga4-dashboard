import { NextResponse } from "next/server";
import { listAllProperties } from "@/lib/ga4/admin-client";
import type { GA4Property } from "@/lib/ga4/types";

// Simple in-memory cache: 10 minutes
let cache: { data: GA4Property[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    if (cache && now < cache.expiresAt) {
      return NextResponse.json({
        properties: cache.data,
        count: cache.data.length,
        cached: true,
      });
    }

    const properties = await listAllProperties();

    cache = { data: properties, expiresAt: now + CACHE_TTL_MS };

    return NextResponse.json({
      properties,
      count: properties.length,
      cached: false,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch properties";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
