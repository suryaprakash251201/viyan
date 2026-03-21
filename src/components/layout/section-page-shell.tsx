import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { TopNav } from "./top-nav";
import { MobileSidebar } from "./mobile-sidebar";

interface SectionPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SectionPageShell({ title, description, children }: SectionPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <TopNav 
          mobileSidebar={<MobileSidebar />}
        />
        
        <main className="flex-1 bg-gradient-to-b from-background via-background to-muted/35 pb-10">
          <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
            <header className="rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Viyan
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </div>
              </div>
            </header>

            {children}
          </section>
        </main>
      </div>
    </div>
  );
}