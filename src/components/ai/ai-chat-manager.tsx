"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, SendHorizontal, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Provider = "gemini" | "openrouter";
type ToolName = "finance" | "notes" | "bookmarks" | "todos";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const TOOL_OPTIONS: Array<{ value: ToolName; label: string }> = [
  { value: "finance", label: "Finance" },
  { value: "notes", label: "Notes" },
  { value: "bookmarks", label: "Bookmarks" },
  { value: "todos", label: "Todos" },
];

export function AiChatManager() {
  const [provider, setProvider] = useState<Provider>("gemini");
  const [model, setModel] = useState("");
  const [tools, setTools] = useState<ToolName[]>(["finance", "todos"]);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const placeholderModel = useMemo(
    () => (provider === "gemini" ? "gemini-1.5-flash" : "openai/gpt-4o-mini"),
    [provider]
  );

  const toggleTool = (tool: ToolName) => {
    setTools((prev) => (prev.includes(tool) ? prev.filter((item) => item !== tool) : [...prev, tool]));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const message = prompt.trim();
    if (!message) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setPrompt("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model: model.trim() || undefined,
          message,
          tools,
        }),
      });

      const payload = (await response.json()) as { reply?: string; error?: string; detail?: string };

      if (!response.ok) {
        throw new Error(payload.detail || payload.error || "Chat request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: payload.reply || "No response generated." }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unexpected error";
      toast.error(detail);
      setMessages((prev) => [...prev, { role: "assistant", content: `Request failed: ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-4">
      <Card className="finance-shell">
        <CardHeader>
          <CardTitle className="text-base">Assistant Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Provider</p>
            <div className="flex gap-2">
              <Button type="button" size="xs" variant={provider === "gemini" ? "default" : "outline"} onClick={() => setProvider("gemini")}>Gemini</Button>
              <Button type="button" size="xs" variant={provider === "openrouter" ? "default" : "outline"} onClick={() => setProvider("openrouter")}>OpenRouter</Button>
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Model (optional)</p>
            <Input
              placeholder={placeholderModel}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <p className="text-xs font-medium text-muted-foreground">Context tools</p>
            <div className="flex flex-wrap gap-2">
              {TOOL_OPTIONS.map((tool) => (
                <Button
                  key={tool.value}
                  type="button"
                  size="xs"
                  variant={tools.includes(tool.value) ? "secondary" : "outline"}
                  onClick={() => toggleTool(tool.value)}
                >
                  {tool.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="finance-shell">
        <CardHeader>
          <CardTitle className="text-base">Viyan AI Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-background/50 p-3">
            {messages.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Ask anything about your dashboard data and planning.
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="mt-3 space-y-2" onSubmit={onSubmit}>
            <Textarea
              placeholder="Example: Analyze my expenses and suggest 3 budget actions for next month."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-24"
            />
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                <SendHorizontal className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
