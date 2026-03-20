import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeUrl(url: string): string {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return normalized;
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return "";
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        label?: string;
        url?: string;
        icon?: string;
        category?: string;
        order?: number;
      }
    | null;

  const label = payload?.label?.trim();
  const url = payload?.url?.trim();
  const icon = payload?.icon?.trim() || null;
  const category = payload?.category?.trim() || "Misc";

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const normalizedUrl = normalizeUrl(url);

  try {
    new URL(normalizedUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const existingCount = await prisma.bookmark.count({
    where: { userId, category },
  });

  const iconUrl = icon || getFaviconUrl(normalizedUrl) || null;

  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      label,
      url: normalizedUrl,
      icon: iconUrl,
      category,
      order: typeof payload?.order === "number" ? payload.order : existingCount,
    },
  });

  return NextResponse.json({ bookmark }, { status: 201 });
}