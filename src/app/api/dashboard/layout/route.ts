import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidDashboardLayouts } from "@/lib/dashboard-layout";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const layout = payload?.layout;

  if (!isValidDashboardLayouts(layout)) {
    return NextResponse.json({ error: "Invalid layout payload" }, { status: 400 });
  }

  const layoutJson = layout as unknown as Prisma.InputJsonValue;

  await prisma.dashboardLayout.upsert({
    where: { userId },
    create: {
      userId,
      layout: layoutJson,
    },
    update: {
      layout: layoutJson,
    },
  });

  return NextResponse.json({ ok: true });
}