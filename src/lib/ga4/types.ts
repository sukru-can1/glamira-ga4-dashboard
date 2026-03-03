/** A GA4 property discovered via the Admin API */
export interface GA4Property {
  propertyId: string;
  displayName: string;
  accountId: string;
  accountName: string;
}

/** Configuration for a GA4 report request */
export interface GA4ReportConfig {
  propertyIds: string[];
  dateRange: { startDate: string; endDate: string };
  dimensions: string[];
  metrics: string[];
  limit?: number;
  orderBy?: { field: string; desc?: boolean };
}

/** A single row of a GA4 report */
export interface GA4ReportRow {
  dimensions: Record<string, string>;
  metrics: Record<string, string>;
}

/** Result of a single-property report */
export interface GA4ReportResult {
  propertyId: string;
  rows: GA4ReportRow[];
  rowCount: number;
  metadata?: {
    currencyCode?: string;
    timeZone?: string;
  };
}

/** Result of a multi-property report */
export interface MultiPropertyReportResult {
  results: GA4ReportResult[];
  errors: Array<{ propertyId: string; error: string }>;
}

/** Audit result for a single property */
export interface PropertyAuditResult {
  propertyId: string;
  displayName: string;
  hasData: boolean;
  hasEcommerce: boolean;
  hasSearchEvents: boolean;
  hasCustomEvents: boolean;
  totalUsers30d: number;
  totalSessions30d: number;
  totalRevenue30d: number;
  topEventNames: string[];
  availableDimensions: string[];
  issues: string[];
}
