"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskItem {
  id: string;
  title: string;
  status: "needsAction" | "completed";
  due?: string;
  completed?: string;
}

interface TaskListGroup {
  id: string;
  title: string;
  tasks: TaskItem[];
  error?: boolean;
}

function isOverdue(task: TaskItem): boolean {
  if (!task.due || task.status === "completed") {
    return false;
  }

  const dueDate = new Date(task.due);
  return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now();
}

function sortTasks(tasks: TaskItem[]) {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "needsAction" ? -1 : 1;
    }

    const first = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
    const second = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;

    return first - second;
  });
}

export function TasksWidget() {
  const [taskLists, setTaskLists] = useState<TaskListGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [newTaskTitleByList, setNewTaskTitleByList] = useState<Record<string, string>>(
    {}
  );
  const [creatingForList, setCreatingForList] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch("/api/google/tasks", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load tasks");
        }

        const payload = (await response.json()) as { taskLists?: TaskListGroup[] };
        setTaskLists(payload.taskLists ?? []);
      } catch {
        toast.error("Unable to load Google Tasks.");
      } finally {
        setLoading(false);
      }
    };

    void loadTasks();
  }, []);

  const totalOpenTasks = useMemo(
    () =>
      taskLists.reduce(
        (count, list) => count + list.tasks.filter((task) => task.status === "needsAction").length,
        0
      ),
    [taskLists]
  );

  const onCreateTask = async (taskListId: string) => {
    const title = newTaskTitleByList[taskListId]?.trim();
    if (!title) {
      toast.error("Enter a task title first.");
      return;
    }

    setCreatingForList(taskListId);

    try {
      const response = await fetch("/api/google/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskListId, title }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const payload = (await response.json()) as { task?: TaskItem };

      if (payload.task) {
        setTaskLists((previous) =>
          previous.map((list) =>
            list.id === taskListId
              ? { ...list, tasks: sortTasks([payload.task!, ...list.tasks]) }
              : list
          )
        );
      }

      setNewTaskTitleByList((previous) => ({ ...previous, [taskListId]: "" }));
    } catch {
      toast.error("Could not create task.");
    } finally {
      setCreatingForList(null);
    }
  };

  const onToggleTask = async (taskListId: string, task: TaskItem) => {
    const nextCompleted = task.status !== "completed";
    setSavingTaskId(task.id);

    try {
      const response = await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskListId,
          taskId: task.id,
          completed: nextCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const payload = (await response.json()) as { task?: TaskItem };

      if (payload.task) {
        setTaskLists((previous) =>
          previous.map((list) =>
            list.id === taskListId
              ? {
                  ...list,
                  tasks: sortTasks(
                    list.tasks.map((item) =>
                      item.id === task.id ? payload.task! : item
                    )
                  ),
                }
              : list
          )
        );
      }
    } catch {
      toast.error("Could not update task.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const onDeleteTask = async (taskListId: string, taskId: string) => {
    setDeletingTaskId(taskId);

    try {
      const response = await fetch(
        `/api/google/tasks?taskListId=${encodeURIComponent(taskListId)}&taskId=${encodeURIComponent(taskId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTaskLists((previous) =>
        previous.map((list) =>
          list.id === taskListId
            ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) }
            : list
        )
      );
    } catch {
      toast.error("Could not delete task.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Open tasks
        </p>
        <p className="text-sm font-semibold">{totalOpenTasks}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-auto rounded-lg border border-border/70 bg-background/60 p-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading tasks...</p> : null}

        {!loading && taskLists.length === 0 ? (
          <p className="text-sm text-muted-foreground">No task lists found.</p>
        ) : null}

        {!loading
          ? taskLists.map((list) => (
              <section key={list.id} className="space-y-2 rounded-md border border-border/60 bg-card p-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{list.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {list.tasks.filter((task) => task.status !== "completed").length} open
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={newTaskTitleByList[list.id] ?? ""}
                    placeholder="Add task"
                    onChange={(event) =>
                      setNewTaskTitleByList((previous) => ({
                        ...previous,
                        [list.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCreateTask(list.id);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void onCreateTask(list.id)}
                    disabled={creatingForList === list.id}
                  >
                    {creatingForList === list.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus />
                    )}
                    Add
                  </Button>
                </div>

                <ul className="space-y-1.5">
                  {sortTasks(list.tasks).map((task) => {
                    const overdue = isOverdue(task);
                    const completed = task.status === "completed";
                    const dueDate = task.due ? new Date(task.due) : null;

                    return (
                      <li
                        key={task.id}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${
                          overdue
                            ? "border-red-500/40 bg-red-500/10"
                            : "border-border/60 bg-background"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={completed}
                          disabled={savingTaskId === task.id}
                          onChange={() => void onToggleTask(list.id, task)}
                          className="h-4 w-4 accent-primary"
                          aria-label={`Complete ${task.title}`}
                        />

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm ${
                              completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </p>
                          {dueDate && !Number.isNaN(dueDate.getTime()) ? (
                            <p
                              className={`text-xs ${
                                overdue ? "text-red-600" : "text-muted-foreground"
                              }`}
                            >
                              Due {format(dueDate, "EEE, MMM d · hh:mm a")}
                            </p>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          disabled={deletingTaskId === task.id}
                          onClick={() => void onDeleteTask(list.id, task.id)}
                          aria-label={`Delete ${task.title}`}
                        >
                          {deletingTaskId === task.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          : null}
      </div>
    </div>
  );
}