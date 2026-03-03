/**
 * GA4 Property Auditor
 *
 * Runs a data discovery audit across all configured GA4 properties.
 * Outputs a report showing what data is available per property,
 * identifying gaps and inconsistencies.
 *
 * Usage: npx tsx scripts/audit-properties.ts
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface PropertyConfig {
  propertyId: string;
  domain: string;
  country: string;
  currency: string;
}

interface AuditResult {
  domain: string;
  propertyId: string;
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

// Core dimensions to test availability
const CORE_DIMENSIONS = [
  'hostName', 'pagePath', 'source', 'medium',
  'defaultChannelGroup', 'country', 'deviceCategory',
  'landingPage', 'newVsReturning'
];

// E-commerce metrics to test
const ECOMMERCE_METRICS = [
  'totalRevenue', 'ecommercePurchases', 'transactions',
  'itemRevenue', 'averagePurchaseRevenue'
];

// Core metrics every property should have
const CORE_METRICS = [
  'activeUsers', 'sessions', 'engagementRate',
  'bounceRate', 'screenPageViews', 'eventCount'
];

async function auditProperty(
  client: BetaAnalyticsDataClient,
  config: PropertyConfig
): Promise<AuditResult> {
  const result: AuditResult = {
    domain: config.domain,
    propertyId: config.propertyId,
    hasData: false,
    hasEcommerce: false,
    hasSearchEvents: false,
    hasCustomEvents: false,
    totalUsers30d: 0,
    totalSessions30d: 0,
    totalRevenue30d: 0,
    topEventNames: [],
    availableDimensions: [],
    issues: []
  };

  try {
    // 1. Get metadata — available dimensions/metrics
    const [metadata] = await client.getMetadata({
      name: `properties/${config.propertyId}/metadata`
    });

    if (metadata.dimensions) {
      result.availableDimensions = metadata.dimensions
        .map(d => d.apiName!)
        .filter(Boolean);
    }

    // 2. Basic traffic check
    const [trafficReport] = await client.runReport({
      property: `properties/${config.propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' }
      ]
    });

    if (trafficReport.rows && trafficReport.rows.length > 0) {
      result.hasData = true;
      result.totalUsers30d = parseInt(trafficReport.rows[0].metricValues![0].value || '0');
      result.totalSessions30d = parseInt(trafficReport.rows[0].metricValues![1].value || '0');
    }

    if (!result.hasData) {
      result.issues.push('NO DATA: Property has zero users in last 30 days');
      return result;
    }

    // 3. E-commerce check
    try {
      const [ecomReport] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'totalRevenue' },
          { name: 'ecommercePurchases' }
        ]
      });

      if (ecomReport.rows && ecomReport.rows.length > 0) {
        result.totalRevenue30d = parseFloat(ecomReport.rows[0].metricValues![0].value || '0');
        const purchases = parseInt(ecomReport.rows[0].metricValues![1].value || '0');
        result.hasEcommerce = purchases > 0;

        if (!result.hasEcommerce) {
          result.issues.push('WARNING: No e-commerce purchases tracked');
        }
      }
    } catch {
      result.issues.push('E-commerce metrics not available');
    }

    // 4. Event names audit
    try {
      const [eventReport] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 20
      });

      if (eventReport.rows) {
        result.topEventNames = eventReport.rows.map(
          r => r.dimensionValues![0].value!
        );

        // Check for site search
        result.hasSearchEvents = result.topEventNames.some(
          e => e === 'search' || e === 'view_search_results'
        );

        // Check for custom events (not auto-collected)
        const autoEvents = new Set([
          'page_view', 'session_start', 'first_visit',
          'user_engagement', 'scroll', 'click',
          'view_search_results', 'file_download'
        ]);
        result.hasCustomEvents = result.topEventNames.some(
          e => !autoEvents.has(e)
        );
      }
    } catch {
      result.issues.push('Could not retrieve event names');
    }

    // 5. Data quality checks
    if (result.totalUsers30d < 100) {
      result.issues.push(`LOW TRAFFIC: Only ${result.totalUsers30d} users in 30 days`);
    }

    if (result.totalRevenue30d === 0 && result.hasEcommerce) {
      result.issues.push('ZERO REVENUE: E-commerce events exist but revenue is zero');
    }

  } catch (error: any) {
    result.issues.push(`API ERROR: ${error.message}`);
  }

  return result;
}

async function runFullAudit(properties: PropertyConfig[]) {
  const client = new BetaAnalyticsDataClient();
  const results: AuditResult[] = [];

  // Process in batches of 10 to respect rate limits
  const batchSize = 10;
  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize);
    console.log(`Auditing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(properties.length/batchSize)}...`);

    const batchResults = await Promise.allSettled(
      batch.map(prop => auditProperty(client, prop))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed:`, result.reason);
      }
    }

    // Rate limit pause between batches
    if (i + batchSize < properties.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate summary report
  console.log('\n=== GA4 PROPERTY AUDIT REPORT ===\n');
  console.log(`Total Properties: ${results.length}`);
  console.log(`With Data: ${results.filter(r => r.hasData).length}`);
  console.log(`With E-commerce: ${results.filter(r => r.hasEcommerce).length}`);
  console.log(`With Search: ${results.filter(r => r.hasSearchEvents).length}`);
  console.log(`With Custom Events: ${results.filter(r => r.hasCustomEvents).length}`);

  console.log('\n--- Issues Found ---');
  for (const result of results) {
    if (result.issues.length > 0) {
      console.log(`\n${result.domain} (${result.propertyId}):`);
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }

  console.log('\n--- Traffic Summary ---');
  const sorted = [...results].sort((a, b) => b.totalUsers30d - a.totalUsers30d);
  for (const r of sorted) {
    console.log(
      `${r.domain.padEnd(30)} | Users: ${String(r.totalUsers30d).padStart(8)} | ` +
      `Sessions: ${String(r.totalSessions30d).padStart(8)} | ` +
      `Revenue: $${r.totalRevenue30d.toFixed(2).padStart(10)}`
    );
  }

  return results;
}

// Export for use in the dashboard app
export { auditProperty, runFullAudit, type AuditResult, type PropertyConfig };
