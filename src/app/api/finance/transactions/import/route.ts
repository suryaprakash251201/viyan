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

function parseCsvRows(csvText: string): string[][] {
  return csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as { csvText?: string } | null;
  const csvText = payload?.csvText;

  if (!csvText) {
    return NextResponse.json({ error: "csvText is required" }, { status: 400 });
  }

  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must contain header and at least one row" }, { status: 400 });
  }

  const header = rows[0].map((cell) => cell.toLowerCase());
  const amountIndex = header.indexOf("amount");
  const typeIndex = header.indexOf("type");
  const categoryIndex = header.indexOf("category");
  const dateIndex = header.indexOf("date");
  const noteIndex = header.indexOf("note");

  if (amountIndex < 0 || typeIndex < 0 || categoryIndex < 0 || dateIndex < 0) {
    return NextResponse.json(
      { error: "CSV header must include amount,type,category,date columns" },
      { status: 400 }
    );
  }

  const validRows: Array<{
    userId: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    date: Date;
    note: string | null;
  }> = [];

  let skipped = 0;

  for (const row of rows.slice(1)) {
    const amount = Number(row[amountIndex]);
    const type = row[typeIndex]?.toUpperCase() as TransactionType;
    const category = row[categoryIndex]?.toUpperCase() as TransactionCategory;
    const date = new Date(row[dateIndex]);
    const note = noteIndex >= 0 ? row[noteIndex] || null : null;

    const invalid =
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !VALID_TYPES.has(type) ||
      !VALID_CATEGORIES.has(category) ||
      Number.isNaN(date.getTime());

    if (invalid) {
      skipped += 1;
      continue;
    }

    validRows.push({
      userId,
      amount,
      type,
      category,
      date,
      note,
    });
  }

  if (validRows.length === 0) {
    return NextResponse.json({ error: "No valid rows found", skipped }, { status: 400 });
  }

  await prisma.transaction.createMany({ data: validRows });

  return NextResponse.json({ imported: validRows.length, skipped });
}