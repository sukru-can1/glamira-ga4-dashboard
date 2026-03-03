import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayout";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
