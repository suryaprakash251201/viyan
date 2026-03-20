import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleTokens } from "@/lib/google-tokens";

const CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";

type CalendarApiEvent = {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function getAuthContext() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const tokens = await getGoogleTokens(userId);

  if (!tokens?.accessToken) {
    return null;
  }

  return tokens;
}

export async function GET() {
  const tokens = await getAuthContext();

  if (!tokens) {
    return NextResponse.json({ events: [], needsReauth: true });
  }

  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const url = new URL(`${CALENDAR_BASE_URL}/calendars/primary/events`);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", now.toISOString());
  url.searchParams.set("timeMax", sevenDaysLater.toISOString());
  url.searchParams.set("maxResults", "20");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ events: [], needsReauth: true });
    }

    const errorText = await response.text();
    return NextResponse.json(
      { error: "Failed to fetch events", detail: errorText },
      { status: response.status }
    );
  }

  const data = (await response.json()) as { items?: CalendarApiEvent[] };

  return NextResponse.json({
    events: (data.items ?? []).map((event) => ({
      id: event.id,
      summary: event.summary ?? "Untitled event",
      start: event.start,
      end: event.end,
      colorId: event.colorId,
    })),
    needsReauth: false,
  });
}

export async function POST(request: Request) {
  const tokens = await getAuthContext();

  if (!tokens) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | { title?: string; startDateTime?: string }
    | null;

  const title = payload?.title?.trim();
  const startDateTime = payload?.startDateTime;

  if (!title || !startDateTime) {
    return NextResponse.json(
      { error: "title and startDateTime are required" },
      { status: 400 }
    );
  }

  const start = new Date(startDateTime);

  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startDateTime" }, { status: 400 });
  }

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const response = await fetch(
    `${CALENDAR_BASE_URL}/calendars/primary/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: title,
        start: {
          dateTime: start.toISOString(),
        },
        end: {
          dateTime: end.toISOString(),
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "Failed to create event", detail: errorText },
      { status: response.status }
    );
  }

  const created = (await response.json()) as CalendarApiEvent;

  return NextResponse.json(
    {
      event: {
        id: created.id,
        summary: created.summary ?? "Untitled event",
        start: created.start,
        end: created.end,
        colorId: created.colorId,
      },
    },
    { status: 201 }
  );
}