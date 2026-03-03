import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { error: "Missing required field: sql" },
        { status: 400 }
      );
    }

    const result = await runQuery(sql);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Query execution failed";
    const status = message.includes("not allowed") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
