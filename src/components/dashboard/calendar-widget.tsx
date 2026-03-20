import { useEffect, useMemo, useState } from "react";
import { format, isToday, isTomorrow, formatDistanceStrict } from "date-fns";
import { CalendarPlus, CalendarX, ChevronRight, Clock, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WidgetSkeleton } from "./widget-skeleton";

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
  htmlLink?: string;
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

function getEventDuration(event: CalendarEvent): string | null {
  const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
  const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
  
  if (!start || !end) return event.start?.date ? "All day" : null;
  
  try {
    return formatDistanceStrict(start, end);
  } catch {
    return null;
  }
}

function getDayBadge(date: Date): string | null {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return null;
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);
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

        const payload = (await response.json()) as {
          events?: CalendarEvent[];
          needsReauth?: boolean;
        };
        setEvents(payload.events ?? []);
        setNeedsReauth(Boolean(payload.needsReauth));
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

  if (loading) {
    return <WidgetSkeleton />;
  }

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
        {needsReauth ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CalendarX className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Reconnect Google Calendar from Settings.
            </p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CalendarX className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No events in the next 7 days.</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Summary bar */}
            <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2 mb-2 border border-border/40">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">
                  {todayCount > 0 ? `${todayCount} Today` : "No events today"}
                </span>
              </div>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-xs" }),
                  "h-6 w-6 text-muted-foreground hover:text-primary"
                )}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-1.5">
              {sortedEvents.map((event) => {
                const date = toDisplayDate(event);
                const duration = getEventDuration(event);
                const color = COLOR_MAP[event.colorId ?? ""] ?? {
                  bg: "bg-muted/60",
                  border: "border-border/60",
                  text: "text-foreground",
                };
                const dayBadge = date ? getDayBadge(date) : null;

                return (
                  <div
                    key={event.id}
                    className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all hover:bg-muted/30 ${color.bg} ${color.border}`}
                  >
                    {/* Time sidebar */}
                    <div className="flex flex-col items-center gap-0.5 min-w-[40px] border-r border-border/40 pr-2">
                      <span className="text-[10px] font-bold uppercase">{date ? format(date, "MMM") : "-"}</span>
                      <span className="text-sm font-black leading-none">{date ? format(date, "d") : "-"}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold">{event.summary}</p>
                        {duration && (
                          <span className="shrink-0 text-[10px] text-muted-foreground/80 font-medium">
                            {duration}
                          </span>
                        )}
                      </div>
                      {date && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {dayBadge && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold leading-none bg-primary/20 text-primary border-none">
                              {dayBadge}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {format(date, "eee · h:mm a")}
                          </span>
                        </div>
                      )}
                    </div>

                    <a 
                      href={event.htmlLink || "https://calendar.google.com"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
