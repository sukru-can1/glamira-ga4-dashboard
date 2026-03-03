import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/bigquery.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, persist tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // If token hasn't expired, return as-is
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Token expired — attempt refresh
      if (token.refreshToken) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.AUTH_GOOGLE_ID!,
              client_secret: process.env.AUTH_GOOGLE_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken,
            }),
          });

          const refreshed = await response.json();

          if (!response.ok) throw refreshed;

          token.accessToken = refreshed.access_token;
          token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
          // Google may rotate refresh tokens
          if (refreshed.refresh_token) {
            token.refreshToken = refreshed.refresh_token;
          }
          token.error = undefined;
        } catch {
          token.error = "RefreshTokenError";
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
});
