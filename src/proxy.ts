export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/properties/:path*",
    "/settings/:path*",
    "/api/ga4/:path*",
    "/api/bigquery/:path*",
  ],
};
