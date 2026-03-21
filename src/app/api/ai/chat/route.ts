import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse, unauthorized } from "@/lib/api-utils";

type Provider = "gemini" | "openrouter";
type ToolName = "finance" | "notes" | "bookmarks" | "todos";

interface ChatPayload {
  provider?: Provider;
  model?: string;
  message?: string;
  tools?: ToolName[];
}

function normalizeTools(value: unknown): ToolName[] {
  if (!Array.isArray(value)) return [];

  const allowed = new Set<ToolName>(["finance", "notes", "bookmarks", "todos"]);
  return value.filter((tool): tool is ToolName => typeof tool === "string" && allowed.has(tool as ToolName));
}

async function buildToolContext(userId: string, tools: ToolName[]): Promise<string> {
  const parts: string[] = [];

  if (tools.includes("finance")) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 30,
      select: { amount: true, type: true, category: true, date: true, note: true },
    });

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    parts.push(
      [
        "[Finance Summary]",
        `Income: ₹${income.toLocaleString("en-IN")}`,
        `Expense: ₹${expense.toLocaleString("en-IN")}`,
        `Balance: ₹${(income - expense).toLocaleString("en-IN")}`,
        "Recent Transactions:",
        ...transactions.slice(0, 10).map((t) =>
          `- ${new Date(t.date).toLocaleDateString("en-IN")}: ${t.type} ₹${Number(t.amount).toLocaleString("en-IN")} (${t.category})${t.note ? ` - ${t.note}` : ""}`
        ),
      ].join("\n")
    );
  }

  if (tools.includes("notes")) {
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 20,
      select: { title: true, tags: true, pinned: true, updatedAt: true },
    });

    parts.push(
      [
        "[Notes Overview]",
        `Total Notes: ${notes.length}`,
        "Recent Notes:",
        ...notes.slice(0, 10).map((n) =>
          `- ${n.pinned ? "[Pinned] " : ""}${n.title} (${new Date(n.updatedAt).toLocaleDateString("en-IN")})${n.tags.length ? ` tags: ${n.tags.join(", ")}` : ""}`
        ),
      ].join("\n")
    );
  }

  if (tools.includes("bookmarks")) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { label: "asc" }],
      take: 50,
      select: { label: true, url: true, category: true },
    });

    const byCategory = new Map<string, number>();
    for (const bookmark of bookmarks) {
      byCategory.set(bookmark.category, (byCategory.get(bookmark.category) ?? 0) + 1);
    }

    parts.push(
      [
        "[Bookmarks Overview]",
        `Total Bookmarks: ${bookmarks.length}`,
        "Categories:",
        ...Array.from(byCategory.entries()).map(([category, count]) => `- ${category}: ${count}`),
        "Recent Bookmarks:",
        ...bookmarks.slice(0, 10).map((b) => `- ${b.label} (${b.category}) -> ${b.url}`),
      ].join("\n")
    );
  }

  if (tools.includes("todos")) {
    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: [{ completed: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
      take: 50,
      select: { title: true, completed: true, priority: true, dueDate: true },
    });

    const openCount = todos.filter((t) => !t.completed).length;

    parts.push(
      [
        "[Todo Overview]",
        `Total Todos: ${todos.length}`,
        `Open Todos: ${openCount}`,
        "Top Open Todos:",
        ...todos
          .filter((t) => !t.completed)
          .slice(0, 10)
          .map((t) => `- [P${t.priority}] ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString("en-IN")})` : ""}`),
      ].join("\n")
    );
  }

  return parts.join("\n\n");
}

async function askGemini(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userMessage}` }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${detail}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response generated.";
}

async function askOpenRouter(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "Viyan Dashboard",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter request failed: ${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() || "No response generated.";
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => null)) as ChatPayload | null;
  const provider = payload?.provider ?? "gemini";
  const message = payload?.message?.trim();
  const tools = normalizeTools(payload?.tools);

  if (!message) {
    return errorResponse("Message is required", 400);
  }

  if (provider !== "gemini" && provider !== "openrouter") {
    return errorResponse("Unsupported provider", 400);
  }

  const toolContext = await buildToolContext(userId, tools);
  const systemPrompt = [
    "You are Viyan AI Assistant for a personal productivity dashboard.",
    "Use the provided tool context when relevant.",
    "Give practical, concise action-oriented advice.",
    "If numbers are present, reason with them carefully.",
    toolContext ? `\nTool Context:\n${toolContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return errorResponse("GEMINI_API_KEY is not configured", 500);
      }
      const model = payload?.model?.trim() || process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const reply = await askGemini(apiKey, model, systemPrompt, message);
      return successResponse({ reply, provider, model });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return errorResponse("OPENROUTER_API_KEY is not configured", 500);
    }
    const model = payload?.model?.trim() || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    const reply = await askOpenRouter(apiKey, model, systemPrompt, message);
    return successResponse({ reply, provider, model });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown provider error";
    return errorResponse("Chat request failed", 502, detail);
  }
}
