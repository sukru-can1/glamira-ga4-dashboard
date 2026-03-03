import { OAuth2Client } from "google-auth-library";
import { auth } from "./auth";

/**
 * Creates an authenticated OAuth2Client using the current user's access token.
 * This bridges NextAuth sessions with Google's gRPC-based API clients
 * (BetaAnalyticsDataClient, AnalyticsAdminServiceClient, BigQuery).
 *
 * Pass the returned client as `authClient` to any Google API client constructor.
 */
export async function getAuthenticatedOAuth2Client(): Promise<OAuth2Client> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error("Not authenticated — no access token available");
  }

  if (session.error === "RefreshTokenError") {
    throw new Error("Session expired — please sign in again");
  }

  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  return oauth2Client;
}
