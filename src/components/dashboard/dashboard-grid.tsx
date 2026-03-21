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

const FINANCE_STATS = [
  { label: "Balance", amount: "$ 32,900", growth: "3.5% this month", className: "finance-stat-a" },
  { label: "Spending", amount: "$ 8,430", growth: "74% from budget", className: "finance-stat-b" },
  { label: "Investment", amount: "$ 23,900", growth: "12.5% return", className: "finance-stat-c" },
];

const SPENDING_CARDS = [
  { name: "Home Rent", amount: "$1200" },
  { name: "Mobile Bill", amount: "$120" },
  { name: "Electric Bill", amount: "$220" },
  { name: "Internet", amount: "$89" },
  { name: "Fuel", amount: "$260" },
];

const TRANSACTIONS = [
  { name: "Royal Arkin", status: "In progress", date: "22 Jan, 2026", amount: "$12,334" },
  { name: "Saimon Tanvir", status: "Completed", date: "28 Dec, 2025", amount: "$20,334" },
  { name: "Washi Bin", status: "Completed", date: "12 Dec, 2025", amount: "$42,334" },
  { name: "Zulia Andre", status: "Completed", date: "12 Dec, 2025", amount: "$42,334" },
];

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
  onResetLayout,
}: {
  now: Date | null;
  userName: string;
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
              <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
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
          {FINANCE_STATS.map((card) => (
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

  useEffect(() => {
    setNow(new Date());
  }, []);

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
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-5 p-4 md:p-6">
      <DashboardHero
        now={now}
        userName={session?.user?.name ?? "there"}
        onResetLayout={resetLayout}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="finance-shell p-4 md:p-5">
            <h3 className="text-2xl font-semibold tracking-tight">Spending</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {SPENDING_CARDS.map((item, index) => (
                <div
                  key={item.name}
                  className={
                    index % 3 === 0
                      ? "finance-soft-card finance-stat-a p-3"
                      : index % 3 === 1
                        ? "finance-soft-card finance-stat-b p-3"
                        : "finance-soft-card finance-stat-c p-3"
                  }
                >
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="mt-1 text-lg font-semibold">{item.amount}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="finance-shell p-4 md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold tracking-tight">Transactions</h3>
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
                  {TRANSACTIONS.map((row) => (
                    <tr key={row.name} className="border-b border-border/50 last:border-none">
                      <td className="py-3 font-medium">{row.name}</td>
                      <td className="py-3">
                        <span
                          className={
                            row.status === "Completed"
                              ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{row.date}</td>
                      <td className="py-3 text-right font-semibold">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={containerRef} className="finance-shell p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-2xl font-semibold tracking-tight">Workspace Widgets</h3>
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
              <div className="finance-soft-card p-3">
                <p className="text-sm font-medium">Shopping</p>
                <p className="text-xs text-muted-foreground">West Mart Complex</p>
                <p className="mt-1 text-right text-sm font-semibold">- $1,000</p>
              </div>
              <div className="finance-soft-card p-3">
                <p className="text-sm font-medium">Apple Payment</p>
                <p className="text-xs text-muted-foreground">Payment Received</p>
                <p className="mt-1 text-right text-sm font-semibold text-emerald-700">+ $3,000</p>
              </div>
              <div className="finance-soft-card p-3">
                <p className="text-sm font-medium">Credit Card Bill</p>
                <p className="text-xs text-muted-foreground">Monthly payment</p>
                <p className="mt-1 text-right text-sm font-semibold">- $1,000</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
