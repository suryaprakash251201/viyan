import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unauthorized, successResponse } from "@/lib/api-utils";

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const onlyPinned = searchParams.get("pinned") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build where clause for database-level filtering
  const where: Prisma.NoteWhereInput = {
    userId,
    ...(onlyPinned ? { pinned: true } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ],
        }
      : {}),
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.note.count({ where }),
  ]);

  return successResponse({
    notes,
    pagination: {
      total,
      limit,
      offset,
      hasMore: notes.length === limit,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        title?: string;
        content?: unknown;
        tags?: unknown;
        pinned?: boolean;
      }
    | null;

  const title = payload?.title?.trim() || "Untitled note";
  const content =
    payload?.content === null
      ? Prisma.JsonNull
      : ((payload?.content ?? {
          type: "doc",
          content: [{ type: "paragraph" }],
        }) as Prisma.InputJsonValue);
  const tags = normalizeTags(payload?.tags);
  const pinned = payload?.pinned === true;

  const note = await prisma.note.create({
    data: {
      userId,
      title,
      content,
      tags,
      pinned,
    },
  });

  return successResponse({ note }, 201);
}