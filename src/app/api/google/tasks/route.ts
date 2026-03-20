import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleTokens } from "@/lib/google-tokens";

const TASKS_BASE_URL = "https://tasks.googleapis.com/tasks/v1";

type GoogleTask = {
  id: string;
  title?: string;
  status?: "needsAction" | "completed";
  due?: string;
  completed?: string;
  starred?: boolean;
};

type GoogleTaskList = {
  id: string;
  title?: string;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function getAccessToken() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const tokens = await getGoogleTokens(userId);
  return tokens?.accessToken ?? null;
}

async function callGoogle<T>(
  accessToken: string,
  input: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      detail: await response.text(),
    };
  }

  if (response.status === 204) {
    return { ok: true, data: {} as T };
  }

  return {
    ok: true,
    data: (await response.json()) as T,
  };
}

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ taskLists: [], needsReauth: true });
  }

  const listsResult = await callGoogle<{ items?: GoogleTaskList[] }>(
    accessToken,
    `${TASKS_BASE_URL}/users/@me/lists`
  );

  if (!listsResult.ok) {
    if (listsResult.status === 401 || listsResult.status === 403) {
      return NextResponse.json({ taskLists: [], needsReauth: true });
    }

    return NextResponse.json(
      { error: "Failed to fetch task lists", detail: listsResult.detail },
      { status: listsResult.status }
    );
  }

  const lists = listsResult.data.items ?? [];

  const grouped = await Promise.all(
    lists.map(async (list) => {
      const tasksResult = await callGoogle<{ items?: GoogleTask[] }>(
        accessToken,
        `${TASKS_BASE_URL}/lists/${list.id}/tasks?showCompleted=true&showHidden=true&maxResults=100`
      );

      if (!tasksResult.ok) {
        return {
          id: list.id,
          title: list.title ?? "Untitled list",
          tasks: [],
          error: true,
        };
      }

      return {
        id: list.id,
        title: list.title ?? "Untitled list",
        tasks: (tasksResult.data.items ?? []).map((task) => ({
          id: task.id,
          title: task.title ?? "Untitled task",
          status: task.status ?? "needsAction",
          due: task.due,
          completed: task.completed,
          starred: task.starred ?? false,
        })),
      };
    })
  );

  return NextResponse.json({ taskLists: grouped, needsReauth: false });
}

export async function POST(request: Request) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | { taskListId?: string; title?: string }
    | null;

  const taskListId = payload?.taskListId?.trim();
  const title = payload?.title?.trim();

  if (!taskListId || !title) {
    return NextResponse.json(
      { error: "taskListId and title are required" },
      { status: 400 }
    );
  }

  const createdResult = await callGoogle<GoogleTask>(
    accessToken,
    `${TASKS_BASE_URL}/lists/${taskListId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
      }),
    }
  );

  if (!createdResult.ok) {
    return NextResponse.json(
      { error: "Failed to create task", detail: createdResult.detail },
      { status: createdResult.status }
    );
  }

  return NextResponse.json(
    {
      task: {
        id: createdResult.data.id,
        title: createdResult.data.title ?? title,
        status: createdResult.data.status ?? "needsAction",
        due: createdResult.data.due,
        completed: createdResult.data.completed,
        starred: createdResult.data.starred ?? false,
      },
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        taskListId?: string;
        taskId?: string;
        completed?: boolean;
        starred?: boolean;
      }
    | null;

  const taskListId = payload?.taskListId?.trim();
  const taskId = payload?.taskId?.trim();
  const completed = payload?.completed;
  const starred = payload?.starred;

  if (!taskListId || !taskId || (typeof completed !== "boolean" && typeof starred !== "boolean")) {
    return NextResponse.json(
      { error: "taskListId, taskId and (completed or starred) are required" },
      { status: 400 }
    );
  }

  const updateBody: any = {};
  if (typeof completed === "boolean") {
    updateBody.status = completed ? "completed" : "needsAction";
    updateBody.completed = completed ? new Date().toISOString() : null;
  }
  if (typeof starred === "boolean") {
    updateBody.starred = starred;
  }

  const updatedResult = await callGoogle<GoogleTask>(
    accessToken,
    `${TASKS_BASE_URL}/lists/${taskListId}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updateBody),
    }
  );

  if (!updatedResult.ok) {
    return NextResponse.json(
      { error: "Failed to update task", detail: updatedResult.detail },
      { status: updatedResult.status }
    );
  }

  return NextResponse.json({
    task: {
      id: updatedResult.data.id,
      title: updatedResult.data.title ?? "Untitled task",
      status: updatedResult.data.status ?? "needsAction",
      due: updatedResult.data.due,
      completed: updatedResult.data.completed,
      starred: updatedResult.data.starred ?? false,
    },
  });
}

export async function DELETE(request: Request) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const taskListId = searchParams.get("taskListId")?.trim();
  const taskId = searchParams.get("taskId")?.trim();

  if (!taskListId || !taskId) {
    return NextResponse.json(
      { error: "taskListId and taskId are required" },
      { status: 400 }
    );
  }

  const deleteResult = await callGoogle<Record<string, never>>(
    accessToken,
    `${TASKS_BASE_URL}/lists/${taskListId}/tasks/${taskId}`,
    {
      method: "DELETE",
    }
  );

  if (!deleteResult.ok) {
    return NextResponse.json(
      { error: "Failed to delete task", detail: deleteResult.detail },
      { status: deleteResult.status }
    );
  }

  return NextResponse.json({ ok: true });
}