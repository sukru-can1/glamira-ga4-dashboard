---
name: ga4-analytics
description: >
  Google Analytics 4 master data engineering and dashboard building skill for multi-domain analytics.
  Use this skill whenever the user asks about GA4 data, analytics dashboards, traffic analysis,
  marketing metrics, BigQuery GA4 queries, multi-property reporting, or building consolidated
  dashboards across multiple domains. Also trigger when the user mentions GA4 dimensions, metrics,
  reporting, audience analysis, e-commerce tracking, conversion funnels, or channel attribution.
  This skill covers the full pipeline: GA4 API data extraction, BigQuery warehousing, data modeling,
  and Next.js dashboard implementation for 70+ Glamira domains.
---

# GA4 Analytics — Multi-Domain Dashboard Engineering

You are a senior marketing analytics data engineer specializing in Google Analytics 4.
You're building a consolidated analytics platform for **70 Glamira e-commerce domains**,
each with its own GA4 property. Your job is to extract, model, and visualize data across
all properties into a unified master dashboard.

## Core Principles

1. **Data-first planning**: Before building any UI, always analyze what data is actually available from GA4. Run discovery queries to understand what dimensions/metrics each property has, what events are tracked, and what e-commerce data exists.

2. **Incremental architecture**: Build in modules. Each dashboard section (traffic, e-commerce, SEO, campaigns) is an independent module that can be developed, tested, and deployed separately.

3. **BigQuery as the source of truth**: GA4 natively exports to BigQuery. Use BigQuery for historical analysis and heavy aggregations. Use the GA4 Data API for real-time/near-real-time queries only.

4. **Cross-property normalization**: 70 domains means 70 different GA4 properties. Always include `property_id` and `domain` as dimensions in every query to enable cross-domain comparison and aggregation.

## Phase 1: Data Discovery (DO THIS FIRST)

Before building anything, discover what data is available. This is critical because GA4 properties can have wildly different configurations.

### Step 1: Property Inventory

Create a configuration file mapping all 70 domains to their GA4 property IDs:

```typescript
// config/ga4-properties.ts
export interface GA4Property {
  propertyId: string;       // e.g., "properties/123456789"
  domain: string;           // e.g., "glamira.com"
  country: string;          // e.g., "DE"
  currency: string;         // e.g., "EUR"
  bigqueryDataset?: string; // e.g., "analytics_123456789"
  hasEcommerce: boolean;
  isActive: boolean;
}

export const GA4_PROPERTIES: GA4Property[] = [
  // User fills this in
];
```

### Step 2: Run Data Audit

For each property, run a metadata query to discover available dimensions and metrics:

```typescript
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const client = new BetaAnalyticsDataClient();

async function auditProperty(propertyId: string) {
  // Get metadata — what dimensions/metrics are available
  const [metadata] = await client.getMetadata({
    name: `properties/${propertyId}/metadata`
  });

  // Test core report — what data actually exists
  const [report] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [
      { name: 'date' },
      { name: 'hostName' },
      { name: 'defaultChannelGroup' }
    ],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'totalRevenue' },
      { name: 'ecommercePurchases' }
    ]
  });

  return { metadata, report };
}
```

### Step 3: Data Quality Report

After auditing, generate a report showing:
- Which properties have e-commerce tracking
- Which properties have event tracking beyond pageviews
- Data volume per property (helps size BigQuery costs)
- Missing or inconsistent tracking across domains
- Currency differences that need normalization

## Phase 2: Data Architecture

### BigQuery Schema

GA4 exports create `events_YYYYMMDD` tables per property. Structure your consolidated warehouse:

```
bigquery-project/
├── analytics_<property_id>/          # Raw GA4 export (per property)
│   ├── events_YYYYMMDD              # Daily event tables
│   ├── events_intraday_YYYYMMDD     # Streaming tables
│   └── pseudonymous_users_YYYYMMDD  # User tables
├── glamira_analytics/                # Consolidated dataset
│   ├── v_all_sessions               # View: sessions across all domains
│   ├── v_all_traffic                # View: traffic sources consolidated
│   ├── v_all_ecommerce              # View: revenue/transactions
│   ├── v_all_pages                  # View: page performance
│   ├── dim_domains                  # Domain master table
│   └── dim_date                     # Date dimension table
```

### Key BigQuery Queries for Multi-Domain

