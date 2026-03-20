"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import type { DashboardLayouts } from "@/lib/dashboard-layout";

interface DashboardClientProps {
  initialLayouts: DashboardLayouts;
}

const ALL_WIDGET_IDS = ["calendar", "tasks", "notes", "finance", "bookmarks"];

export function DashboardClient({ initialLayouts }: DashboardClientProps) {
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(ALL_WIDGET_IDS);

  const handleToggleWidget = (id: string) => {
    setVisibleWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <AppSidebar
        visibleWidgets={visibleWidgets}
        onToggleWidget={handleToggleWidget}
      />
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <TopNav 
          mobileSidebar={
            <MobileSidebar 
              visibleWidgets={visibleWidgets} 
              onToggleWidget={handleToggleWidget} 
            />
          }
        />
        <main className="flex-1">
          <DashboardGrid
            initialLayouts={initialLayouts}
            visibleWidgets={visibleWidgets}
          />
        </main>
      </div>
    </div>
  );
}
