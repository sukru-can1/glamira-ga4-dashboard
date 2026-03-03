# GA4 Data API v1 — Complete Dimensions & Metrics Reference

Source: [Google Analytics API Schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)

## Dimensions

### Traffic Source
| API Name | Description |
|---|---|
| `source` | Traffic source (google, facebook, direct) |
| `medium` | Traffic medium (organic, cpc, referral, email) |
| `sourceMedium` | Combined source/medium |
| `defaultChannelGroup` | Default channel grouping (Organic Search, Paid Search, etc.) |
| `primaryChannelGroup` | Primary channel group |
| `sessionSource` | Session-level source |
| `sessionMedium` | Session-level medium |
| `sessionCampaignName` | Campaign name for the session |
| `sessionCampaignId` | Campaign ID for the session |
| `sessionDefaultChannelGroup` | Session-level channel group |
| `firstUserSource` | First touch source |
| `firstUserMedium` | First touch medium |
| `firstUserCampaignName` | First touch campaign |
| `manualSource` | UTM source parameter |
| `manualMedium` | UTM medium parameter |
| `manualCampaignName` | UTM campaign parameter |
| `manualAdContent` | UTM content parameter |

### Google Ads
| API Name | Description |
|---|---|
| `googleAdsCampaignId` | Google Ads campaign ID |
| `googleAdsCampaignName` | Google Ads campaign name |
| `googleAdsAdGroupId` | Ad group ID |
| `googleAdsAdGroupName` | Ad group name |
| `googleAdsCreativeId` | Creative ID |
| `googleAdsKeyword` | Keyword text |
| `googleAdsQuery` | Search query |
| `googleAdsAccountName` | Google Ads account name |
| `googleAdsAdNetworkType` | Network type (Search, Display, etc.) |

### Page & Content
| API Name | Description |
|---|---|
| `pagePath` | Page path (/products/ring) |
| `pageTitle` | Page title |
| `pageLocation` | Full URL |
| `pagePathPlusQueryString` | Path with query string |
| `pageReferrer` | Referring page URL |
| `landingPage` | Session landing page |
| `landingPagePlusQueryString` | Landing page with query |
| `hostName` | Domain hostname |
| `fullPageUrl` | Complete page URL |
| `contentGroup` | Content grouping |
| `contentId` | Content identifier |
| `contentType` | Content type |
| `searchTerm` | Site search term |

### User & Audience
| API Name | Description |
|---|---|
| `newVsReturning` | New or returning user |
| `audienceId` | Audience segment ID |
| `audienceName` | Audience segment name |
| `firstSessionDate` | First visit date |
| `userAgeBracket` | Age bracket (requires Google Signals) |
| `userGender` | Gender (requires Google Signals) |
| `brandingInterest` | Interest category |

### Geography
| API Name | Description |
|---|---|
| `country` | Country name |
| `countryId` | ISO country code |
| `region` | State/region |
| `city` | City name |
| `cityId` | City ID |
| `continent` | Continent name |
| `continentId` | Continent ID |

### Device & Technology
| API Name | Description |
|---|---|
| `deviceCategory` | desktop, mobile, tablet |
| `deviceModel` | Device model name |
| `mobileDeviceBranding` | Device brand (Apple, Samsung) |
| `mobileDeviceMarketingName` | Marketing name (iPhone 15) |
| `operatingSystem` | OS name |
| `operatingSystemVersion` | OS version |
| `browser` | Browser name |
| `screenResolution` | Screen resolution |
| `platform` | Web or app |
| `language` | Language setting |
| `languageCode` | ISO language code |

### Date & Time
| API Name | Description |
|---|---|
| `date` | YYYYMMDD format |
| `dateHour` | YYYYMMDDHH |
| `dateHourMinute` | YYYYMMDDHHmm |
| `day` | Day of month (01-31) |
| `dayOfWeek` | Day number (0=Sunday) |
| `dayOfWeekName` | Day name |
| `hour` | Hour (00-23) |
| `month` | Month (01-12) |
| `week` | Week of year |
| `year` | Year |
| `isoWeek` | ISO week number |
| `isoYear` | ISO year |
| `isoYearIsoWeek` | ISO year + week |
| `nthDay` | Nth day in date range |
| `nthMonth` | Nth month in date range |
| `nthWeek` | Nth week in date range |
| `nthYear` | Nth year in date range |

