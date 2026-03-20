"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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
}

function isOverdue(task: TaskItem): boolean {
  if (!task.due || task.status === "completed") return false;
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
  const [needsReauth, setNeedsReauth] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [newTaskTitleByList, setNewTaskTitleByList] = useState<Record<string, string>>({});
  const [creatingForList, setCreatingForList] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch("/api/google/tasks", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load tasks");
        const payload = (await response.json()) as {
          taskLists?: TaskListGroup[];
          needsReauth?: boolean;
        };
        setTaskLists(payload.taskLists ?? []);
        setNeedsReauth(Boolean(payload.needsReauth));
      } catch {
        toast.error("Unable to load Google Tasks.");
      } finally {
        setLoading(false);
      }
    };
    void loadTasks();
  }, []);

  const stats = useMemo(() => {
    let open = 0;
    let completed = 0;
    let overdue = 0;
    taskLists.forEach((list) => {
      list.tasks.forEach((task) => {
        if (task.status === "completed") {
          completed++;
        } else {
          open++;
          if (isOverdue(task)) overdue++;
        }
      });
    });
    const total = open + completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { open, completed, overdue, progress };
  }, [taskLists]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskListId, title }),
      });

      if (!response.ok) throw new Error("Failed to create task");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskListId, taskId: task.id, completed: nextCompleted }),
      });

      if (!response.ok) throw new Error("Failed to update task");

      const payload = (await response.json()) as { task?: TaskItem };

      if (payload.task) {
        setTaskLists((previous) =>
          previous.map((list) =>
            list.id === taskListId
              ? {
                  ...list,
                  tasks: sortTasks(
                    list.tasks.map((item) => (item.id === task.id ? payload.task! : item))
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
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete task");

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
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <Circle className="h-3.5 w-3.5 text-primary" />
            <span className="text-base font-bold">{stats.open}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Open</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-base font-bold">{stats.progress}%</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Progress</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            {stats.overdue > 0 ? (
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
            <span className={`text-base font-bold ${stats.overdue > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {stats.overdue}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Overdue</span>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={stats.progress} className="h-1.5 rounded-full" />

      {/* Task lists */}
      <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/60 p-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tasks...
          </div>
        ) : needsReauth ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Reconnect Google Tasks from Settings.
            </p>
          </div>
        ) : taskLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No task lists found.</p>
          </div>
        ) : (
          taskLists.map((list) => {
            const listOpen = list.tasks.filter((t) => t.status === "needsAction").length;
            const listDone = list.tasks.filter((t) => t.status === "completed").length;
            const listTotal = list.tasks.length;

            return (
              <div
                key={list.id}
                className="rounded-xl border border-border/60 bg-card p-3 space-y-2"
              >
                {/* List header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold">{list.title}</h3>
                    {listTotal > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {listDone}/{listTotal}
                        </span>
                      </div>
                    )}
                  </div>
                  {listOpen > 0 && (
                    <span className="text-[10px] font-medium text-primary">{listOpen} left</span>
                  )}
                </div>

                {/* Add task */}
                <div className="flex gap-1.5">
                  <Input
                    value={newTaskTitleByList[list.id] ?? ""}
                    placeholder="Add task..."
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
                    className="h-7 text-xs"
                  />
                  <Button
                    type="button"
                    size="icon-xs"
                    onClick={() => void onCreateTask(list.id)}
                    disabled={creatingForList === list.id}
                    className="h-7 w-7 shrink-0"
                  >
                    {creatingForList === list.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Task items */}
                <ul className="space-y-1 max-h-40 overflow-auto">
                  {sortTasks(list.tasks).map((task) => {
                    const overdue = isOverdue(task);
                    const completed = task.status === "completed";
                    const dueDate = task.due ? new Date(task.due) : null;

                    return (
                      <li
                        key={task.id}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
                          completed
                            ? "border-border/40 bg-muted/20"
                            : overdue
                            ? "border-red-500/30 bg-red-500/5"
                            : "border-border/60 bg-background/80 hover:bg-muted/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void onToggleTask(list.id, task)}
                          disabled={savingTaskId === task.id}
                          className="shrink-0 transition-transform hover:scale-110 active:scale-95"
                          aria-label={completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : overdue ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        <span
                          className={`min-w-0 flex-1 truncate text-xs ${
                            completed
                              ? "text-muted-foreground line-through"
                              : overdue
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>

                        {dueDate && !completed && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Clock className={`h-3 w-3 ${overdue ? "text-red-500" : "text-muted-foreground"}`} />
                            <span className={`text-[10px] ${overdue ? "text-red-500" : "text-muted-foreground"}`}>
                              {format(dueDate, "MMM d")}
                            </span>
                          </div>
                        )}

                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          disabled={deletingTaskId === task.id}
                          onClick={() => void onDeleteTask(list.id, task.id)}
                          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          aria-label={`Delete ${task.title}`}
                        >
                          {deletingTaskId === task.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