```sql
-- Consolidated sessions across all 70 domains
-- Uses UNION ALL across all property datasets
CREATE OR REPLACE VIEW `glamira_analytics.v_all_sessions` AS
SELECT
  property_id,
  domain,
  event_date,
  user_pseudo_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id,
  traffic_source.source,
  traffic_source.medium,
  traffic_source.name as campaign,
  device.category as device_category,
  device.web_info.browser,
  geo.country,
  geo.city,
  ecommerce.purchase_revenue_in_usd as revenue_usd
FROM `analytics_*/events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
```

### GA4 Data API for Real-Time Queries

Use the Data API when you need fresh data or the BigQuery export hasn't caught up:

```typescript
// Batch query across multiple properties
async function queryAllProperties(
  properties: GA4Property[],
  dateRange: { startDate: string; endDate: string },
  dimensions: string[],
  metrics: string[]
) {
  const results = await Promise.allSettled(
    properties.map(prop =>
      client.runReport({
        property: `properties/${prop.propertyId}`,
        dateRanges: [dateRange],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        limit: 10000
      }).then(([report]) => ({
        propertyId: prop.propertyId,
        domain: prop.domain,
        report
      }))
    )
  );

  // Separate successes from failures
  const successful = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value);
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r, i) => ({ property: properties[i].domain, error: r.reason }));

  return { successful, failed };
}
```

## Phase 3: Dashboard Architecture

### Module Structure

```
src/
├── app/
│   ├── page.tsx                          # Master dashboard overview
│   ├── layout.tsx                        # App shell with domain selector
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # OAuth2 with Google
│   │   ├── ga4/
│   │   │   ├── properties/route.ts       # List all GA4 properties
│   │   │   ├── report/route.ts           # Run GA4 Data API reports
│   │   │   ├── realtime/route.ts         # Real-time data
│   │   │   └── audit/route.ts            # Property data audit
│   │   └── bigquery/
│   │       ├── query/route.ts            # Run BigQuery queries
│   │       └── sync/route.ts             # Trigger data sync
│   ├── dashboard/
│   │   ├── overview/page.tsx             # KPI cards, sparklines, alerts
│   │   ├── traffic/page.tsx              # Traffic sources & channels
│   │   ├── ecommerce/page.tsx            # Revenue, transactions, products
│   │   ├── seo/page.tsx                  # Organic traffic, landing pages
│   │   ├── campaigns/page.tsx            # Paid campaigns performance
│   │   ├── audience/page.tsx             # Demographics, interests, behavior
│   │   ├── devices/page.tsx              # Device & browser breakdown
│   │   ├── geography/page.tsx            # Country/city heatmaps
│   │   └── domains/
│   │       ├── page.tsx                  # Domain comparison table
│   │       └── [domain]/page.tsx         # Single domain deep-dive
│   └── settings/
│       ├── properties/page.tsx           # Manage GA4 property mappings
│       └── alerts/page.tsx               # Configure metric alerts
├── components/
│   ├── charts/                           # Reusable chart components
│   │   ├── TimeSeriesChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── Heatmap.tsx
│   │   ├── Sparkline.tsx
│   │   └── DataTable.tsx
│   ├── dashboard/
│   │   ├── KPICard.tsx                   # Metric card with trend
│   │   ├── DomainSelector.tsx            # Multi-select domain filter
│   │   ├── DateRangePicker.tsx           # Date range with presets
│   │   ├── ComparisonToggle.tsx          # Compare periods
│   │   └── ExportButton.tsx              # CSV/PDF export
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── FilterBar.tsx
├── lib/
│   ├── ga4/
│   │   ├── client.ts                     # GA4 Data API client wrapper
│   │   ├── properties.ts                 # Property management
│   │   ├── dimensions.ts                 # Dimension/metric definitions
│   │   ├── queries.ts                    # Pre-built report queries
│   │   └── types.ts                      # TypeScript types for GA4 data
│   ├── bigquery/
│   │   ├── client.ts                     # BigQuery client
│   │   └── queries/                      # SQL query templates
│   │       ├── sessions.sql
│   │       ├── traffic.sql
│   │       ├── ecommerce.sql
│   │       └── pages.sql
│   ├── utils/
│   │   ├── currency.ts                   # Multi-currency normalization
│   │   ├── dateUtils.ts                  # Date range helpers
│   │   └── aggregation.ts               # Cross-domain data aggregation
│   └── hooks/
│       ├── useGA4Report.ts               # React hook for GA4 queries
│       ├── useBigQuery.ts                # React hook for BQ queries
│       └── useDomainFilter.ts            # Domain selection state
└── config/
    ├── ga4-properties.ts                 # 70 domain-property mappings
    ├── dashboardModules.ts               # Dashboard module registry
    └── kpiDefinitions.ts                 # KPI calculations & thresholds
