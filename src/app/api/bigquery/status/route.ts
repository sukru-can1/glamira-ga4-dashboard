import { NextResponse } from "next/server";
import { testConnection } from "@/lib/bigquery/client";

export async function GET() {
  try {
    const status = await testConnection();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "BigQuery connection test failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
