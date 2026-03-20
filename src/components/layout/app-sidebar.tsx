"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  LayoutDashboard,
  Landmark,
  List,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Landmark },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/bookmarks", label: "Bookmarks", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings },
];

const WIDGET_MENU_ITEMS = [
  { id: "calendar", label: "Calendar" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "finance", label: "Finance" },
  { id: "bookmarks", label: "Bookmarks" },
];

interface AppSidebarProps {
  visibleWidgets: string[];
  onToggleWidget: (id: string) => void;
  isMobile?: boolean;
}

function AppSidebar({ visibleWidgets, onToggleWidget, isMobile = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [collapsed, setCollapsed] = useState(false);
  const [widgetsOpen, setWidgetsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "z-40 flex flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-all duration-300",
        isMobile ? "w-full h-full" : "sticky top-0 h-screen hidden md:flex",
        !isMobile && (collapsed ? "w-16" : "w-56")
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-3">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight">Viyan</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/25">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </Link>
        )}
        {!isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({
                variant: active ? "secondary" : "ghost",
                className: `w-full justify-start gap-2.5 h-9 text-sm ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                } ${collapsed ? "px-2" : "px-2.5"}`,
              })}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3 h-px bg-border/60" />

        {/* Widgets 3-dot menu section */}
        <div className={collapsed ? "px-1" : ""}>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setWidgetsOpen(!widgetsOpen)}
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <List className="h-3.5 w-3.5" />
                Widgets
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  widgetsOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
          )}

          {widgetsOpen && !collapsed && (
            <div className="mt-1 space-y-0.5">
              {WIDGET_MENU_ITEMS.map((widget) => {
                const isVisible = visibleWidgets.includes(widget.id);
                return (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => onToggleWidget(widget.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      isVisible
                        ? "text-foreground bg-muted/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        isVisible ? "bg-primary" : "bg-border"
                      }`}
                    />
                    <span>{widget.label}</span>
                    {isVisible && (
                      <span className="ml-auto text-[10px] font-medium text-primary">
                        Visible
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3-dot menu for widgets (collapsed state) */}
          {collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center justify-center py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30">
                <List className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Toggle Widgets
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WIDGET_MENU_ITEMS.map((widget) => {
                  const isVisible = visibleWidgets.includes(widget.id);
                  return (
                    <DropdownMenuItem
                      key={widget.id}
                      onClick={() => onToggleWidget(widget.id)}
                      className="flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span>{widget.label}</span>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isVisible ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {/* Bottom: theme + user */}
      <div className={`border-t border-border/60 px-2 py-3 space-y-1 ${collapsed ? "items-center" : ""}`}>
        {/* Theme toggle */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setTheme(dark ? "light" : "dark")}
          className={`w-full justify-start gap-2.5 h-9 text-sm text-muted-foreground hover:text-foreground ${collapsed ? "px-2 justify-center" : "px-2.5"}`}
          title={collapsed ? (dark ? "Light mode" : "Dark mode") : undefined}
        >
          {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{dark ? "Light mode" : "Dark mode"}</span>}
        </Button>

        {/* User */}
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-none">
                {session?.user?.name ?? "User"}
              </p>
              <p className="truncate text-[10px] text-muted-foreground leading-none mt-0.5">
                {session?.user?.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export { AppSidebar };
