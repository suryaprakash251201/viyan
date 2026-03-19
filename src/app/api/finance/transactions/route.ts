import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, TransactionCategory, TransactionType } from "@prisma/client";

const VALID_TYPES = new Set<TransactionType>(["INCOME", "EXPENSE"]);
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

function getMonthRange(month: string | null): { gte: Date; lt: Date } | null {
  if (!month) {
    return null;
  }

  const parsed = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const next = new Date(parsed);
  next.setUTCMonth(next.getUTCMonth() + 1);

  return { gte: parsed, lt: next };
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const range = getMonthRange(month);

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(range
      ? {
          date: {
            gte: range.gte,
            lt: range.lt,
          },
        }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json({
    transactions: transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
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
    | {
        amount?: number;
        type?: TransactionType;
        category?: TransactionCategory;
        date?: string;
        note?: string;
      }
    | null;

  const amount = Number(payload?.amount);
  const type = payload?.type;
  const category = payload?.category;
  const date = payload?.date ? new Date(payload.date) : new Date();
  const note = payload?.note?.trim() || null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount,
      type,
      category,
      date,
      note,
    },
  });

  return NextResponse.json(
    {
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    },
    { status: 201 }
  );
}