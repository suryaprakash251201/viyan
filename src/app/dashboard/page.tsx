import { auth } from "@/lib/auth";
import {
  DEFAULT_DASHBOARD_LAYOUTS,
  isValidDashboardLayouts,
} from "@/lib/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const savedLayout = await prisma.dashboardLayout.findUnique({
    where: { userId },
    select: {
      layout: true,
    },
  });

  const persistedLayout = savedLayout?.layout;

  const initialLayouts = persistedLayout && isValidDashboardLayouts(persistedLayout)
    ? persistedLayout
    : DEFAULT_DASHBOARD_LAYOUTS;

  return (
    <DashboardClient initialLayouts={initialLayouts} />
  );
}
