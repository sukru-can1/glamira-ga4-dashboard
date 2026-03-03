# Google GA4 Analytics Platform

## Project Overview
Multi-domain GA4 analytics dashboard platform for **70 Glamira domains**. Each domain has its own GA4 property. The platform consolidates all GA4 data into a master dashboard for full marketing overview.

## Tech Stack
- **Frontend/Backend**: Next.js (chosen for modularity, elasticity, and incremental improvement)
- **Database**: Google BigQuery (native GA4 export, handles massive datasets, built-in analytics SQL)
- **Authentication**: OAuth2 (Google user login for GA4 API access)
- **Deployment**: Vercel (frontend), BigQuery (data warehouse)
- **GA4 API**: Google Analytics Data API v1 (`@google-analytics/data` Node.js client)

## Architecture Decisions
- BigQuery chosen over PostgreSQL/SQLite because GA4 natively exports to BigQuery — no ETL needed
- OAuth2 chosen over Service Account because user-level access across 70 properties
- Next.js chosen for maximum modularity — each dashboard section is an independent module
- Data flows: GA4 Properties -> BigQuery (native export) + GA4 Data API v1 (real-time queries) -> Next.js Dashboard

## GA4 API Key Methods
- `runReport` — Single property report queries
- `batchRunReports` — Multiple reports in one API call
- `runRealtimeReport` — Real-time data
- Client: `BetaAnalyticsDataClient` from `@google-analytics/data`

## 70 Domains Structure
Each domain has its own GA4 property ID. The master dashboard consolidates data across all properties. Domain configuration stored in a central config with property IDs mapped to domain names.

## Dashboard Goal
**Full Marketing Overview** — Traffic + conversions + campaigns + audience data consolidated across all 70 domains. Key areas:
- Organic traffic & SEO performance
- Paid campaigns (Google Ads, etc.)
- E-commerce metrics (revenue, conversions, products)
- Audience demographics & behavior
- Device & geography breakdown
- Landing page performance
- Channel attribution

## GA4 Skill
Located at `.claude/skills/ga4-analytics/SKILL.md` — invoke with `/ga4-analytics` for GA4 data engineering, dashboard planning, and implementation guidance.

## Key GA4 Dimensions Available
### Traffic: source, medium, defaultChannelGroup, sessionCampaignName
### Content: pagePath, pageTitle, landingPage, hostName
### User: newVsReturning, firstSessionDate, audienceName
### Geo: country, city, region, continent
### Device: deviceCategory, browser, operatingSystem, screenResolution
### E-commerce: itemId, itemName, itemBrand, itemCategory, orderCoupon
### Time: date, dateHour, hour, dayOfWeek, month, isoWeek

## Key GA4 Metrics Available
- Users: activeUsers, newUsers, totalUsers, returningUsers
- Sessions: sessions, engagedSessions, sessionsPerUser, engagementRate
- Events: eventCount, eventCountPerUser, conversions
- E-commerce: totalRevenue, purchaseRevenue, transactions, ecommercePurchases
- Pages: screenPageViews, screenPageViewsPerSession
- Engagement: averageSessionDuration, bounceRate, userEngagementDuration

## Commands
```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# GA4 data fetch scripts (when created)
npm run fetch-ga4-data
npm run sync-bigquery
```

## Environment Variables Needed
```bash
AUTH_GOOGLE_ID=               # OAuth2 client ID
AUTH_GOOGLE_SECRET=           # OAuth2 client secret
AUTH_SECRET=                  # Auth.js secret (generate with `openssl rand -base64 32`)
AUTH_URL=http://localhost:3000 # App URL
GOOGLE_BIGQUERY_PROJECT_ID=  # BigQuery project
```

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # Auth.js route handler
│   │   ├── bigquery/
│   │   │   ├── status/route.ts          # Connection test
│   │   │   └── query/route.ts           # Read-only SQL
│   │   └── ga4/
│   │       ├── properties/route.ts      # Auto-discover properties
│   │       ├── report/route.ts          # Single/multi-property reports
│   │       ├── realtime/route.ts        # Real-time data
│   │       └── audit/route.ts           # Property data audit
│   ├── properties/
│   │   ├── page.tsx                     # Property list
│   │   └── [propertyId]/page.tsx        # Property detail + audit
│   ├── settings/page.tsx                # Config status + BigQuery test
│   └── page.tsx                         # Landing / sign-in
├── components/
│   ├── auth/
│   │   ├── SessionProvider.tsx
│   │   └── SignInButton.tsx
│   └── properties/
│       ├── PropertyCard.tsx
│       └── PropertyList.tsx
├── lib/
│   ├── auth.ts                          # Auth.js v5 config (Google OAuth2)
│   ├── auth-helpers.ts                  # OAuth2Client bridge for gRPC APIs
│   ├── bigquery/
│   │   ├── client.ts                    # BigQuery connection + query
│   │   └── types.ts
│   ├── ga4/
│   │   ├── admin-client.ts              # listAllProperties() via Admin API
│   │   ├── audit.ts                     # 5-step property audit
│   │   ├── data-client.ts              # runReport / runMultiPropertyReport / runRealtime
│   │   └── types.ts
│   └── utils/
│       ├── currency.ts                  # Multi-currency stub
│       └── rate-limiter.ts              # Batch processing + rate limiting
├── proxy.ts                             # Route protection (Next.js 16 proxy)
└── types/
    └── next-auth.d.ts                   # JWT/Session type extensions
```

## Key Patterns
- **OAuth2 → gRPC bridge**: `getAuthenticatedOAuth2Client()` creates an `OAuth2Client` from `google-auth-library`, sets the user's access token, and passes it as `authClient` to Google gRPC clients
- **Property auto-discovery**: Uses `AnalyticsAdminServiceClient.listAccountSummariesAsync()` — no manual property ID config needed
- **Rate limiting**: `batchProcess()` utility runs N items in batches with delays. Reports: 10/batch, 1s. Audits: 5/batch, 2s
- **Token refresh**: JWT callback auto-refreshes expired Google tokens via `oauth2.googleapis.com/token`

## Project Status
- [x] Project initialized
- [x] GA4 skill created
- [x] Next.js app scaffolding (Next.js 16 + TypeScript + Tailwind)
- [x] OAuth2 + Auth.js v5 setup (Google provider, token refresh, route protection)
- [x] GA4 property auto-discovery (Admin API, 10-min cache)
- [x] GA4 Data API report client (single, multi-property, real-time)
- [x] GA4 property audit tool (5-step: metadata, traffic, e-commerce, events, quality)
- [x] BigQuery connection (read-only queries, connection test)
- [x] Foundation UI (property list, property detail, settings, landing page)
- [ ] Google Cloud OAuth2 credentials (Phase 0 — user manual setup)
- [ ] Dashboard modules (Overview, Traffic, E-commerce, SEO, etc.)
- [ ] Master consolidated dashboard
