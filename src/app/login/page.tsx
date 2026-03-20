"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getSafeCallbackUrl(value: string | null): string {
  if (!value) {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default function LoginPage() {
  const [callbackUrl] = useState(() => {
    if (typeof window === "undefined") {
      return "/dashboard";
    }

    const params = new URLSearchParams(window.location.search);
    return getSafeCallbackUrl(params.get("callbackUrl"));
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Gradient background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-chart-1/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-3/5 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-1 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">V</span>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Viyan
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Your personal dashboard for productivity, finance, and daily tools.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            onClick={() => signIn("google", { callbackUrl })}
            variant="outline"
            className="h-12 w-full gap-3 text-base font-medium transition-all hover:bg-accent hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              What you&apos;ll get access to:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-1" />
                Dashboard with drag-and-drop widgets
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-2" />
                Google Calendar & Tasks integration
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-3" />
                Rich-text notes with TipTap editor
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-4" />
                Finance tracker with charts & budgets
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-5" />
                Quick links & bookmarks manager
              </li>
            </ul>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            100% self-hosted · Your data stays on your server
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
