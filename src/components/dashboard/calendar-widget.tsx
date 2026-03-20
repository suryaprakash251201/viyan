"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { CalendarPlus, CalendarX, ChevronRight, Clock, Loader2 } from "lucide-react";
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

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  "1": { bg: "bg-chart-1/10", border: "border-chart-1/30", text: "text-chart-1" },
  "2": { bg: "bg-chart-2/10", border: "border-chart-2/30", text: "text-chart-2" },
  "3": { bg: "bg-chart-3/10", border: "border-chart-3/30", text: "text-chart-3" },
  "4": { bg: "bg-chart-4/10", border: "border-chart-4/30", text: "text-chart-4" },
  "5": { bg: "bg-chart-5/10", border: "border-chart-5/30", text: "text-chart-5" },
};

function toDisplayDate(event: CalendarEvent): Date | null {
  const raw = event.start?.dateTime ?? event.start?.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDayBadge(date: Date): string | null {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return null;
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

        if (!response.ok) throw new Error("Failed to load calendar events");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startDateTime: new Date(startDateTime).toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create event");

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

  const upcomingCount = sortedEvents.length;
  const todayCount = sortedEvents.filter((e) => {
    const d = toDisplayDate(e);
    return d && isToday(d);
  }).length;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Quick add form */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={title}
          placeholder="Event title"
          onChange={(event) => setTitle(event.target.value)}
          className="h-8 text-xs"
        />
        <Input
          type="datetime-local"
          value={startDateTime}
          onChange={(event) => setStartDateTime(event.target.value)}
          className="h-8 w-auto text-xs"
        />
        <Button
          type="button"
          size="sm"
          onClick={onCreateEvent}
          disabled={creating}
          className="h-8 gap-1.5 rounded-xl px-3"
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CalendarPlus className="h-3.5 w-3.5" />
          )}
          Add
        </Button>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/60">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events...
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CalendarX className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No events in the next 7 days.</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Summary bar */}
            <div className="flex items-center justify-between rounded-lg bg-card px-3 py-1.5 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {todayCount > 0 ? `${todayCount} today` : "No events today"}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {upcomingCount} upcoming
              </span>
            </div>

            {sortedEvents.map((event) => {
              const date = toDisplayDate(event);
              const color = COLOR_MAP[event.colorId ?? ""] ?? {
                bg: "bg-muted/60",
                border: "border-border/60",
                text: "text-foreground",
              };
              const dayBadge = date ? getDayBadge(date) : null;

              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors hover:bg-muted/30 ${color.bg} ${color.border}`}
                >
                  {/* Color indicator */}
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${color.text.replace("text-", "bg-")}`} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{event.summary}</p>
                    {date && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {dayBadge && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-semibold leading-none">
                            {dayBadge}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {format(date, "EEE, MMM d · h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
