export interface BigQueryConnectionStatus {
  connected: boolean;
  projectId: string | null;
  datasets: string[];
  error?: string;
}

export interface BigQueryQueryResult {
  rows: Record<string, unknown>[];
  totalRows: number;
  schema: Array<{ name: string; type: string }>;
}
