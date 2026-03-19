import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim().toLowerCase() ?? "";
  const onlyPinned = searchParams.get("pinned") === "true";

  const notes = await prisma.note.findMany({
    where: {
      userId,
      ...(onlyPinned ? { pinned: true } : {}),
    },
    orderBy: [
      {
        pinned: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  const filtered = query
    ? notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const tagsMatch = note.tags.some((tag) => tag.toLowerCase().includes(query));
        const contentMatch = JSON.stringify(note.content).toLowerCase().includes(query);

        return titleMatch || tagsMatch || contentMatch;
      })
    : notes;

  return NextResponse.json({ notes: filtered });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
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
  const content = payload?.content ?? {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
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

  return NextResponse.json({ note }, { status: 201 });
}