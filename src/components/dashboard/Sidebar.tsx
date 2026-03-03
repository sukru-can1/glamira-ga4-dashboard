"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Overview", icon: "◉" },
  { href: "/dashboard/traffic", label: "Traffic", icon: "↗" },
  { href: "/dashboard/ecommerce", label: "E-commerce", icon: "$" },
  { href: "/dashboard/seo", label: "SEO", icon: "◎" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "▶" },
  { href: "/dashboard/audience", label: "Audience", icon: "♟" },
  { href: "/dashboard/devices", label: "Devices", icon: "▢" },
  { href: "/dashboard/geography", label: "Geography", icon: "◈" },
  { href: "/dashboard/compare", label: "Compare", icon: "⇄" },
  { href: "/dashboard/reports", label: "Reports", icon: "☰" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <Link href="/dashboard/overview" className="text-sm font-bold text-gray-900">GA4 Dashboard</Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${active ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 px-4 py-3">
        <Link href="/properties" className="text-xs text-gray-400 hover:text-gray-600">← Properties</Link>
      </div>
    </aside>
  );
}
