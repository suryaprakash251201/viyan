import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse, unauthorized } from "@/lib/api-utils";

function parsePriority(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 2;
  return Math.min(3, Math.max(1, Math.trunc(parsed)));
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const completedFilter = searchParams.get("completed");

  const where: Prisma.TodoWhereInput = {
    userId,
    ...(completedFilter === "true" ? { completed: true } : {}),
    ...(completedFilter === "false" ? { completed: false } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const todos = await prisma.todo.findMany({
    where,
    orderBy: [{ completed: "asc" }, { priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return successResponse({ todos });
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
        description?: string;
        priority?: number;
        dueDate?: string;
      }
    | null;

  const title = payload?.title?.trim();

  if (!title) {
    return errorResponse("Title is required", 400);
  }

  const todo = await prisma.todo.create({
    data: {
      userId,
      title,
      description: payload?.description?.trim() || null,
      priority: parsePriority(payload?.priority),
      dueDate: parseDate(payload?.dueDate),
    },
  });

  return successResponse({ todo }, 201);
}
