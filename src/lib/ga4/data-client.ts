import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getAuthenticatedOAuth2Client } from "../auth-helpers";
import { batchProcess, separateResults } from "../utils/rate-limiter";
import type {
  GA4ReportConfig,
  GA4ReportResult,
  GA4ReportRow,
  MultiPropertyReportResult,
} from "./types";

async function createDataClient(): Promise<BetaAnalyticsDataClient> {
  const authClient = await getAuthenticatedOAuth2Client();
  return new BetaAnalyticsDataClient({ authClient: authClient as never });
}

/** Runs a report against a single GA4 property */
export async function runPropertyReport(
  propertyId: string,
  config: {
    dateRange: { startDate: string; endDate: string };
    dimensions: string[];
    metrics: string[];
    limit?: number;
    orderBy?: { field: string; desc?: boolean };
  }
): Promise<GA4ReportResult> {
  const client = await createDataClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [config.dateRange],
    dimensions: config.dimensions.map((name) => ({ name })),
    metrics: config.metrics.map((name) => ({ name })),
    limit: config.limit ?? 10000,
    ...(config.orderBy && {
      orderBys: [
        {
          metric: { metricName: config.orderBy.field },
          desc: config.orderBy.desc ?? true,
        },
      ],
    }),
  });

  const rows: GA4ReportRow[] = (response.rows ?? []).map((row) => {
    const dimensions: Record<string, string> = {};
    const metrics: Record<string, string> = {};

    config.dimensions.forEach((dim, i) => {
      dimensions[dim] = row.dimensionValues?.[i]?.value ?? "";
    });
    config.metrics.forEach((metric, i) => {
      metrics[metric] = row.metricValues?.[i]?.value ?? "";
    });

    return { dimensions, metrics };
  });

  return {
    propertyId,
    rows,
    rowCount: Number(response.rowCount ?? rows.length),
    metadata: {
      currencyCode: response.metadata?.currencyCode ?? undefined,
      timeZone: response.metadata?.timeZone ?? undefined,
    },
  };
}

/** Runs a report across multiple properties with rate limiting */
export async function runMultiPropertyReport(
  config: GA4ReportConfig
): Promise<MultiPropertyReportResult> {
  const results = await batchProcess(
    config.propertyIds,
    (propertyId) =>
      runPropertyReport(propertyId, {
        dateRange: config.dateRange,
        dimensions: config.dimensions,
        metrics: config.metrics,
        limit: config.limit,
        orderBy: config.orderBy,
      }),
    { batchSize: 10, delayMs: 1000 }
  );

  const { fulfilled, rejected } = separateResults(results);

  return {
    results: fulfilled,
    errors: rejected.map(({ index, reason }) => ({
      propertyId: config.propertyIds[index],
      error: reason instanceof Error ? reason.message : String(reason),
    })),
  };
}

/** Runs a real-time report against a single property */
export async function runRealtimeReport(
  propertyId: string,
  config: {
    dimensions: string[];
    metrics: string[];
    limit?: number;
  }
): Promise<GA4ReportResult> {
  const client = await createDataClient();

  const [response] = await client.runRealtimeReport({
    property: `properties/${propertyId}`,
    dimensions: config.dimensions.map((name) => ({ name })),
    metrics: config.metrics.map((name) => ({ name })),
    limit: config.limit ?? 1000,
  });

  const rows: GA4ReportRow[] = (response.rows ?? []).map((row) => {
    const dimensions: Record<string, string> = {};
    const metrics: Record<string, string> = {};

    config.dimensions.forEach((dim, i) => {
      dimensions[dim] = row.dimensionValues?.[i]?.value ?? "";
    });
    config.metrics.forEach((metric, i) => {
      metrics[metric] = row.metricValues?.[i]?.value ?? "";
    });

    return { dimensions, metrics };
  });

  return {
    propertyId,
    rows,
    rowCount: Number(response.rowCount ?? rows.length),
  };
}
