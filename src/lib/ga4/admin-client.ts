import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { getAuthenticatedOAuth2Client } from "../auth-helpers";
import type { GA4Property } from "./types";

/**
 * Lists all GA4 properties the authenticated user has access to.
 * Uses the Admin API's listAccountSummaries which returns all accounts
 * and their properties in a single paginated call.
 */
export async function listAllProperties(): Promise<GA4Property[]> {
  const authClient = await getAuthenticatedOAuth2Client();

  const client = new AnalyticsAdminServiceClient({
    authClient: authClient as never,
  });

  const properties: GA4Property[] = [];

  const iterable = client.listAccountSummariesAsync({});

  for await (const account of iterable) {
    const accountId = account.account?.replace("accounts/", "") ?? "";
    const accountName = account.displayName ?? "";

    for (const propertySummary of account.propertySummaries ?? []) {
      const propertyId =
        propertySummary.property?.replace("properties/", "") ?? "";

      properties.push({
        propertyId,
        displayName: propertySummary.displayName ?? "",
        accountId,
        accountName,
      });
    }
  }

  return properties;
}
