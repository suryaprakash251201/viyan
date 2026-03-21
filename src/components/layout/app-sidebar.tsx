"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  Compass,
  LayoutDashboard,
  Landmark,
  ListTodo,
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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Landmark },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/bookmarks", label: "Bookmarks", icon: Compass },
  { href: "/todos", label: "Todos", icon: ListTodo },
  { href: "/chat", label: "AI Chat", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  isMobile?: boolean;
}

function AppSidebar({ isMobile = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "z-40 flex flex-col border-r border-sidebar-border/80 bg-sidebar transition-all duration-300",
        isMobile ? "w-full h-full" : "sticky top-0 h-screen hidden md:flex",
        !isMobile && (collapsed ? "w-16" : "w-[232px]")
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/80 px-4">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="text-[33px] leading-none font-extrabold tracking-tight">Viyan</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">
            Main menu
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({
                variant: active ? "secondary" : "ghost",
                className: `w-full justify-start gap-3 h-11 text-[15px] rounded-xl ${
                  active
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:bg-muted"
                } ${collapsed ? "px-2" : "px-2.5"}`,
              })}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <div className="my-4 h-px bg-sidebar-border/80" />
      </nav>

      {/* Bottom: theme + user */}
      <div className={`mt-auto border-t border-sidebar-border/80 px-2 pb-4 pt-3 space-y-1 ${collapsed ? "items-center" : ""}`}>
        {/* Theme toggle */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setTheme(dark ? "light" : "dark")}
          className={`w-full justify-start gap-2.5 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted ${collapsed ? "px-2 justify-center" : "px-2.5"}`}
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
