"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Responsive } from "react-grid-layout";
import {
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Landmark,
  LayoutGrid,
  Moon,
  NotebookPen,
  Sun,
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

const WIDGETS = [
  {
    id: "calendar",
    title: "Calendar",
    description: "Upcoming 7-day schedule and quick event actions.",
    icon: CalendarClock,
    href: "/dashboard",
    tone: "from-sky-500/15 via-transparent to-transparent",
    iconTone: "text-sky-600 dark:text-sky-300",
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Google Tasks checklist grouped by task list.",
    icon: CheckCircle2,
    href: "/dashboard",
    tone: "from-emerald-500/15 via-transparent to-transparent",
    iconTone: "text-emerald-600 dark:text-emerald-300",
  },
  {
    id: "notes",
    title: "Notes",
    description: "Capture ideas with rich text and tags.",
    icon: NotebookPen,
    href: "/notes",
    tone: "from-amber-500/15 via-transparent to-transparent",
    iconTone: "text-amber-600 dark:text-amber-300",
  },
  {
    id: "finance",
    title: "Finance",
    description: "Track income, expenses, and budget progress.",
    icon: Landmark,
    href: "/finance",
    tone: "from-fuchsia-500/15 via-transparent to-transparent",
    iconTone: "text-fuchsia-600 dark:text-fuchsia-300",
  },
  {
    id: "bookmarks",
    title: "Bookmarks",
    description: "Fast launchpad for your most used links.",
    icon: Bookmark,
    href: "/bookmarks",
    tone: "from-indigo-500/15 via-transparent to-transparent",
    iconTone: "text-indigo-600 dark:text-indigo-300",
  },
];

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="rounded-full"
    >
      {dark ? <Sun /> : <Moon />}
      {dark ? "Light" : "Dark"} mode
    </Button>
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
    if (!container) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(container.clientWidth || 1200);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const persistLayout = useCallback((nextLayouts: DashboardLayouts) => {
    const serialized = JSON.stringify(nextLayouts);
    if (serialized === lastSavedRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/dashboard/layout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ layout: nextLayouts }),
        });

        if (!response.ok) {
          throw new Error("Failed to save dashboard layout");
        }

        lastSavedRef.current = serialized;
      } catch {
        toast.error("Could not save layout. Changes are local until retry.");
      }
    }, 450);
  }, []);

  return (
    <section
      ref={containerRef}
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6"
    >
      <header className="dashboard-hero rounded-3xl border border-border/60 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Personal Dashboard
            </p>
            <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Drag your workflow into place
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Rearrange modules like a studio board. Your layout is auto-saved to
              your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              Live sync on
            </span>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      <Responsive
        className="layout"
        breakpoints={DASHBOARD_BREAKPOINTS}
        cols={DASHBOARD_COLS}
        layouts={layouts}
        width={containerWidth}
        rowHeight={24}
        onLayoutChange={(_, allLayouts) => {
          const nextLayouts = allLayouts as DashboardLayouts;
          setLayouts(nextLayouts);
          persistLayout(nextLayouts);
        }}
      >
        {Object.keys(widgetById).map((id) => {
          const widget = widgetById[id];
          const Icon = widget.icon;

          return (
            <div key={id} className="pb-1">
              <Card className="dashboard-widget relative h-full overflow-hidden border-border/70 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${widget.tone}`}
                />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Widget
                      </p>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Icon className={`h-5 w-5 ${widget.iconTone}`} />
                        {widget.title}
                      </CardTitle>
                      <CardDescription>{widget.description}</CardDescription>
                    </div>
                    <button
                      type="button"
                      className="widget-drag-handle inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground transition hover:text-foreground active:cursor-grabbing"
                      aria-label={`Drag ${widget.title} widget`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="relative flex h-[calc(100%-7rem)] flex-col justify-between gap-3">
                  {widget.id === "calendar" ? <CalendarWidget /> : null}
                  {widget.id === "tasks" ? <TasksWidget /> : null}
                  {widget.id !== "calendar" && widget.id !== "tasks" ? (
                    <>
                      <p className="rounded-lg border border-dashed border-border/80 bg-background/70 p-3 text-sm text-muted-foreground">
                        Module implementation is next. This card is already
                        movable and resizable, and its position is saved to your
                        account.
                      </p>
                      <Link
                        href={widget.href}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                          className: "w-full rounded-full",
                        })}
                      >
                        Open module
                      </Link>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </Responsive>
    </section>
  );
}