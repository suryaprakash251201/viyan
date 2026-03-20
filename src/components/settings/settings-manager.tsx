"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signIn, signOut } from "next-auth/react";
import { Loader2, LogOut, RefreshCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GOOGLE_OAUTH_SCOPE } from "@/lib/constants";

type ThemeMode = "dark" | "light";

interface UserSettingsPayload {
  settings: {
    theme: ThemeMode;
    currency: string;
    timezone: string;
  };
}

const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"];
const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "UTC",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "Asia/Singapore",
];

export function SettingsManager() {
  const { setTheme } = useTheme();

  const [theme, setThemeValue] = useState<ThemeMode>("dark");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load settings");
        }

        const payload = (await response.json()) as UserSettingsPayload;

        setThemeValue(payload.settings.theme);
        setCurrency(payload.settings.currency);
        setTimezone(payload.settings.timezone);
        setTheme(payload.settings.theme);
      } catch {
        toast.error("Unable to load settings");
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [setTheme]);

  const onSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme, currency, timezone }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setTheme(theme);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const onReauthorizeScopes = async () => {
    await signIn("google", {
      callbackUrl: "/settings",
      prompt: "consent",
      scope: GOOGLE_OAUTH_SCOPE,
    });
  };

  const onClearData = async () => {
    const confirmed = window.confirm(
      "This will permanently clear notes, finance data, bookmarks, and layout. Continue?"
    );

    if (!confirmed) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch("/api/settings/clear-data", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear data");
      }

      toast.success("All dashboard data cleared");
    } catch {
      toast.error("Could not clear data");
    } finally {
      setClearing(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
    setLoggingOut(false);
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <header className="rounded-xl border border-border/70 bg-card/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Preferences and account controls</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance & Localization</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={theme}
              disabled={loading}
              onChange={(event) => setThemeValue(event.target.value as ThemeMode)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Currency</span>
            <Input
              list="currency-options"
              value={currency}
              disabled={loading}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            />
            <datalist id="currency-options">
              {CURRENCY_OPTIONS.map((entry) => (
                <option key={entry} value={entry} />
              ))}
            </datalist>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Timezone</span>
            <Input
              list="timezone-options"
              value={timezone}
              disabled={loading}
              onChange={(event) => setTimezone(event.target.value)}
            />
            <datalist id="timezone-options">
              {TIMEZONE_OPTIONS.map((entry) => (
                <option key={entry} value={entry} />
              ))}
            </datalist>
          </label>

          <div className="md:col-span-3 flex justify-end">
            <Button type="button" onClick={onSave} disabled={saving || loading}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Google OAuth Scopes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Re-authorize if you changed required Google scopes.
          </p>
          <Button type="button" variant="outline" onClick={() => void onReauthorizeScopes()}>
            <RefreshCcw className="h-4 w-4" />
            Re-authorize Google Access
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" />
              Clear all user data (notes, finances, bookmarks, layout)
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void onClearData()}
              disabled={clearing}
            >
              {clearing ? <Loader2 className="animate-spin" /> : null}
              Clear Data
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => void onLogout()} disabled={loggingOut}>
              {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut className="h-4 w-4" />}
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}