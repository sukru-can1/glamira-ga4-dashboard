import { NextRequest, NextResponse } from "next/server";
import { auditProperties } from "@/lib/ga4/audit";
import { listAllProperties } from "@/lib/ga4/admin-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { propertyIds } = body as { propertyIds?: string[] };

    let properties: Array<{ propertyId: string; displayName: string }>;

    if (propertyIds && propertyIds.length > 0) {
      // Audit specific properties
      properties = propertyIds.map((id: string) => ({
        propertyId: id,
        displayName: id,
      }));
    } else {
      // Audit all discovered properties
      const allProperties = await listAllProperties();
      properties = allProperties.map((p) => ({
        propertyId: p.propertyId,
        displayName: p.displayName,
      }));
    }

    if (properties.length === 0) {
      return NextResponse.json(
        { error: "No properties found to audit" },
        { status: 404 }
      );
    }

    const auditResult = await auditProperties(properties);

    return NextResponse.json({
      ...auditResult,
      totalAudited: auditResult.results.length,
      totalErrors: auditResult.errors.length,
      summary: {
        withData: auditResult.results.filter((r) => r.hasData).length,
        withEcommerce: auditResult.results.filter((r) => r.hasEcommerce)
          .length,
        withSearch: auditResult.results.filter((r) => r.hasSearchEvents)
          .length,
        withCustomEvents: auditResult.results.filter((r) => r.hasCustomEvents)
          .length,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Audit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