```

### Key Dashboard Modules

Each module reads from `references/dashboard-modules.md` for detailed specs. Here's the summary:

#### 1. Master Overview
- **KPI Cards**: Total users, sessions, revenue, conversion rate (all domains combined)
- **Trend Sparklines**: 30-day trends with period comparison
- **Domain Leaderboard**: Top/bottom performers by key metrics
- **Alerts**: Properties with unusual traffic drops/spikes

#### 2. Traffic Analysis
- **Dimensions**: source, medium, defaultChannelGroup, sessionCampaignName
- **Metrics**: sessions, activeUsers, engagementRate, bounceRate, conversions
- **Charts**: Channel breakdown (stacked bar), source treemap, medium-over-time

#### 3. E-commerce Performance
- **Dimensions**: itemName, itemCategory, transactionId, hostName
- **Metrics**: totalRevenue, transactions, ecommercePurchases, averagePurchaseRevenue
- **Charts**: Revenue by domain, product performance, conversion funnel

#### 4. SEO & Content
- **Dimensions**: landingPage, pagePath, pageTitle, hostName, source (filtered: google/organic)
- **Metrics**: sessions, activeUsers, engagementRate, screenPageViews
- **Charts**: Top landing pages, organic traffic trend, page performance table

#### 5. Audience & Geography
- **Dimensions**: country, city, deviceCategory, browser, language, newVsReturning
- **Metrics**: activeUsers, sessions, engagementRate, totalRevenue
- **Charts**: World heatmap, device pie chart, new vs returning, language distribution

## Phase 4: Implementation Workflow

When the user asks to build the dashboard, follow this sequence:

1. **Ask for property list** — Get the 70 domain names and GA4 property IDs
2. **Set up OAuth2** — Configure Google Cloud project, OAuth consent screen, credentials
3. **Run data audit** — Discover what data is available per property (Phase 1)
4. **Analyze audit results** — Identify gaps, inconsistencies, plan normalization
5. **Set up BigQuery** — Enable exports for all 70 properties if not done
6. **Create consolidated views** — Build BigQuery views for cross-domain analysis
7. **Build API layer** — Next.js API routes for GA4 and BigQuery queries
8. **Build UI modules** — One module at a time, starting with Overview
9. **Add filtering** — Domain selector, date range, comparison tools
10. **Add exports** — CSV/PDF export for all data views

## GA4 Data API Quick Reference

### Dimensions by Use Case

Read `references/ga4-dimensions.md` for the complete categorized list. Key combos:

| Dashboard Section | Dimensions | Metrics |
|---|---|---|
| Traffic Overview | source, medium, defaultChannelGroup | sessions, activeUsers, engagementRate |
| E-commerce | itemName, itemCategory, hostName | totalRevenue, transactions, ecommercePurchases |
| SEO | landingPage, pagePath, hostName | sessions, screenPageViews, bounceRate |
| Geography | country, city, deviceCategory | activeUsers, sessions, totalRevenue |
| Campaigns | sessionCampaignName, source, medium | sessions, conversions, totalRevenue |
| Content | pageTitle, pagePath, contentGroup | screenPageViews, averageSessionDuration |
| Audience | newVsReturning, firstSessionDate | activeUsers, sessions, engagementRate |

### API Rate Limits (Important for 70 Properties!)

- **Core Reporting**: 10,000 requests per day per project
- **Realtime**: 10 concurrent requests per project
- **Tokens per project per hour**: Varies — batch requests to stay within limits
- **Strategy**: Use `batchRunReports` (up to 5 reports per call) to reduce request count. For 70 properties, run queries in parallel batches of 10.

### Authentication Flow (OAuth2)

```typescript
// NextAuth.js configuration for Google OAuth
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/bigquery.readonly'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    }
  }
};
```

## Multi-Currency Normalization

Since 70 domains span multiple countries, always normalize revenue to a base currency:

```typescript
// Use ECB exchange rates or Google's built-in USD normalization
// GA4 provides purchaseRevenueInUSD as a metric when available
// For BigQuery: ecommerce.purchase_revenue_in_usd
```

## Error Handling for Multi-Property Queries

When querying 70 properties, some will fail. Always use `Promise.allSettled` and report partial results:

```typescript
// Show results for 67/70 properties, list 3 failures with reasons
// Common failures: property not found, permission denied, quota exceeded
```

## Recommended Chart Library

Use **Recharts** or **Tremor** for the dashboard charts:
- Recharts: More flexible, lower-level control
- Tremor: Higher-level, pre-built dashboard components, faster to build

For maps/heatmaps: **react-simple-maps** or **Leaflet**
