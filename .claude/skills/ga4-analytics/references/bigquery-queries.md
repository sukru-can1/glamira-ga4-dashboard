# BigQuery Query Templates for Multi-Domain GA4

## Understanding GA4 BigQuery Export

Each GA4 property exports to `analytics_<property_id>` dataset with `events_YYYYMMDD` tables.
Each row = one event. Event parameters are nested in `event_params` RECORD.

## Essential Queries

### 1. Sessions Across All Domains

```sql
-- Count sessions per domain per day
SELECT
  PARSE_DATE('%Y%m%d', event_date) as date,
  -- Extract domain from traffic_source or event_params
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url,
  traffic_source.source,
  traffic_source.medium,
  COUNT(DISTINCT CONCAT(user_pseudo_id,
    CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
  )) as sessions,
  COUNT(DISTINCT user_pseudo_id) as users
FROM `project.analytics_PROPERTY_ID.events_*`
WHERE _TABLE_SUFFIX BETWEEN
  FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY 1, 2, 3, 4
ORDER BY date DESC, sessions DESC
```

### 2. Revenue by Domain

```sql
SELECT
  PARSE_DATE('%Y%m%d', event_date) as date,
  -- Domain identifier
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url,
  COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'transaction_id')
  END) as transactions,
  SUM(CASE WHEN event_name = 'purchase' THEN ecommerce.purchase_revenue_in_usd ELSE 0 END) as revenue_usd,
  COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN user_pseudo_id END) as purchasers,
  COUNT(DISTINCT user_pseudo_id) as total_users
FROM `project.analytics_PROPERTY_ID.events_*`
WHERE _TABLE_SUFFIX BETWEEN
  FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY 1, 2
ORDER BY revenue_usd DESC
```

### 3. Conversion Funnel

```sql
-- E-commerce funnel: view -> add_to_cart -> begin_checkout -> purchase
WITH funnel_events AS (
  SELECT
    user_pseudo_id,
    event_name,
    event_date,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id
  FROM `project.analytics_PROPERTY_ID.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  AND event_name IN ('view_item', 'add_to_cart', 'begin_checkout', 'purchase')
)
SELECT
  'view_item' as step,
  COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as sessions
FROM funnel_events WHERE event_name = 'view_item'
UNION ALL
SELECT 'add_to_cart', COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
FROM funnel_events WHERE event_name = 'add_to_cart'
UNION ALL
SELECT 'begin_checkout', COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
FROM funnel_events WHERE event_name = 'begin_checkout'
UNION ALL
SELECT 'purchase', COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
FROM funnel_events WHERE event_name = 'purchase'
```

### 4. Landing Page Performance

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as landing_page,
  COUNT(DISTINCT CONCAT(user_pseudo_id,
    CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
  )) as sessions,
  COUNT(DISTINCT user_pseudo_id) as users,
  -- Engagement: sessions with engaged_session_event = 1
  COUNTIF((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engaged_session_event') = 1)
    / COUNT(*) as engagement_rate
FROM `project.analytics_PROPERTY_ID.events_*`
WHERE _TABLE_SUFFIX BETWEEN
  FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
AND event_name = 'session_start'
GROUP BY 1
ORDER BY sessions DESC
LIMIT 100
```

### 5. Cross-Domain User Flow (Advanced)

```sql
-- Users who visited multiple Glamira domains
-- Requires user_id to be set consistently across domains
WITH domain_visits AS (
  SELECT
    user_id,
    REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'https?://([^/]+)'
    ) as domain,
    MIN(event_timestamp) as first_visit
  FROM `project.analytics_PROPERTY_ID.events_*`
  WHERE user_id IS NOT NULL
  AND _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  GROUP BY 1, 2
)
SELECT
  user_id,
  ARRAY_AGG(STRUCT(domain, first_visit) ORDER BY first_visit) as journey
FROM domain_visits
GROUP BY user_id
HAVING COUNT(DISTINCT domain) > 1
```

### 6. Hourly Traffic Patterns

```sql
-- Best hours for each domain
SELECT
  EXTRACT(HOUR FROM TIMESTAMP_MICROS(event_timestamp)) as hour_of_day,
  EXTRACT(DAYOFWEEK FROM TIMESTAMP_MICROS(event_timestamp)) as day_of_week,
  COUNT(DISTINCT CONCAT(user_pseudo_id,
    CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
  )) as sessions
FROM `project.analytics_PROPERTY_ID.events_*`
WHERE _TABLE_SUFFIX BETWEEN
  FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY 1, 2
ORDER BY sessions DESC
```

## Multi-Property Union Pattern

To query across all 70 properties, create a stored procedure or view that unions data:

```sql
-- Option 1: Wildcard tables (if all in same project)
-- Works when dataset names follow analytics_* pattern
SELECT * FROM `project.analytics_*.events_*`

-- Option 2: Parameterized view with property list
-- Better for controlled access
CREATE OR REPLACE VIEW `glamira_analytics.consolidated_events` AS
SELECT *, 'glamira.com' as domain FROM `project.analytics_111111.events_*`
UNION ALL
SELECT *, 'glamira.de' as domain FROM `project.analytics_222222.events_*`
UNION ALL
SELECT *, 'glamira.fr' as domain FROM `project.analytics_333333.events_*`
-- ... repeat for all 70 properties
```

## Cost Optimization

BigQuery charges per bytes scanned. Tips for 70 properties:
- Use `_TABLE_SUFFIX` filters to limit date range
- Select only needed columns (avoid `SELECT *`)
- Use materialized views for frequently-run queries
- Schedule daily aggregation jobs to pre-compute common metrics
- Partition consolidated tables by date
- Consider BigQuery BI Engine for sub-second dashboard queries
