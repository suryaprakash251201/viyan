"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import type { DashboardLayouts } from "@/lib/dashboard-layout";

interface DashboardClientProps {
  initialLayouts: DashboardLayouts;
}

export function DashboardClient({ initialLayouts }: DashboardClientProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <TopNav 
          mobileSidebar={<MobileSidebar />}
        />
        <main className="flex-1">
          <DashboardGrid initialLayouts={initialLayouts} />
        </main>
      </div>
    </div>
  );
}
