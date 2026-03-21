"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Responsive } from "react-grid-layout";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Landmark,
  MoreHorizontal,
  NotebookPen,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_COLS,
  DEFAULT_DASHBOARD_LAYOUTS,
  type DashboardLayouts,
} from "@/lib/dashboard-layout";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { NotesWidget } from "@/components/dashboard/notes-widget";
import { FinanceWidget } from "@/components/dashboard/finance-widget";
import { BookmarksWidget } from "@/components/dashboard/bookmarks-widget";
import { ErrorBoundary } from "@/components/error-boundary";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

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
    id: "calendar",
    title: "Calendar",
    description: "Your upcoming schedule at a glance.",
    icon: CalendarClock,
    href: "/dashboard",
    tone: "from-sky-500/15 via-transparent to-transparent",
    iconTone: "text-sky-500 dark:text-sky-400",
    accent: "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Stay on top of your to-dos.",
    icon: CheckCircle2,
    href: "/dashboard",
    tone: "from-emerald-500/15 via-transparent to-transparent",
    iconTone: "text-emerald-500 dark:text-emerald-400",
    accent: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "notes",
    title: "Notes",
    description: "Quick access to your notes.",
    icon: NotebookPen,
    href: "/notes",
    tone: "from-amber-500/15 via-transparent to-transparent",
    iconTone: "text-amber-500 dark:text-amber-400",
    accent: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  {
    id: "finance",
    title: "Finance",
    description: "Track spending and budgets.",
    icon: Landmark,
    href: "/finance",
    tone: "from-fuchsia-500/15 via-transparent to-transparent",
    iconTone: "text-fuchsia-500 dark:text-fuchsia-400",
    accent: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    id: "bookmarks",
    title: "Bookmarks",
    description: "Your most-used links, one click away.",
    icon: Bookmark,
    href: "/bookmarks",
    tone: "from-indigo-500/15 via-transparent to-transparent",
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
  onResetLayout,
}: {
  now: Date | null;
  userName: string;
  financeStats: Array<{ label: string; amount: string; growth: string; className: string }>;
  onResetLayout: () => void;
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

          <Button
            type="button"
            variant="outline"
            onClick={onResetLayout}
            className="h-9 gap-1.5 rounded-full border-border/70 px-4 text-xs font-semibold uppercase"
          >
            <RefreshCw className="h-3 w-3" />
            Reset Layout
          </Button>
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
    <Card className="dashboard-widget group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      {/* Top gradient overlay */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${widget.tone}`} />

      {/* Header */}
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-sm ${widget.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{widget.description}</CardDescription>
            </div>
          </div>

          {/* Widget actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <CardContent className="relative flex flex-col gap-3">
        {children}
      </CardContent>
    </Card>
  );
}

export function DashboardGrid({ initialLayouts, visibleWidgets }: DashboardGridProps) {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
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

  const [layouts, setLayouts] = useState<DashboardLayouts>(
    Object.keys(initialLayouts).length > 0
      ? initialLayouts
      : DEFAULT_DASHBOARD_LAYOUTS
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(layouts));

  const widgetById = useMemo(
    () => Object.fromEntries(WIDGETS.map((widget) => [widget.id, widget])),
    []
  );

  const activeWidgetIds = useMemo(
    () => visibleWidgets ?? WIDGETS.map((w) => w.id),
    [visibleWidgets]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.clientWidth || 1200);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const persistLayout = useCallback((nextLayouts: DashboardLayouts) => {
    const serialized = JSON.stringify(nextLayouts);
    if (serialized === lastSavedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/dashboard/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: nextLayouts }),
        });

        if (!response.ok) throw new Error("Failed to save layout");
        lastSavedRef.current = serialized;
      } catch {
        toast.error("Could not save layout. Changes are local.");
      }
    }, 450);
  }, []);

  const resetLayout = useCallback(() => {
    setLayouts(DEFAULT_DASHBOARD_LAYOUTS);
    persistLayout(DEFAULT_DASHBOARD_LAYOUTS);
    toast.success("Dashboard layout reset to default.");
  }, [persistLayout]);

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-5 px-4 pb-6 pt-5 md:px-6 md:pb-8 md:pt-7">
      <DashboardHero
        now={now}
        userName={session?.user?.name ?? "there"}
        financeStats={financeStats}
        onResetLayout={resetLayout}
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

          <div ref={containerRef} className="finance-shell p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-[28px] font-semibold tracking-tight leading-none">Workspace Widgets</h3>
              <p className="text-xs text-muted-foreground">Drag and rearrange these modules</p>
            </div>

            <Responsive
              className="layout min-w-0"
              breakpoints={DASHBOARD_BREAKPOINTS}
              cols={DASHBOARD_COLS}
              layouts={layouts}
              width={containerWidth}
              rowHeight={20}
              onLayoutChange={(_, allLayouts) => {
                const nextLayouts = allLayouts as DashboardLayouts;
                setLayouts(nextLayouts);
                persistLayout(nextLayouts);
              }}
            >
              {activeWidgetIds.map((id) => {
                const widget = widgetById[id];
                if (!widget) return null;

                const renderWidget = () => {
                  switch (id) {
                    case "calendar":
                      return <CalendarWidget />;
                    case "tasks":
                      return <TasksWidget />;
                    case "notes":
                      return <NotesWidget />;
                    case "finance":
                      return <FinanceWidget />;
                    case "bookmarks":
                      return <BookmarksWidget />;
                    default:
                      return (
                        <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-background/50 p-6 text-center">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-sm ${widget.accent}`}>
                            <widget.icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Coming soon</p>
                            <p className="text-xs text-muted-foreground">This module is ready for you.</p>
                          </div>
                          <Link
                            href={widget.href}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "gap-1.5 rounded-full",
                            })}
                          >
                            Open {widget.title}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      );
                  }
                };

                return (
                  <div key={id} className="min-w-0 pb-1">
                    <WidgetCard widget={widget}>
                      <ErrorBoundary>{renderWidget()}</ErrorBoundary>
                    </WidgetCard>
                  </div>
                );
              })}
            </Responsive>
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
