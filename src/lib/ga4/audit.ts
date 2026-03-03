import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getAuthenticatedOAuth2Client } from "../auth-helpers";
import { batchProcess, separateResults } from "../utils/rate-limiter";
import type { PropertyAuditResult } from "./types";

// Core dimensions to test availability
const CORE_DIMENSIONS = [
  "hostName",
  "pagePath",
  "source",
  "medium",
  "defaultChannelGroup",
  "country",
  "deviceCategory",
  "landingPage",
  "newVsReturning",
];

// Auto-collected events (not custom)
const AUTO_EVENTS = new Set([
  "page_view",
  "session_start",
  "first_visit",
  "user_engagement",
  "scroll",
  "click",
  "view_search_results",
  "file_download",
]);

/**
 * Audits a single GA4 property: metadata, traffic, e-commerce, events, data quality.
 * Adapted from .claude/skills/ga4-analytics/scripts/audit-properties.ts
 */
async function auditProperty(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  displayName: string
): Promise<PropertyAuditResult> {
  const result: PropertyAuditResult = {
    propertyId,
    displayName,
    hasData: false,
    hasEcommerce: false,
    hasSearchEvents: false,
    hasCustomEvents: false,
    totalUsers30d: 0,
    totalSessions30d: 0,
    totalRevenue30d: 0,
    topEventNames: [],
    availableDimensions: [],
    issues: [],
  };

  try {
    // 1. Get metadata — available dimensions/metrics
    const [metadata] = await client.getMetadata({
      name: `properties/${propertyId}/metadata`,
    });

    if (metadata.dimensions) {
      result.availableDimensions = metadata.dimensions
        .map((d) => d.apiName!)
        .filter(Boolean);
    }

    // Check which core dimensions are available
    const missingDims = CORE_DIMENSIONS.filter(
      (d) => !result.availableDimensions.includes(d)
    );
    if (missingDims.length > 0) {
      result.issues.push(`Missing dimensions: ${missingDims.join(", ")}`);
    }

    // 2. Basic traffic check
    const [trafficReport] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    });

    if (trafficReport.rows && trafficReport.rows.length > 0) {
      result.hasData = true;
      result.totalUsers30d = parseInt(
        trafficReport.rows[0].metricValues![0].value || "0"
      );
      result.totalSessions30d = parseInt(
        trafficReport.rows[0].metricValues![1].value || "0"
      );
    }

    if (!result.hasData) {
      result.issues.push("NO DATA: Property has zero users in last 30 days");
      return result;
    }

    // 3. E-commerce check
    try {
      const [ecomReport] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "totalRevenue" },
          { name: "ecommercePurchases" },
        ],
      });

      if (ecomReport.rows && ecomReport.rows.length > 0) {
        result.totalRevenue30d = parseFloat(
          ecomReport.rows[0].metricValues![0].value || "0"
        );
        const purchases = parseInt(
          ecomReport.rows[0].metricValues![1].value || "0"
        );
        result.hasEcommerce = purchases > 0;

        if (!result.hasEcommerce) {
          result.issues.push("WARNING: No e-commerce purchases tracked");
        }
      }
    } catch {
      result.issues.push("E-commerce metrics not available");
    }

    // 4. Event names audit
    try {
      const [eventReport] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 20,
      });

      if (eventReport.rows) {
        result.topEventNames = eventReport.rows.map(
          (r) => r.dimensionValues![0].value!
        );

        result.hasSearchEvents = result.topEventNames.some(
          (e) => e === "search" || e === "view_search_results"
        );

        result.hasCustomEvents = result.topEventNames.some(
          (e) => !AUTO_EVENTS.has(e)
        );
      }
    } catch {
      result.issues.push("Could not retrieve event names");
    }

    // 5. Data quality checks
    if (result.totalUsers30d < 100) {
      result.issues.push(
        `LOW TRAFFIC: Only ${result.totalUsers30d} users in 30 days`
      );
    }

    if (result.totalRevenue30d === 0 && result.hasEcommerce) {
      result.issues.push(
        "ZERO REVENUE: E-commerce events exist but revenue is zero"
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    result.issues.push(`API ERROR: ${message}`);
  }

  return result;
}

/**
 * Audits multiple properties with rate limiting.
 * Batch size 5 with 2s delay (audit is heavier: 3-4 API calls per property).
 */
export async function auditProperties(
  properties: Array<{ propertyId: string; displayName: string }>
): Promise<{
  results: PropertyAuditResult[];
  errors: Array<{ propertyId: string; error: string }>;
}> {
  const authClient = await getAuthenticatedOAuth2Client();
  const client = new BetaAnalyticsDataClient({
    authClient: authClient as never,
  });

  const settled = await batchProcess(
    properties,
    (prop) => auditProperty(client, prop.propertyId, prop.displayName),
    { batchSize: 5, delayMs: 2000 }
  );

  const { fulfilled, rejected } = separateResults(settled);

  return {
    results: fulfilled,
    errors: rejected.map(({ index, reason }) => ({
      propertyId: properties[index].propertyId,
      error: reason instanceof Error ? reason.message : String(reason),
    })),
  };
}
