"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  summary: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
}

const COLOR_CLASS_BY_ID: Record<string, string> = {
  "1": "bg-chart-1/20 text-chart-1",
  "2": "bg-chart-2/20 text-chart-2",
  "3": "bg-chart-3/20 text-chart-3",
  "4": "bg-chart-4/20 text-chart-4",
  "5": "bg-chart-5/20 text-chart-5",
};

function toDisplayDate(event: CalendarEvent): Date | null {
  const raw = event.start?.dateTime ?? event.start?.date;
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [creating, setCreating] = useState(false);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const first = toDisplayDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const second = toDisplayDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return first - second;
      }),
    [events]
  );

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch("/api/google/calendar/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load calendar events");
        }

        const payload = (await response.json()) as { events?: CalendarEvent[] };
        setEvents(payload.events ?? []);
      } catch {
        toast.error("Unable to load Google Calendar events.");
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, []);

  const onCreateEvent = async () => {
    if (!title.trim() || !startDateTime) {
      toast.error("Enter a title and date/time first.");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/google/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          startDateTime: new Date(startDateTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const payload = (await response.json()) as { event?: CalendarEvent };

      if (payload.event) {
        setEvents((previous) => [payload.event!, ...previous]);
      }

      setTitle("");
      setStartDateTime("");
      toast.success("Event created.");
    } catch {
      toast.error("Could not create event.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={title}
          placeholder="Quick event title"
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          type="datetime-local"
          value={startDateTime}
          onChange={(event) => setStartDateTime(event.target.value)}
        />
        <Button type="button" onClick={onCreateEvent} disabled={creating}>
          {creating ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
          Add
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-auto rounded-lg border border-border/70 bg-background/60 p-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : null}

        {!loading && sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events in the next 7 days.
          </p>
        ) : null}

        {!loading
          ? sortedEvents.map((event) => {
              const date = toDisplayDate(event);
              const badgeClass =
                COLOR_CLASS_BY_ID[event.colorId ?? ""] ?? "bg-muted text-foreground";

              return (
                <article
                  key={event.id}
                  className="rounded-md border border-border/60 bg-card p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium">{event.summary}</p>
                    <Badge className={badgeClass} variant="outline">
                      {event.colorId ? `C${event.colorId}` : "Default"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {date ? format(date, "EEE, MMM d · hh:mm a") : "Date unavailable"}
                  </p>
                </article>
              );
            })
          : null}
      </div>
    </div>
  );
}