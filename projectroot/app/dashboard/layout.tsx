import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getDashboardData } from "@/lib/dashboard-data";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const data = await getDashboardData();

  return (
    <div className="page-shell relative">
      <div className="relative z-10 min-h-screen lg:flex">
        <DashboardSidebar
          demoMode={data.demoMode}
          profile={data.profile}
          viewerRole={data.viewer.role}
          licenseNumber={data.viewer.licenseNumber}
          licenseVerified={data.viewer.licenseVerified}
        />
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}