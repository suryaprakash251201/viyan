import { useEffect, useState, useMemo } from "react";
import { NotebookPen, Pin, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { WidgetSkeleton } from "./widget-skeleton";

interface NoteItem {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

export function NotesWidget() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch("/api/notes?limit=10", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load notes");
        const payload = (await response.json()) as { notes: NoteItem[] };
        setNotes(payload.notes);
      } catch {
        // Silently fail for widget
      } finally {
        setLoading(false);
      }
    };
    void loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
  }, [notes, searchTerm]);

  if (loading) {
    return <WidgetSkeleton />;
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/60 p-2">
        {filteredNotes.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title={searchTerm ? "No results" : "No notes"}
            description={searchTerm ? `No notes matching "${searchTerm}"` : "Create your first note"}
            action={!searchTerm ? {
              label: "Create Note",
              onClick: () => window.location.href = "/notes",
            } : undefined}
          />
        ) : (
          <ul className="space-y-1.5" role="list" aria-label="Recent notes">
            {filteredNotes.map((note) => (
              <li
                key={note.id}
                className="group flex items-center gap-2 rounded-lg border border-border/40 bg-card px-3 py-2 transition-all hover:border-border/80 hover:bg-accent/50"
              >
                <NotebookPen className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{note.title}</span>
                {note.pinned && (
                  <Pin className="h-3 w-3 shrink-0 text-primary animate-pulse" aria-label="Pinned" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}