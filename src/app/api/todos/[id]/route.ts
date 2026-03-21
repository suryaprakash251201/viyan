import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, notFound, successResponse, unauthorized } from "@/lib/api-utils";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized();
  }

  const { id } = await params;

  const existing = await prisma.todo.findFirst({ where: { id, userId } });
  if (!existing) {
    return notFound("Todo not found");
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        title?: string;
        description?: string;
        completed?: boolean;
        priority?: number;
        dueDate?: string | null;
      }
    | null;

  if (!payload) {
    return errorResponse("Invalid JSON payload", 400);
  }

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(typeof payload.title === "string" ? { title: payload.title.trim() || existing.title } : {}),
      ...(typeof payload.description === "string"
        ? { description: payload.description.trim() || null }
        : {}),
      ...(typeof payload.completed === "boolean" ? { completed: payload.completed } : {}),
      ...(payload.priority !== undefined ? { priority: parsePriority(payload.priority) } : {}),
      ...(payload.dueDate === null
        ? { dueDate: null }
        : payload.dueDate !== undefined
          ? { dueDate: parseDate(payload.dueDate) }
          : {}),
    },
  });

  return successResponse({ todo });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized();
  }

  const { id } = await params;

  const existing = await prisma.todo.findFirst({ where: { id, userId } });
  if (!existing) {
    return notFound("Todo not found");
  }

  await prisma.todo.delete({ where: { id } });

  return successResponse({ ok: true });
}
