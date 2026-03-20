"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Responsive } from "react-grid-layout";
import { LayoutGrid, Moon, Sun } from "lucide-react";
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
    href: "/dashboard",
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Google Tasks checklist grouped by task list.",
    href: "/dashboard",
  },
  {
    id: "notes",
    title: "Notes",
    description: "Capture ideas with rich text and tags.",
    href: "/notes",
  },
  {
    id: "finance",
    title: "Finance",
    description: "Track income, expenses, and budget progress.",
    href: "/finance",
  },
  {
    id: "bookmarks",
    title: "Bookmarks",
    description: "Fast launchpad for your most used links.",
    href: "/bookmarks",
  },
];

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
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
      <header className="rounded-xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Personal Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Drag your workflow into place
            </h1>
          </div>
          <ThemeToggleButton />
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

          return (
            <div key={id}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{widget.title}</CardTitle>
                      <CardDescription>{widget.description}</CardDescription>
                    </div>
                    <button
                      type="button"
                      className="widget-drag-handle inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-border/70 text-muted-foreground active:cursor-grabbing"
                      aria-label={`Drag ${widget.title} widget`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex h-[calc(100%-6.5rem)] flex-col justify-between gap-3">
                  {widget.id === "calendar" ? <CalendarWidget /> : null}
                  {widget.id === "tasks" ? <TasksWidget /> : null}
                  {widget.id !== "calendar" && widget.id !== "tasks" ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Module implementation is next. This card is already
                        movable and resizable, and its position is saved to your
                        account.
                      </p>
                      <Link
                        href={widget.href}
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
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