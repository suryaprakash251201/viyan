import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TransactionCategory } from "@prisma/client";

const VALID_CATEGORIES = new Set<TransactionCategory>([
  "FOOD",
  "RENT",
  "TRANSPORT",
  "SAAS_SUBSCRIPTIONS",
  "SALARY",
  "FREELANCE",
  "MISC",
]);

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getMonthStart(month: string | null): Date {
  if (month) {
    const parsed = new Date(`${month}-01T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const monthStart = getMonthStart(searchParams.get("month"));

  const budgets = await prisma.budgetLimit.findMany({
    where: {
      userId,
      month: monthStart,
    },
    orderBy: {
      category: "asc",
    },
  });

  return NextResponse.json({
    budgets: budgets.map((budget) => ({
      ...budget,
      limit: Number(budget.limit),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | { category?: TransactionCategory; limit?: number; month?: string }
    | null;

  const category = payload?.category;
  const limit = Number(payload?.limit);
  const monthStart = getMonthStart(payload?.month ?? null);

  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!Number.isFinite(limit) || limit < 0) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  const budget = await prisma.budgetLimit.upsert({
    where: {
      userId_category_month: {
        userId,
        category,
        month: monthStart,
      },
    },
    create: {
      userId,
      category,
      month: monthStart,
      limit,
    },
    update: {
      limit,
    },
  });

  return NextResponse.json({
    budget: {
      ...budget,
      limit: Number(budget.limit),
    },
  });
}