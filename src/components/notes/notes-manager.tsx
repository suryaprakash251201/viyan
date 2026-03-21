"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import {
  Bold,
  Code2,
  Heading2,
  Highlighter,
  Italic,
  List,
  Pin,
  PinOff,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NoteSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface NoteItem {
  id: string;
  title: string;
  content: JSONContent;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
}

const lowlight = createLowlight(all);

function extractPlainText(content: JSONContent | null | undefined): string {
  if (!content) {
    return "";
  }

  if (typeof content.text === "string") {
    return content.text;
  }

  if (!Array.isArray(content.content)) {
    return "";
  }

  return content.content.map((node) => extractPlainText(node as JSONContent)).join(" ");
}

function NoteEditor({
  note,
  onClose,
  onSaved,
  onDeleted,
}: {
  note: NoteItem;
  onClose: () => void;
  onSaved: (note: NoteItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [tagsInput, setTagsInput] = useState(note.tags.join(", "));
  const [pinned, setPinned] = useState(note.pinned);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Highlight,
      Placeholder.configure({
        placeholder: "Write your note...",
      }),
    ],
    content: note.content,
    immediatelyRender: false,
  });

  const onSave = async () => {
    if (!editor) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          tags: tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          pinned,
          content: editor.getJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const payload = (await response.json()) as { note: NoteItem };
      onSaved(payload.note);
      toast.success("Note saved");
    } catch {
      toast.error("Could not save note");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      onDeleted(note.id);
      onClose();
      toast.success("Note deleted");
    } catch {
      toast.error("Could not delete note");
    } finally {
      setDeleting(false);
    }
  };

  const ToolbarButton = ({
    active,
    onClick,
    label,
    icon,
  }: {
    active?: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
  }) => (
    <Button
      type="button"
      size="icon-xs"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </Button>
  );

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit note</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
          />
          <Input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="Tags (comma separated)"
          />
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-border/70 bg-muted/40 p-2">
          <ToolbarButton
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            label="Bold"
            icon={<Bold className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            label="Italic"
            icon={<Italic className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            label="Heading"
            icon={<Heading2 className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            label="Bullet list"
            icon={<List className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            active={editor?.isActive("codeBlock")}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            label="Code block"
            icon={<Code2 className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            active={editor?.isActive("highlight")}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
            label="Highlight"
            icon={<Highlighter className="h-3.5 w-3.5" />}
          />
          <Button
            type="button"
            size="xs"
            variant={pinned ? "default" : "outline"}
            onClick={() => setPinned((value) => !value)}
          >
            {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {pinned ? "Unpin" : "Pin"}
          </Button>
        </div>

        <div className="rounded-lg border border-border/70 bg-background">
          <EditorContent editor={editor} className="note-editor min-h-72 p-3" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="destructive" onClick={onDelete} loading={deleting}>
            Delete
          </Button>
          <Button type="button" onClick={onSave} loading={saving}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NotesManager() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "pinned">("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const visibleNotes = useMemo(
    () => (view === "pinned" ? notes.filter((note) => note.pinned) : notes),
    [notes, view]
  );

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  const loadNotes = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notes?query=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const payload = (await response.json()) as { notes: NoteItem[] };
      setNotes(payload.notes);
    } catch {
      toast.error("Could not load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadNotes(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const onCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled note",
          content: {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
          tags: [],
          pinned: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const payload = (await response.json()) as { note: NoteItem };
      setNotes((previous) => [payload.note, ...previous]);
      setSelectedNoteId(payload.note.id);
      toast.success("Note created");
    } catch {
      toast.error("Could not create note");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-4">
      <header className="finance-shell flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5">Notes Module</span>
          <button
            type="button"
            onClick={() => setView("all")}
            className={`rounded-full border px-3 py-1.5 ${view === "all" ? "border-foreground bg-foreground text-background" : "border-border/70 bg-background/80"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setView("pinned")}
            className={`rounded-full border px-3 py-1.5 ${view === "pinned" ? "border-foreground bg-foreground text-background" : "border-border/70 bg-background/80"}`}
          >
            Pinned
          </button>
        </div>
        <div className="flex w-full max-w-xl flex-1 items-center gap-2">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search notes by title, content, or tags"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button type="button" onClick={onCreate} loading={creating}>
            New
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3" aria-busy="true" role="status">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <NoteSkeleton />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && visibleNotes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Search}
              title={view === "pinned" ? "No pinned notes" : "No notes found"}
              description={view === "pinned" ? "Pin notes to access them quickly here." : "Create your first note to get started."}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {visibleNotes.map((note) => {
          const preview = extractPlainText(note.content).trim() || "Empty note";

          return (
            <article key={note.id} className="mb-4 break-inside-avoid">
              <Card className="cursor-pointer transition hover:ring-2 hover:ring-ring/40" onClick={() => setSelectedNoteId(note.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg">{note.title}</CardTitle>
                    {note.pinned ? <Pin className="h-4 w-4 text-chart-2" /> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-6 text-sm text-muted-foreground">{preview}</p>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <Badge key={`${note.id}-${tag}`} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </article>
          );
        })}
      </div>

      {selectedNote ? (
        <NoteEditor
          note={selectedNote}
          onClose={() => setSelectedNoteId(null)}
          onSaved={(updated) =>
            setNotes((previous) =>
              previous
                .map((note) => (note.id === updated.id ? updated : note))
                .sort((a, b) => {
                  if (a.pinned !== b.pinned) {
                    return a.pinned ? -1 : 1;
                  }
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                })
            )
          }
          onDeleted={(id) => setNotes((previous) => previous.filter((note) => note.id !== id))}
        />
      ) : null}
    </section>
  );
}