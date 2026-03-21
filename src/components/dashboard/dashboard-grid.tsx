"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Bookmark,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type DashboardLayouts,
} from "@/lib/dashboard-layout";
import { NotesWidget } from "@/components/dashboard/notes-widget";
import { BookmarksWidget } from "@/components/dashboard/bookmarks-widget";
import { ErrorBoundary } from "@/components/error-boundary";

interface DashboardGridProps {
  initialLayouts: DashboardLayouts;
  visibleWidgets?: string[];
}

interface WidgetMeta {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  tone: string;
  iconTone: string;
  accent: string;
}

const WIDGETS: WidgetMeta[] = [
  {
    id: "notes",
    title: "Pinned Notes",
    description: "Your pinned notes appear first.",
    icon: Sparkles,
    href: "/notes",
    tone: "from-amber-500/8 via-transparent to-transparent",
    iconTone: "text-amber-500 dark:text-amber-400",
    accent: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  {
    id: "bookmarks",
    title: "Bookmarks",
    description: "Quick access to your saved links.",
    icon: Bookmark,
    href: "/bookmarks",
    tone: "from-indigo-500/8 via-transparent to-transparent",
    iconTone: "text-indigo-500 dark:text-indigo-400",
    accent: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  },
];

type TransactionType = "INCOME" | "EXPENSE";
type TransactionCategory =
  | "FOOD"
  | "RENT"
  | "TRANSPORT"
  | "SAAS_SUBSCRIPTIONS"
  | "SALARY"
  | "FREELANCE"
  | "MISC";

interface FinanceTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  note: string | null;
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  FOOD: "Food",
  RENT: "Rent",
  TRANSPORT: "Transport",
  SAAS_SUBSCRIPTIONS: "SaaS",
  SALARY: "Salary",
  FREELANCE: "Freelance",
  MISC: "Misc",
};

function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const QUICK_SEND = ["AD", "DD", "WS", "SP", "RM"];

function getGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) return "Up late?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function DashboardHero({
  now,
  userName,
  financeStats,
}: {
  now: Date | null;
  userName: string;
  financeStats: Array<{ label: string; amount: string; growth: string; className: string }>;
}) {
  const greeting = now ? getGreeting(now) : "Welcome back";
  const dateStr = now ? format(now, "EEEE, MMMM d, yyyy") : "Today";

  return (
    <div className="finance-shell p-4 md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-[42px] md:leading-none">Dashboard</h2>
              <p className="text-sm text-muted-foreground">{greeting}, {userName}. {dateStr}</p>
            </div>
          </div>

          <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
            Fixed Widgets
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {financeStats.map((card) => (
            <div key={card.label} className={`finance-soft-card ${card.className} p-4`}>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{card.amount}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.growth}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface WidgetCardProps {
  widget: WidgetMeta;
  children?: React.ReactNode;
  stats?: React.ReactNode;
}

function WidgetCard({ widget, children, stats }: WidgetCardProps) {
  const Icon = widget.icon;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    toast.success(`${widget.title} refreshed`);
  };

  return (
    <Card className="dashboard-widget group relative h-full overflow-hidden border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Top gradient overlay */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${widget.tone}`} />

      {/* Header */}
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background ${widget.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{widget.description}</CardDescription>
            </div>
          </div>

          {/* Widget actions */}
          <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label={`Refresh ${widget.title}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            {widget.href !== "/dashboard" && (
              <Link href={widget.href}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Open ${widget.title}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}

            <Link href={widget.href}>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Manage ${widget.title}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="mt-2 flex items-center gap-2">
            {stats}
          </div>
        )}
      </CardHeader>

      <CardContent className="relative flex flex-col gap-3 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

export function DashboardGrid({ initialLayouts, visibleWidgets }: DashboardGridProps) {
  void initialLayouts;
  void visibleWidgets;
  const { data: session } = useSession();
  const [now, setNow] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [financeLoading, setFinanceLoading] = useState(true);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const currentMonth = useMemo(() => format(now ?? new Date(), "yyyy-MM"), [now]);

  useEffect(() => {
    const loadTransactions = async () => {
      setFinanceLoading(true);
      try {
        const response = await fetch(`/api/finance/transactions?month=${currentMonth}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load finance transactions");
        }

        const payload = (await response.json()) as { transactions: FinanceTransaction[] };
        setTransactions(payload.transactions);
      } catch {
        toast.error("Could not load finance activity");
      } finally {
        setFinanceLoading(false);
      }
    };

    void loadTransactions();
  }, [currentMonth]);

  const financeSummary = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const balance = income - expense;
    const savingsRate = income > 0 ? ((balance / income) * 100) : 0;
    return { income, expense, balance, savingsRate };
  }, [transactions]);

  const financeStats = useMemo(
    () => [
      {
        label: "Balance",
        amount: formatINR(financeSummary.balance),
        growth: `${financeSummary.savingsRate.toFixed(1)}% savings rate`,
        className: "finance-stat-a",
      },
      {
        label: "Spending",
        amount: formatINR(financeSummary.expense),
        growth: `${transactions.filter((transaction) => transaction.type === "EXPENSE").length} expense entries`,
        className: "finance-stat-b",
      },
      {
        label: "Income",
        amount: formatINR(financeSummary.income),
        growth: `${transactions.filter((transaction) => transaction.type === "INCOME").length} income entries`,
        className: "finance-stat-c",
      },
    ],
    [financeSummary, transactions]
  );

  const spendByCategory = useMemo(() => {
    const map = new Map<TransactionCategory, number>();

    for (const transaction of transactions) {
      if (transaction.type !== "EXPENSE") continue;
      map.set(transaction.category, (map.get(transaction.category) ?? 0) + transaction.amount);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount], index) => ({
        name: CATEGORY_LABELS[category],
        amount,
        className:
          index % 3 === 0
            ? "finance-soft-card finance-stat-a p-3"
            : index % 3 === 1
              ? "finance-soft-card finance-stat-b p-3"
              : "finance-soft-card finance-stat-c p-3",
      }));
  }, [transactions]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4),
    [transactions]
  );

  const recentActivity = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3),
    [transactions]
  );

  const fixedWidgets = WIDGETS;

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-5 px-4 pb-6 pt-5 md:px-6 md:pb-8 md:pt-7">
      <DashboardHero
        now={now}
        userName={session?.user?.name ?? "there"}
        financeStats={financeStats}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="finance-shell p-4 md:p-5">
            <h3 className="text-[28px] font-semibold tracking-tight leading-none">Spending</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {financeLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="finance-soft-card bg-muted/60 p-3">
                    <p className="h-4 w-20 rounded bg-muted" />
                    <p className="mt-2 h-5 w-24 rounded bg-muted" />
                  </div>
                ))
              ) : spendByCategory.length > 0 ? (
                spendByCategory.map((item) => (
                  <div key={item.name} className={item.className}>
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                    <p className="mt-1 text-lg font-semibold">{formatINR(item.amount)}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-sm text-muted-foreground">
                  No expense transactions yet for this month.
                </p>
              )}
            </div>
          </div>

          <div className="finance-shell p-4 md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[28px] font-semibold tracking-tight leading-none">Transactions</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/70 px-3 py-1">Newest</span>
                <span className="rounded-full px-3 py-1">Oldest</span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-none">
                      <td className="py-3 font-medium">{row.note || CATEGORY_LABELS[row.category]}</td>
                      <td className="py-3">
                        <span
                          className={
                            row.type === "INCOME"
                              ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
                          }
                        >
                          {row.type === "INCOME" ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className={`py-3 text-right font-semibold ${row.type === "INCOME" ? "text-emerald-700" : ""}`}>
                        {row.type === "INCOME" ? "+ " : "- "}
                        {formatINR(row.amount)}
                      </td>
                    </tr>
                  ))}
                  {!financeLoading && recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        No transactions found for this month.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="finance-shell p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-[28px] font-semibold tracking-tight leading-none">Workspace Widgets</h3>
              <p className="text-xs text-muted-foreground">Fixed layout: pinned notes, then bookmarks</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {fixedWidgets.map((widget) => (
                <div key={widget.id} className="min-w-0">
                  <WidgetCard widget={widget}>
                    <ErrorBoundary>
                      {widget.id === "notes" ? <NotesWidget pinnedOnly /> : <BookmarksWidget />}
                    </ErrorBoundary>
                  </WidgetCard>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="finance-shell h-fit p-4 md:p-5">
          <div className="flex items-center gap-3 border-b border-border/70 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {session?.user?.name?.slice(0, 2).toUpperCase() ?? "AI"}
            </div>
            <div>
              <p className="font-semibold">{session?.user?.name ?? "Account"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email ?? "Personal dashboard"}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold">Send again</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_SEND.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="h-9 w-9 rounded-full border border-border/80 bg-background text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-border/70 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Recent Activity</p>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="finance-soft-card p-3">
                  <p className="text-sm font-medium">{CATEGORY_LABELS[item.category]}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.note || new Date(item.date).toLocaleDateString("en-IN")}
                  </p>
                  <p className={`mt-1 text-right text-sm font-semibold ${item.type === "INCOME" ? "text-emerald-700" : ""}`}>
                    {item.type === "INCOME" ? "+ " : "- "}
                    {formatINR(item.amount)}
                  </p>
                </div>
              ))}
              {!financeLoading && recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent finance activity yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
