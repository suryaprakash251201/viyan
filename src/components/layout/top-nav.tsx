"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Compass,
  LayoutDashboard,
  Landmark,
  Mail,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Landmark },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/bookmarks", label: "Bookmarks", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface TopNavProps {
  mobileSidebar?: React.ReactNode;
}

function TopNav({ mobileSidebar }: TopNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          {mobileSidebar}
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "sm",
                  className: `gap-2 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`,
                })}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
            className="text-muted-foreground"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Messages"
          >
            <Mail className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label="Toggle theme"
            className="text-muted-foreground"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-2 py-1 transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="hidden text-xs font-medium text-foreground sm:block">
                {session?.user?.name ?? "User"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name ?? "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/settings" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Nav - only show if no mobileSidebar (fallback) */}
      {!mobileSidebar && (
        <div className="flex md:hidden items-center justify-between px-4 pb-2 gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "icon-xs",
                  className: active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                })}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

export { TopNav };
