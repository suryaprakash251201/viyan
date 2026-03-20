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
  CheckSquare,
  Clock,
  Ellipsis,
  ExternalLink,
  LayoutGrid,
  Landmark,
  Loader2,
  MoreHorizontal,
  NotebookPen,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
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
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface DashboardGridProps {
  initialLayouts: DashboardLayouts;
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function DashboardHero() {
  const today = new Date();
  const dateStr = format(today, "EEEE, MMMM d, yyyy");

  return (
    <div className="dashboard-hero rounded-3xl border border-border/50 p-5 md:p-7 relative overflow-hidden">
      {/* Background accent orbs */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-chart-3/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Personal Dashboard
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
            {getGreeting()}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {dateStr}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-2.5 backdrop-blur-sm">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Live sync</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </div>
          <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card/70 px-4 py-2.5 backdrop-blur-sm">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Drag to arrange</span>
          </div>
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
  const [menuOpen, setMenuOpen] = useState(false);

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

export function DashboardGrid({ initialLayouts }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
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

  return (
    <section
      ref={containerRef}
      className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-6"
    >
      <DashboardHero />

      <Responsive
        className="layout"
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
        {Object.keys(widgetById).map((id) => {
          const widget = widgetById[id];

          return (
            <div key={id} className="pb-1">
              {id === "calendar" || id === "tasks" ? (
                <WidgetCard widget={widget}>
                  {id === "calendar" ? <CalendarWidget /> : <TasksWidget />}
                </WidgetCard>
              ) : (
                <WidgetCard widget={widget}>
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-background/50 p-6 text-center min-h-32">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-sm ${widget.accent}`}>
                      <widget.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Coming soon</p>
                      <p className="text-xs text-muted-foreground">
                        This module is ready for you.
                      </p>
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
                </WidgetCard>
              )}
            </div>
          );
        })}
      </Responsive>
    </section>
  );
}
