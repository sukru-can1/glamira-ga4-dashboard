export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/properties/:path*",
    "/settings/:path*",
    "/api/ga4/:path*",
    "/api/bigquery/:path*",
  ],
};
