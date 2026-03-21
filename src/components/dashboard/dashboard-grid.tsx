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
  Clock,
  ExternalLink,
  Landmark,
  MoreHorizontal,
  NotebookPen,
  RefreshCw,
  Sparkles,
} from "lucide-react";
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

function getGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) return "Up late?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

type ThemePreset = "default" | "ocean" | "forest" | "sunset";

const themePresets: Record<ThemePreset, { label: string; className: string }> = {
  default: { label: "Energize", className: "theme-energize" },
  ocean: { label: "Ocean", className: "theme-ocean" },
  forest: { label: "Forest", className: "theme-forest" },
  sunset: { label: "Sunset", className: "theme-sunset" },
};

function DashboardHero({
  preset,
  now,
  onPresetChange,
  onResetLayout,
}: {
  preset: ThemePreset;
  now: Date | null;
  onPresetChange: (preset: ThemePreset) => void;
  onResetLayout: () => void;
}) {
  const greeting = now ? getGreeting(now) : "Welcome back";
  const dateStr = now ? format(now, "EEEE, MMMM d, yyyy") : "Today";

  return (
    <div
      className={`dashboard-hero relative overflow-hidden rounded-2xl border border-border/50 p-4 md:p-6 ${themePresets[preset].className}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-chart-3/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              {greeting}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dateStr}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onResetLayout}
            className="h-7 gap-1.5 rounded-full border-border/50 text-[10px] font-semibold uppercase"
          >
            <RefreshCw className="h-3 w-3" />
            Reset Layout
          </Button>

          <div className="flex items-center gap-1 rounded-full border border-border/40 bg-background/40 p-1 backdrop-blur-sm">
            {Object.entries(themePresets).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => onPresetChange(key as ThemePreset)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                  preset === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [themePreset, setThemePreset] = useState<ThemePreset>("default");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("dashboard-theme-preset") as ThemePreset | null;
    if (stored && themePresets[stored]) {
      setThemePreset(stored);
    }
  }, []);

  const changeThemePreset = (preset: ThemePreset) => {
    setThemePreset(preset);
    window.localStorage.setItem("dashboard-theme-preset", preset);
  };

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
    <section
      ref={containerRef}
      className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-6"
    >
      <DashboardHero
        preset={themePreset}
        now={now}
        onPresetChange={changeThemePreset}
        onResetLayout={resetLayout}
      />

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
    </section>
  );
}
