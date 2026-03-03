# Dashboard Modules Design

## Decision
Sidebar navigation layout with 10 independent dashboard modules. Recharts for visualizations. Clean functional design matching existing Tailwind patterns.

## Route Structure
```
/dashboard              → redirect to /dashboard/overview
/dashboard/overview     → Master Overview
/dashboard/traffic      → Traffic Sources
/dashboard/ecommerce    → E-commerce Performance
/dashboard/seo          → SEO & Organic
/dashboard/campaigns    → Campaigns & Paid
/dashboard/audience     → Audience & Demographics
/dashboard/devices      → Device & Technology
/dashboard/geography    → Geography
/dashboard/compare      → Domain Comparison
/dashboard/reports      → Custom Reports
```

## Layout

Fixed sidebar (w-56) with nav links + top bar with domain picker and date range. Content area scrollable, max-w-7xl.

**DashboardContext** (React Context): holds `selectedPropertyIds[]` and `dateRange`, synced to URL params.

## Shared Components

| Component | Purpose |
|-----------|---------|
| DashboardLayout | Sidebar + top bar + content wrapper |
| DashboardContext | Filter state provider (properties, date range) |
| DomainPicker | Multi-select dropdown for 70 properties |
| DateRangePicker | Preset buttons: 7d, 30d, 90d, YTD, Custom |
| KPICard | Value + label + % change + sparkline |
| DataTable | Sortable, paginated table with CSV export |
| ChartCard | Recharts wrapper with title + loading state |

## Module Specifications

### 1. Master Overview
- 6 KPI cards: Users, Sessions, Revenue, Page Views, Bounce Rate, Avg Duration
- Traffic trend area chart (30d)
- Top 10 domains table
- Channel breakdown donut chart
- Dims: date, hostName, defaultChannelGroup
- Metrics: activeUsers, sessions, totalRevenue, screenPageViews, bounceRate, averageSessionDuration

### 2. Traffic Sources
- Channel trend stacked area chart
- Source/Medium sortable table
- Top 10 referrers horizontal bar chart
- Dims: date, sessionSource, sessionMedium, defaultChannelGroup
- Metrics: activeUsers, sessions, bounceRate, totalRevenue, engagementRate

### 3. E-commerce Performance
- 4 KPI cards: Revenue, Transactions, AOV, Conversion Rate
- Revenue trend line chart
- Conversion funnel: Views → Cart → Checkout → Purchase
- Top products table, Revenue by domain bar chart
- Dims: date, itemName, itemCategory, hostName, transactionId
- Metrics: totalRevenue, ecommercePurchases, averagePurchaseRevenue, purchaserConversionRate, itemsViewed, itemsAddedToCart, itemsCheckedOut, itemsPurchased

### 4. SEO & Organic
- Organic traffic area chart
- 3 KPI cards: Organic Users, Sessions, Revenue
- Landing pages table (top 50), Content performance table
- Filter: defaultChannelGroup == "Organic Search"
- Dims: date, landingPage, pagePath, pageTitle
- Metrics: activeUsers, sessions, bounceRate, totalRevenue, screenPageViews, averageSessionDuration

### 5. Campaigns & Paid
- Campaign table with ROAS
- 3 KPI cards: Ad Spend, Ad Revenue, ROAS
- Spend vs Revenue dual-axis line chart
- Top campaigns bar chart
- Dims: date, sessionCampaignName, sessionMedium, sessionSource
- Metrics: activeUsers, sessions, totalRevenue, advertiserAdCost, advertiserAdClicks, returnOnAdSpend

### 6. Audience & Demographics
- New vs Returning donut + KPIs
- Country breakdown bar chart (top 20)
- Language table
- Engagement rate trend line
- Dims: newVsReturning, country, language, firstSessionDate
- Metrics: activeUsers, newUsers, totalUsers, sessions, engagementRate, totalRevenue

### 7. Device & Technology
- Device split pie chart (Desktop/Mobile/Tablet)
- Browser table, OS bar chart, Screen resolution table
- Dims: deviceCategory, browser, operatingSystem, screenResolution
- Metrics: activeUsers, sessions, bounceRate, averageSessionDuration, totalRevenue

### 8. Geography
- Country table (top 50, sortable)
- City drill-down (click country → cities)
- Continent summary KPI cards
- Top 10 countries bar chart
- Dims: country, city, continent, region
- Metrics: activeUsers, sessions, totalRevenue, bounceRate

### 9. Domain Comparison
- Property selector (2-5 domains)
- Grouped bar chart comparison
- Multi-line trend overlay
- Comparison table
- Same metrics as Overview, filtered to selected properties

### 10. Custom Reports
- Dimension/metric pickers from full GA4 catalog
- Dynamic results table (sortable, paginated)
- CSV export
- No charts — pure data exploration

## Data Fetching Strategy
- Each module: one POST to `/api/ga4/report` with module-specific dims/metrics
- Multi-property: batched 10/time with 1s delay (existing rate limiter)
- Date comparison: fetch current + previous period for % change
- Caching: React state per module, re-fetch on filter change
- Loading: skeleton cards/tables. Error: per-module error state.

## Tech
- Charts: Recharts
- Styling: Tailwind CSS (existing patterns)
- State: React Context for filters, local state per module
- Export: CSV via client-side generation
