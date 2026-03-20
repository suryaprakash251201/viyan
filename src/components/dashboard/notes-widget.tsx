"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Pin } from "lucide-react";
import { TaskSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface NoteItem {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

export function NotesWidget() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch("/api/notes?limit=5", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load notes");
        const payload = (await response.json()) as { notes: NoteItem[] };
        setNotes(payload.notes.slice(0, 5));
      } catch {
        // Silently fail for widget
      } finally {
        setLoading(false);
      }
    };
    void loadNotes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes"
        description="Create your first note"
      />
    );
  }

  return (
    <ul className="space-y-2" role="list" aria-label="Recent notes">
      {notes.map((note) => (
        <li
          key={note.id}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 transition-colors hover:bg-muted/30"
        >
          <NotebookPen className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs">{note.title}</span>
          {note.pinned && (
            <Pin className="h-3 w-3 shrink-0 text-chart-2" aria-label="Pinned" />
          )}
        </li>
      ))}
    </ul>
  );
}