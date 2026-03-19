"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Upload, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type TransactionType = "INCOME" | "EXPENSE";
type TransactionCategory =
  | "FOOD"
  | "RENT"
  | "TRANSPORT"
  | "SAAS_SUBSCRIPTIONS"
  | "SALARY"
  | "FREELANCE"
  | "MISC";

type TransactionItem = {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  note: string | null;
};

type BudgetItem = {
  id: string;
  category: TransactionCategory;
  limit: number;
  month: string;
};

const CATEGORY_OPTIONS: Array<{ value: TransactionCategory; label: string }> = [
  { value: "FOOD", label: "Food" },
  { value: "RENT", label: "Rent" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SAAS_SUBSCRIPTIONS", label: "SaaS/Subscriptions" },
  { value: "SALARY", label: "Salary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "MISC", label: "Misc" },
];

function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function monthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function FinanceTracker() {
  const [activeMonth, setActiveMonth] = useState(monthKey());
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState<TransactionCategory>("FOOD");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>("FOOD");
  const [budgetLimit, setBudgetLimit] = useState("");

  const [csvText, setCsvText] = useState("amount,type,category,date,note\n");

  const loadFinanceData = async (month: string) => {
    setLoading(true);
    try {
      const [transactionsResponse, budgetsResponse] = await Promise.all([
        fetch(`/api/finance/transactions?month=${month}`, { cache: "no-store" }),
        fetch(`/api/finance/budgets?month=${month}`, { cache: "no-store" }),
      ]);

      if (!transactionsResponse.ok || !budgetsResponse.ok) {
        throw new Error("Failed to load finance data");
      }

      const transactionsPayload = (await transactionsResponse.json()) as {
        transactions: TransactionItem[];
      };
      const budgetsPayload = (await budgetsResponse.json()) as { budgets: BudgetItem[] };

      setTransactions(transactionsPayload.transactions);
      setBudgets(budgetsPayload.budgets);
    } catch {
      toast.error("Unable to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFinanceData(activeMonth);
  }, [activeMonth]);

  const kpis = useMemo(() => {
    const totalIncome = transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpenses = transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, savings, savingsRate };
  }, [transactions]);

  const categoryBarData = useMemo(() => {
    const byCategory = new Map<TransactionCategory, number>();
    transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .forEach((transaction) => {
        byCategory.set(transaction.category, (byCategory.get(transaction.category) ?? 0) + transaction.amount);
      });

    return CATEGORY_OPTIONS.map((entry) => ({
      category: entry.label,
      value: byCategory.get(entry.value) ?? 0,
    }));
  }, [transactions]);

  const balanceLineData = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let running = 0;

    return sorted.map((transaction) => {
      running += transaction.type === "INCOME" ? transaction.amount : -transaction.amount;
      return {
        date: new Date(transaction.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        balance: running,
      };
    });
  }, [transactions]);

  const budgetProgressData = useMemo(() => {
    const spentByCategory = new Map<TransactionCategory, number>();
    transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .forEach((transaction) => {
        spentByCategory.set(
          transaction.category,
          (spentByCategory.get(transaction.category) ?? 0) + transaction.amount
        );
      });

    return budgets.map((budget) => {
      const spent = spentByCategory.get(budget.category) ?? 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        ...budget,
        spent,
        percentage,
      };
    });
  }, [transactions, budgets]);

  const onAddTransaction = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSavingTransaction(true);
    try {
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          type,
          category,
          date: new Date(`${date}T00:00:00`).toISOString(),
          note,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      const payload = (await response.json()) as { transaction: TransactionItem };
      setTransactions((previous) => [payload.transaction, ...previous]);
      setAmount("");
      setNote("");
      toast.success("Transaction added");
    } catch {
      toast.error("Could not add transaction");
    } finally {
      setSavingTransaction(false);
    }
  };

  const onDeleteTransaction = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      setTransactions((previous) => previous.filter((transaction) => transaction.id !== id));
      toast.success("Transaction deleted");
    } catch {
      toast.error("Could not delete transaction");
    } finally {
      setDeletingId(null);
    }
  };

  const onSetBudget = async () => {
    const parsed = Number(budgetLimit);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a valid budget limit");
      return;
    }

    setSavingBudget(true);
    try {
      const response = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: budgetCategory,
          limit: parsed,
          month: activeMonth,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save budget");
      }

      const payload = (await response.json()) as { budget: BudgetItem };
      setBudgets((previous) => {
        const exists = previous.some((budget) => budget.category === payload.budget.category);
        if (exists) {
          return previous.map((budget) =>
            budget.category === payload.budget.category ? payload.budget : budget
          );
        }
        return [...previous, payload.budget];
      });
      setBudgetLimit("");
      toast.success("Budget saved");
    } catch {
      toast.error("Could not save budget");
    } finally {
      setSavingBudget(false);
    }
  };

  const onImportCsv = async () => {
    setImportingCsv(true);
    try {
      const response = await fetch("/api/finance/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });

      const payload = (await response.json()) as { imported?: number; skipped?: number; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to import CSV");
      }

      toast.success(`Imported ${payload.imported ?? 0} rows (skipped ${payload.skipped ?? 0})`);
      await loadFinanceData(activeMonth);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import CSV";
      toast.error(message);
    } finally {
      setImportingCsv(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Finance Tracker
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Income, expenses, budgets, and trends</h1>
        </div>
        <Input
          type="month"
          value={activeMonth}
          onChange={(event) => setActiveMonth(event.target.value)}
          className="w-44"
        />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Income</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-emerald-600">
            {formatINR(kpis.totalIncome)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-rose-600">
            {formatINR(kpis.totalExpenses)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Savings</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatINR(kpis.savings)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{kpis.savingsRate.toFixed(1)}%</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                <Tooltip formatter={(value: number) => formatINR(value)} />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceLineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                <Tooltip formatter={(value: number) => formatINR(value)} />
                <Line type="monotone" dataKey="balance" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Transaction Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-6">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Amount"
              />
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={type}
                onChange={(event) => setType(event.target.value as TransactionType)}
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value as TransactionCategory)}
              >
                {CATEGORY_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note" />
              <Button type="button" onClick={onAddTransaction} disabled={savingTransaction}>
                {savingTransaction ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>

            <div className="max-h-80 overflow-auto rounded-lg border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2">Note</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-border/60">
                      <td className="px-2 py-2">
                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-2 py-2">{transaction.type === "INCOME" ? "Income" : "Expense"}</td>
                      <td className="px-2 py-2">
                        {CATEGORY_OPTIONS.find((entry) => entry.value === transaction.category)?.label}
                      </td>
                      <td className={`px-2 py-2 font-medium ${transaction.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatINR(transaction.amount)}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{transaction.note ?? "-"}</td>
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          disabled={deletingId === transaction.id}
                          onClick={() => void onDeleteTransaction(transaction.id)}
                        >
                          {deletingId === transaction.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!loading && transactions.length === 0 ? (
                    <tr>
                      <td className="px-2 py-3 text-muted-foreground" colSpan={6}>
                        No transactions in this month.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budgets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={budgetCategory}
                onChange={(event) => setBudgetCategory(event.target.value as TransactionCategory)}
              >
                {CATEGORY_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={budgetLimit}
                onChange={(event) => setBudgetLimit(event.target.value)}
                placeholder="Limit"
              />
              <Button type="button" onClick={onSetBudget} disabled={savingBudget}>
                {savingBudget ? <Loader2 className="animate-spin" /> : null}
                Set
              </Button>
            </div>

            <div className="space-y-3">
              {budgetProgressData.map((budget) => (
                <Progress
                  key={budget.id}
                  value={Math.min(100, budget.percentage)}
                  className="rounded-lg border border-border/60 p-2"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <ProgressLabel>
                      {CATEGORY_OPTIONS.find((entry) => entry.value === budget.category)?.label}
                    </ProgressLabel>
                    <ProgressValue>
                      {formatINR(budget.spent)} / {formatINR(budget.limit)}
                    </ProgressValue>
                  </div>
                </Progress>
              ))}
              {!loading && budgetProgressData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No budgets set for this month.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Required headers: amount,type,category,date,note
          </p>
          <Textarea
            className="min-h-32"
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
          />
          <Button type="button" onClick={onImportCsv} disabled={importingCsv}>
            {importingCsv ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
            Import CSV
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}