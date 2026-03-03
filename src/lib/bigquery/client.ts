import { BigQuery } from "@google-cloud/bigquery";
import { getAuthenticatedOAuth2Client } from "../auth-helpers";
import type { BigQueryConnectionStatus, BigQueryQueryResult } from "./types";

const WRITE_OPERATIONS = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|MERGE)\b/i;

async function createBigQueryClient(): Promise<BigQuery> {
  const authClient = await getAuthenticatedOAuth2Client();
  const projectId = process.env.GOOGLE_BIGQUERY_PROJECT_ID;

  if (!projectId) {
    throw new Error("GOOGLE_BIGQUERY_PROJECT_ID not configured");
  }

  return new BigQuery({
    projectId,
    authClient: authClient as never,
  });
}

/** Tests the BigQuery connection and lists datasets */
export async function testConnection(): Promise<BigQueryConnectionStatus> {
  const projectId = process.env.GOOGLE_BIGQUERY_PROJECT_ID;

  if (!projectId) {
    return {
      connected: false,
      projectId: null,
      datasets: [],
      error: "GOOGLE_BIGQUERY_PROJECT_ID not configured",
    };
  }

  try {
    const client = await createBigQueryClient();
    const [datasets] = await client.getDatasets();

    return {
      connected: true,
      projectId,
      datasets: datasets.map((ds) => ds.id!).filter(Boolean),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      projectId,
      datasets: [],
      error: message,
    };
  }
}

/** Executes a read-only SQL query against BigQuery */
export async function runQuery(sql: string): Promise<BigQueryQueryResult> {
  if (WRITE_OPERATIONS.test(sql)) {
    throw new Error("Write operations are not allowed. Only SELECT queries are permitted.");
  }

  const client = await createBigQueryClient();
  const [rows] = await client.query({ query: sql });

  // Extract schema from first row's keys (BigQuery doesn't return schema with query())
  const schema =
    rows.length > 0
      ? Object.keys(rows[0]).map((name) => ({
          name,
          type: typeof rows[0][name],
        }))
      : [];

  return {
    rows,
    totalRows: rows.length,
    schema,
  };
}
