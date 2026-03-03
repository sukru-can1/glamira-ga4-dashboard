# Dashboard Module Specifications

## Module 1: Master Overview

The landing page. Shows consolidated KPIs across all 70 domains at a glance.

### KPI Cards (Top Row)
| KPI | Metric | Comparison |
|---|---|---|
| Total Users | `activeUsers` | vs previous period % |
| Total Sessions | `sessions` | vs previous period % |
| Total Revenue | `totalRevenue` | vs previous period % |
| Conversion Rate | `purchaserConversionRate` | vs previous period pts |
| Avg Order Value | `averagePurchaseRevenue` | vs previous period % |
| Engagement Rate | `engagementRate` | vs previous period pts |

### Sparkline Trends
30-day line charts under each KPI card showing daily values.

### Domain Leaderboard
Sortable table of all 70 domains showing:
- Domain name
- Users, Sessions, Revenue, Conversion Rate
- Trend arrows (up/down vs previous period)
- Color coding: green (above avg), red (below avg)

### Anomaly Alerts
Automatically detect and surface:
- Traffic drops > 20% day-over-day
- Revenue drops > 30%
- Sudden bounce rate spikes
- Properties with zero data (tracking broken?)

---

## Module 2: Traffic Sources

### Primary View: Channel Mix
- Stacked bar chart: channels over time (Organic, Paid, Direct, Referral, Social, Email)
- Dimensions: `defaultChannelGroup`, `date`
- Metrics: `sessions`, `activeUsers`, `engagementRate`, `conversions`

### Source/Medium Table
- Dimensions: `source`, `medium`, `sourceMedium`
- Metrics: `sessions`, `activeUsers`, `bounceRate`, `engagementRate`, `totalRevenue`
- Sortable, filterable, with domain breakdown

### Channel Attribution
- First-touch vs last-touch comparison
- Dimensions: `firstUserSource`, `firstUserMedium` vs `source`, `medium`
- Shows which channels acquire vs which convert

### Filters
- Domain multi-select
- Date range
- Channel group filter

---

## Module 3: E-commerce Performance

### Revenue Dashboard
- **Total Revenue Card**: Sum across all domains with currency normalization
- **Revenue by Domain**: Horizontal bar chart ranking 70 domains
- **Revenue Over Time**: Line chart with domain comparison overlay
- Dimensions: `hostName`, `date`
- Metrics: `totalRevenue`, `transactions`, `ecommercePurchases`

### Product Performance
- Dimensions: `itemName`, `itemCategory`, `itemBrand`
- Metrics: `itemRevenue`, `itemsPurchased`, `itemsViewed`, `cartToViewRate`, `purchaseToViewRate`
- Sortable table with conversion funnel indicators

### Conversion Funnel
- Stages: View -> Add to Cart -> Checkout -> Purchase
- Metrics: `itemsViewed`, `itemsAddedToCart`, `itemsCheckedOut`, `itemsPurchased`
- Funnel visualization with drop-off rates

### Transaction Analysis
- Average order value trends
- Transaction count by day of week / hour
- Currency distribution across domains
- Coupon usage (`orderCoupon` dimension)

---

## Module 4: SEO & Organic

### Organic Traffic Overview
- Filter: `defaultChannelGroup` = "Organic Search"
- Dimensions: `date`, `hostName`, `landingPage`
- Metrics: `sessions`, `activeUsers`, `engagementRate`, `bounceRate`

### Landing Page Performance
- Top landing pages across all domains
- Dimensions: `landingPage`, `hostName`
- Metrics: `sessions`, `engagementRate`, `bounceRate`, `totalRevenue`
- Group by domain for comparison

### Site Search
- What users search for on each domain
- Dimensions: `searchTerm`, `hostName`
- Metrics: `eventCount` (for search events)

### Content Performance
- Dimensions: `pagePath`, `pageTitle`, `contentGroup`
- Metrics: `screenPageViews`, `averageSessionDuration`, `engagementRate`
- Identify top content across all 70 domains

---

## Module 5: Campaigns & Paid

### Campaign Overview
- Dimensions: `sessionCampaignName`, `source`, `medium`
- Metrics: `sessions`, `activeUsers`, `conversions`, `totalRevenue`
- Filter for paid channels only

### Google Ads Integration
- Dimensions: `googleAdsCampaignName`, `googleAdsAdGroupName`, `googleAdsKeyword`
- Metrics: `advertiserAdClicks`, `advertiserAdCost`, `advertiserAdCostPerClick`, `returnOnAdSpend`
- ROAS by campaign with cost data

### Campaign Comparison
- Side-by-side comparison of campaigns across domains
- Which campaigns work in which markets?
- Budget allocation recommendations based on ROAS

---

## Module 6: Audience & Demographics

### User Segments
- Dimensions: `newVsReturning`, `firstSessionDate`
- Metrics: `activeUsers`, `sessions`, `engagementRate`, `totalRevenue`
- New vs returning user trends

### Demographics (if Google Signals enabled)
- Dimensions: `userAgeBracket`, `userGender`
- Metrics: `activeUsers`, `totalRevenue`
- Cross-domain demographic comparison

### Language Distribution
- Dimensions: `language`, `hostName`
- Important for Glamira's international 70-domain setup
- Match language preferences to domain targeting

---

## Module 7: Device & Technology

### Device Mix
- Dimensions: `deviceCategory`, `hostName`
- Metrics: `sessions`, `engagementRate`, `totalRevenue`, `purchaserConversionRate`
- Mobile vs desktop conversion gap analysis

### Browser Performance
- Dimensions: `browser`, `operatingSystem`
- Metrics: `sessions`, `bounceRate`, `engagementRate`
- Identify browsers with poor performance (potential UX issues)

### Screen Resolution
- Dimensions: `screenResolution`, `deviceCategory`
- Identify most common viewport sizes for design decisions

---

## Module 8: Geography

### World Heatmap
- Dimensions: `country`, `countryId`
- Metrics: `activeUsers`, `totalRevenue`
- Color-coded world map showing user/revenue concentration

### Country Performance Table
- All metrics broken down by country
- Compare against which Glamira domain serves that country
- Identify mismatches (e.g., German users on .com instead of .de)

### City-Level Data
- Top cities by users/revenue
- Dimensions: `city`, `country`
- Useful for localized marketing decisions

---

## Module 9: Domain Comparison

### Domain vs Domain
- Select 2-5 domains for direct comparison
- Side-by-side metric cards
- Overlay line charts for trend comparison
- Radar chart for multi-metric comparison

### Domain Health Score
- Composite score based on:
  - Traffic trend (up/down/stable)
  - Engagement rate vs average
  - Revenue per user vs average
  - Bounce rate vs average
  - Mobile conversion vs desktop
- Ranked list with traffic light indicators

---

## Module 10: Custom Reports

### Report Builder
- Drag-and-drop dimension/metric selector
- Choose from full GA4 dimension/metric catalog
- Select domains to include
- Choose visualization type
- Save and share reports

### Scheduled Reports
- Daily/weekly/monthly email reports
- PDF export with custom branding
- Slack/Teams integration for alerts

---

## Shared Components

### Domain Selector
- Multi-select dropdown with search
- "Select All" / "Select None"
- Group domains by region/country
- Remember last selection per user

### Date Range Picker
- Presets: Today, Yesterday, Last 7/30/90 days, This month, Last month, This year
- Custom range selector
- Comparison period toggle (previous period, previous year)

### Data Table
- Sortable columns
- Column visibility toggle
- Pagination
- CSV export
- Inline sparklines for trend columns
- Conditional formatting (red/green based on thresholds)
