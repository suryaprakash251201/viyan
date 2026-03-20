import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const existing = await prisma.note.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        title?: string;
        content?: unknown;
        tags?: unknown;
        pinned?: boolean;
      }
    | null;

  const contentUpdate =
    payload && "content" in payload
      ? {
          content:
            payload.content === null
              ? Prisma.JsonNull
              : (payload.content as Prisma.InputJsonValue),
        }
      : {};

  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(typeof payload?.title === "string" ? { title: payload.title.trim() || "Untitled note" } : {}),
      ...contentUpdate,
      ...(payload && "tags" in payload ? { tags: normalizeTags(payload.tags) } : {}),
      ...(typeof payload?.pinned === "boolean" ? { pinned: payload.pinned } : {}),
    },
  });

  return NextResponse.json({ note });
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

  const existing = await prisma.note.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({ ok: true });
}