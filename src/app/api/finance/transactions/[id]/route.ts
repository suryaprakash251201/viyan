import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TransactionCategory, TransactionType } from "@prisma/client";

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

  const current = await prisma.transaction.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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

  const nextAmount = payload?.amount;
  const nextType = payload?.type;
  const nextCategory = payload?.category;
  const nextDate = payload?.date;

  if (nextType && !VALID_TYPES.has(nextType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (nextCategory && !VALID_CATEGORIES.has(nextCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (typeof nextAmount === "number" && (!Number.isFinite(nextAmount) || nextAmount <= 0)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (nextDate) {
    const parsed = new Date(nextDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(typeof nextAmount === "number" ? { amount: nextAmount } : {}),
      ...(nextType ? { type: nextType } : {}),
      ...(nextCategory ? { category: nextCategory } : {}),
      ...(nextDate ? { date: new Date(nextDate) } : {}),
      ...(payload && "note" in payload ? { note: payload.note?.trim() || null } : {}),
    },
  });

  return NextResponse.json({
    transaction: {
      ...transaction,
      amount: Number(transaction.amount),
    },
  });
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

  const current = await prisma.transaction.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}