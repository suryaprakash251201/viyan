"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type BookmarkItem = {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  category: string;
  order: number;
};

const DEFAULT_CATEGORIES = ["Dev Tools", "Social", "Self-hosted Services", "Misc"];

function BookmarkEditor({
  bookmark,
  onClose,
  onSaved,
}: {
  bookmark: BookmarkItem;
  onClose: () => void;
  onSaved: (bookmark: BookmarkItem) => void;
}) {
  const [label, setLabel] = useState(bookmark.label);
  const [url, setUrl] = useState(bookmark.url);
  const [icon, setIcon] = useState(bookmark.icon ?? "");
  const [category, setCategory] = useState(bookmark.category);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url, icon, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to save bookmark");
      }

      const payload = (await response.json()) as { bookmark: BookmarkItem };
      onSaved(payload.bookmark);
      onClose();
      toast.success("Bookmark updated");
    } catch {
      toast.error("Could not update bookmark");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Bookmark</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Input placeholder="Label" value={label} onChange={(event) => setLabel(event.target.value)} />
          <Input placeholder="URL" value={url} onChange={(event) => setUrl(event.target.value)} />
          <Input placeholder="Icon (emoji or text)" value={icon} onChange={(event) => setIcon(event.target.value)} />
          <Input placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BookmarksManager() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookmarks", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load bookmarks");
      }

      const payload = (await response.json()) as { bookmarks: BookmarkItem[] };
      setBookmarks(payload.bookmarks);
    } catch {
      toast.error("Could not load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookmarks();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, BookmarkItem[]>();
    for (const bookmark of bookmarks) {
      if (!map.has(bookmark.category)) {
        map.set(bookmark.category, []);
      }
      map.get(bookmark.category)!.push(bookmark);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [bookmarks]);

  const editingBookmark = useMemo(
    () => bookmarks.find((bookmark) => bookmark.id === editingId) ?? null,
    [bookmarks, editingId]
  );

  const onCreate = async () => {
    if (!label.trim() || !url.trim()) {
      toast.error("Label and URL are required");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          url,
          icon,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bookmark");
      }

      const payload = (await response.json()) as { bookmark: BookmarkItem };
      setBookmarks((previous) => [payload.bookmark, ...previous]);
      setLabel("");
      setUrl("");
      setIcon("");
      toast.success("Bookmark added");
    } catch {
      toast.error("Could not add bookmark");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }

      setBookmarks((previous) => previous.filter((bookmark) => bookmark.id !== id));
      toast.success("Bookmark removed");
    } catch {
      toast.error("Could not remove bookmark");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <header className="rounded-xl border border-border/70 bg-card/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quick Links
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your personal launchpad</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add bookmark</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          <Input placeholder="Label" value={label} onChange={(event) => setLabel(event.target.value)} />
          <Input placeholder="URL" value={url} onChange={(event) => setUrl(event.target.value)} />
          <Input
            placeholder="Icon (emoji/text)"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
          />
          <Input
            list="bookmark-categories"
            placeholder="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <datalist id="bookmark-categories">
            {DEFAULT_CATEGORIES.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <Button type="button" onClick={onCreate} disabled={creating} className="md:col-span-5">
            {creating ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Bookmark
          </Button>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-muted-foreground">Loading bookmarks...</p> : null}

      {!loading && grouped.length === 0 ? (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            No bookmarks yet. Add your first quick link above.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map(([group, items]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-2"
                >
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-medium">
                      {bookmark.icon ? `${bookmark.icon} ` : ""}
                      {bookmark.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{bookmark.url}</p>
                  </a>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon-xs" variant="ghost" asChild>
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" aria-label="Open bookmark">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setEditingId(bookmark.id)}
                      aria-label="Edit bookmark"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      disabled={deletingId === bookmark.id}
                      onClick={() => void onDelete(bookmark.id)}
                      aria-label="Delete bookmark"
                    >
                      {deletingId === bookmark.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingBookmark ? (
        <BookmarkEditor
          bookmark={editingBookmark}
          onClose={() => setEditingId(null)}
          onSaved={(updatedBookmark) =>
            setBookmarks((previous) =>
              previous.map((bookmark) =>
                bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark
              )
            )
          }
        />
      ) : null}
    </section>
  );
}