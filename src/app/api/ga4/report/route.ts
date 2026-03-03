import { NextRequest, NextResponse } from "next/server";
import {
  runPropertyReport,
  runMultiPropertyReport,
} from "@/lib/ga4/data-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyIds, dateRange, dimensions, metrics, limit, orderBy } =
      body;

    if (!propertyIds?.length || !dateRange || !dimensions?.length || !metrics?.length) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: propertyIds, dateRange, dimensions, metrics",
        },
        { status: 400 }
      );
    }

    // Single property → direct report, multiple → batched
    if (propertyIds.length === 1) {
      const result = await runPropertyReport(propertyIds[0], {
        dateRange,
        dimensions,
        metrics,
        limit,
        orderBy,
      });
      return NextResponse.json(result);
    }

    const result = await runMultiPropertyReport({
      propertyIds,
      dateRange,
      dimensions,
      metrics,
      limit,
      orderBy,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Report request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
