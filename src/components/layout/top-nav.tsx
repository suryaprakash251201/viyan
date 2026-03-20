"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  LayoutDashboard,
  Landmark,
  Search,
  Settings,
  Sparkles,
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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          {mobileSidebar}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Viyan
            </span>
          </Link>
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
          {/* Search trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden sm:flex gap-2 text-muted-foreground h-8"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:flex">
              <span className="text-[9px]">⌘</span>K
            </kbd>
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
            <DropdownMenuTrigger className="relative h-8 w-8 rounded-full ring-2 ring-border/50 hover:ring-primary/30 transition-all bg-transparent border-none cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
