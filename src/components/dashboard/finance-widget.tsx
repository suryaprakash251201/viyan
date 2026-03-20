"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface TransactionItem {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
}

function monthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function FinanceWidget() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinance = async () => {
      try {
        const response = await fetch(`/api/finance/transactions?month=${monthKey()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load finance data");
        const payload = (await response.json()) as { transactions: TransactionItem[] };
        setTransactions(payload.transactions);
      } catch {
        // Silently fail for widget
      } finally {
        setLoading(false);
      }
    };
    void loadFinance();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2" role="status" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const savings = totalIncome - totalExpenses;

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No transactions"
        description="Add your first transaction"
        action={{
          label: "Log Transaction",
          onClick: () => window.location.href = "/finance",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="list" aria-label="Monthly summary">
      <div
        className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-3"
        role="listitem"
      >
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          <span className="text-base font-bold text-emerald-600">
            {formatINR(totalIncome)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Income</span>
      </div>
      <div
        className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-3"
        role="listitem"
      >
        <div className="flex items-center gap-1">
          <TrendingDown className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
          <span className="text-base font-bold text-rose-600">
            {formatINR(totalExpenses)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Expenses</span>
      </div>
      <div
        className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-3"
        role="listitem"
      >
        <div className="flex items-center gap-1">
          <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-base font-bold">{formatINR(savings)}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Savings</span>
      </div>
    </div>
  );
}