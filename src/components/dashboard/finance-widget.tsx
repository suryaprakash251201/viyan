import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { WidgetSkeleton } from "./widget-skeleton";

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
    return <WidgetSkeleton />;
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const savings = totalIncome - totalExpenses;
  
  const expensePercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

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
    <div className="flex h-full flex-col gap-3">
      {/* Summary grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-background/60 p-2.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(totalIncome)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Income</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-background/60 p-2.5">
          <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
            {formatINR(totalExpenses)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Expenses</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-bold text-primary">
            {formatINR(savings)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Savings</span>
        </div>
      </div>

      {/* Spending progress */}
      <div className="space-y-1.5 px-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-medium">Budget Usage</span>
          <span className={expensePercentage > 90 ? "text-rose-500 font-bold" : "text-muted-foreground"}>
            {Math.round(expensePercentage)}%
          </span>
        </div>
        <Progress 
          value={Math.min(expensePercentage, 100)} 
          className="h-1.5"
          // In shadcn, we might need a custom class for color if not default
        />
      </div>

      {/* Recent transactions */}
      <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/60 p-2">
        <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Recent Activity
        </div>
        <ul className="space-y-1.5">
          {recentTransactions.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded-lg border border-border/40 bg-card px-2 py-1.5 transition-all hover:border-border/80"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                t.type === "INCOME" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
              }`}>
                {t.type === "INCOME" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium">{t.category}</p>
                <p className="text-[9px] text-muted-foreground">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
              </div>
              <span className={`text-[11px] font-bold ${
                t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
              }`}>
                {t.type === "INCOME" ? "+" : "-"}{formatINR(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}