import { NextRequest, NextResponse } from "next/server";
import { runRealtimeReport } from "@/lib/ga4/data-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get("propertyId");
    const dimensionsParam = searchParams.get("dimensions");
    const metricsParam = searchParams.get("metrics");
    const limit = searchParams.get("limit");

    if (!propertyId || !metricsParam) {
      return NextResponse.json(
        { error: "Missing required params: propertyId, metrics" },
        { status: 400 }
      );
    }

    const dimensions = dimensionsParam ? dimensionsParam.split(",") : [];
    const metrics = metricsParam.split(",");

    const result = await runRealtimeReport(propertyId, {
      dimensions,
      metrics,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Realtime report failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
