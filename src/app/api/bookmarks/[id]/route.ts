import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return "";
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  const existing = await prisma.bookmark.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
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

  let normalizedUrl = payload?.url?.trim();

  if (normalizedUrl) {
    normalizedUrl = normalizeUrl(normalizedUrl);

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  }

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: {
      ...(typeof payload?.label === "string" ? { label: payload.label.trim() || "Untitled" } : {}),
      ...(normalizedUrl ? { url: normalizedUrl } : {}),
      ...(payload && "icon" in payload
        ? {
            icon: payload.icon?.trim() || (normalizedUrl ? getFaviconUrl(normalizedUrl) : null),
          }
        : {}),
      ...(typeof payload?.category === "string" ? { category: payload.category.trim() || "Misc" } : {}),
      ...(typeof payload?.order === "number" ? { order: payload.order } : {}),
    },
  });

  return NextResponse.json({ bookmark });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  const existing = await prisma.bookmark.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  await prisma.bookmark.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}