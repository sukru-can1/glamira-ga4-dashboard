import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth/SignInButton";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard/overview");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          GA4 Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Multi-domain analytics dashboard for 70 Glamira properties.
          Sign in with your Google account to access GA4 data.
        </p>
        <div className="mt-6">
          <SignInButton />
        </div>
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h2 className="text-sm font-medium text-gray-700">What you get:</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-500">
            <li>Auto-discover all GA4 properties</li>
            <li>Run traffic, e-commerce, and event reports</li>
            <li>Audit property data quality</li>
            <li>BigQuery integration for historical analysis</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
