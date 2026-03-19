import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_THEMES = new Set(["dark", "light"]);

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      theme: "dark",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
    update: {},
  });

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        theme?: string;
        currency?: string;
        timezone?: string;
      }
    | null;

  const nextTheme = payload?.theme?.trim();
  const nextCurrency = payload?.currency?.trim();
  const nextTimezone = payload?.timezone?.trim();

  if (nextTheme && !ALLOWED_THEMES.has(nextTheme)) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      theme: nextTheme ?? "dark",
      currency: nextCurrency || "INR",
      timezone: nextTimezone || "Asia/Kolkata",
    },
    update: {
      ...(nextTheme ? { theme: nextTheme } : {}),
      ...(nextCurrency ? { currency: nextCurrency } : {}),
      ...(nextTimezone ? { timezone: nextTimezone } : {}),
    },
  });

  return NextResponse.json({ settings });
}