"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ListTodo, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";

type TodoItem = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
  dueDate: string | null;
  createdAt: string;
};

const PRIORITY_OPTIONS = [
  { value: 1, label: "High" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Low" },
];

function priorityClass(priority: number): string {
  if (priority === 1) return "text-rose-600 bg-rose-100";
  if (priority === 2) return "text-amber-700 bg-amber-100";
  return "text-emerald-700 bg-emerald-100";
}

export function TodoManager() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "completed">("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(2);
  const [creating, setCreating] = useState(false);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (status === "open") params.set("completed", "false");
      if (status === "completed") params.set("completed", "true");

      const response = await fetch(`/api/todos?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load todos");
      const payload = (await response.json()) as { todos: TodoItem[] };
      setTodos(payload.todos);
    } catch {
      toast.error("Could not load todos");
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const open = total - completed;
    return { total, open, completed };
  }, [todos]);

  const onCreate = async () => {
    if (!title.trim()) {
      toast.error("Todo title is required");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : undefined,
          priority,
        }),
      });

      if (!response.ok) throw new Error("Failed to create todo");
      const payload = (await response.json()) as { todo: TodoItem };
      setTodos((prev) => [payload.todo, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority(2);
      toast.success("Todo added");
    } catch {
      toast.error("Could not add todo");
    } finally {
      setCreating(false);
    }
  };

  const toggleTodo = async (todo: TodoItem) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!response.ok) throw new Error("Failed to update todo");
      const payload = (await response.json()) as { todo: TodoItem };
      setTodos((prev) => prev.map((item) => (item.id === todo.id ? payload.todo : item)));
    } catch {
      toast.error("Could not update todo");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete todo");
      setTodos((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Could not delete todo");
    }
  };

  return (
    <section className="flex w-full flex-col gap-4">
      <header className="finance-shell p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5">Total {stats.total}</span>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5">Open {stats.open}</span>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5">Done {stats.completed}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={status === "all" ? "default" : "outline"} size="xs" onClick={() => setStatus("all")}>All</Button>
            <Button type="button" variant={status === "open" ? "default" : "outline"} size="xs" onClick={() => setStatus("open")}>Open</Button>
            <Button type="button" variant={status === "completed" ? "default" : "outline"} size="xs" onClick={() => setStatus("completed")}>Completed</Button>
          </div>
        </div>
      </header>

      <Card className="finance-shell">
        <CardHeader>
          <CardTitle className="text-base">Add Todo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Todo title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={priority}
              onChange={(event) => setPriority(Number(event.target.value))}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="button" onClick={onCreate} loading={creating}>Add Todo</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="finance-shell">
        <CardHeader>
          <CardTitle className="text-base">Todo List</CardTitle>
          <div className="pt-2">
            <Input
              placeholder="Search todos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading todos...</p>
          ) : todos.length === 0 ? (
            <EmptyState icon={ListTodo} title="No todos" description="Create your first task to get started." />
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="widget-row flex items-start gap-3 px-3 py-2.5">
                <button type="button" onClick={() => void toggleTodo(todo)} className="mt-0.5">
                  {todo.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                      {todo.title}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass(todo.priority)}`}>
                      P{todo.priority}
                    </span>
                    {todo.dueDate ? (
                      <span className="text-[11px] text-muted-foreground">Due {new Date(todo.dueDate).toLocaleDateString("en-IN")}</span>
                    ) : null}
                  </div>
                  {todo.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{todo.description}</p>
                  ) : null}
                </div>

                <Button type="button" variant="ghost" size="icon-xs" onClick={() => void deleteTodo(todo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