### E-commerce
| API Name | Description |
|---|---|
| `itemId` | Product/item ID |
| `itemName` | Product name |
| `itemBrand` | Product brand |
| `itemVariant` | Product variant |
| `itemCategory` | Product category (level 1) |
| `itemCategory2` | Category level 2 |
| `itemCategory3` | Category level 3 |
| `itemCategory4` | Category level 4 |
| `itemCategory5` | Category level 5 |
| `itemAffiliation` | Store or affiliation |
| `itemListId` | Product list ID |
| `itemListName` | Product list name |
| `itemListPosition` | Position in list |
| `itemPromotionId` | Promotion ID |
| `itemPromotionName` | Promotion name |
| `itemPromotionCreativeName` | Promotion creative |
| `orderCoupon` | Order-level coupon |
| `shippingTier` | Shipping method |
| `transactionId` | Transaction ID |
| `currencyCode` | Transaction currency |

### Event
| API Name | Description |
|---|---|
| `eventName` | Event name (page_view, purchase, etc.) |
| `isKeyEvent` | Whether event is marked as key event |

### Link
| API Name | Description |
|---|---|
| `linkUrl` | Outbound link URL |
| `linkDomain` | Outbound link domain |
| `linkText` | Link text |
| `linkClasses` | CSS classes on link |
| `outbound` | Whether link is outbound |
| `fileExtension` | Downloaded file extension |
| `fileName` | Downloaded file name |

---

## Metrics

### Users
| API Name | Description |
|---|---|
| `activeUsers` | Active users in period |
| `newUsers` | First-time users |
| `totalUsers` | Total unique users |
| `returningUsers` | Returning users |
| `dauPerMau` | Daily active / monthly active ratio |
| `dauPerWau` | Daily active / weekly active ratio |
| `wauPerMau` | Weekly active / monthly active ratio |

### Sessions
| API Name | Description |
|---|---|
| `sessions` | Total sessions |
| `engagedSessions` | Sessions > 10s or with conversion |
| `sessionsPerUser` | Sessions per user |
| `engagementRate` | Engaged sessions / total sessions |
| `bounceRate` | Non-engaged sessions / total sessions |

### Engagement
| API Name | Description |
|---|---|
| `averageSessionDuration` | Avg session length (seconds) |
| `userEngagementDuration` | Total engagement time |
| `screenPageViews` | Total page/screen views |
| `screenPageViewsPerSession` | Page views per session |
| `screenPageViewsPerUser` | Page views per user |
| `eventCount` | Total event count |
| `eventCountPerUser` | Events per user |
| `scrolledUsers` | Users who scrolled 90%+ |

### E-commerce Revenue
| API Name | Description |
|---|---|
| `totalRevenue` | Total revenue (all sources) |
| `purchaseRevenue` | Purchase-only revenue |
| `ecommercePurchases` | Number of purchases |
| `transactions` | Transaction count |
| `totalPurchasers` | Users who purchased |
| `firstTimePurchasers` | First-time buyers |
| `averagePurchaseRevenue` | Avg revenue per transaction |
| `averagePurchaseRevenuePerPayingUser` | ARPPU |
| `averagePurchaseRevenuePerUser` | ARPU |
| `purchaserConversionRate` | % users who purchased |
| `totalItemQuantity` | Items sold |
| `itemRevenue` | Item-level revenue |
| `itemsViewed` | Items viewed |
| `itemsAddedToCart` | Items added to cart |
| `itemsCheckedOut` | Items in checkout |
| `itemsPurchased` | Items purchased |
| `cartToViewRate` | Add-to-cart / view rate |
| `purchaseToViewRate` | Purchase / view rate |

### Conversions
| API Name | Description |
|---|---|
| `conversions` | Key event completions |
| `keyEvents` | Key events count |
| `sessionKeyEventRate` | Sessions with key event % |
| `userKeyEventRate` | Users with key event % |

### Advertising (Revenue)
| API Name | Description |
|---|---|
| `totalAdRevenue` | Ad revenue |
| `publisherAdImpressions` | Ad impressions |
| `publisherAdClicks` | Ad clicks |

### Google Ads
| API Name | Description |
|---|---|
| `advertiserAdClicks` | Google Ads clicks |
| `advertiserAdCost` | Google Ads cost |
| `advertiserAdCostPerClick` | CPC |
| `advertiserAdCostPerKeyEvent` | Cost per conversion |
| `advertiserAdImpressions` | Impressions |
| `returnOnAdSpend` | ROAS |

---

## Dimension-Metric Compatibility Notes

Not all dimensions work with all metrics. Key restrictions:
- Item-scoped dimensions (itemName, itemCategory) only work with item-scoped metrics (itemRevenue, itemsPurchased)
- User-scoped dimensions (audienceName) only work with user-scoped metrics
- Google Ads dimensions require linked Google Ads account
- Some demographics (age, gender) require Google Signals to be enabled
- Real-time API has its own subset of dimensions/metrics (see GA4 docs)
