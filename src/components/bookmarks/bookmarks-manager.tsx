"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Trash2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BookmarkSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type BookmarkItem = {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  category: string;
  order: number;
};

const DEFAULT_CATEGORIES = ["Dev Tools", "Social", "Self-hosted Services", "Misc"];

function isFaviconUrl(value: string | null): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}

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

  const fetchFavicon = (targetUrl: string) => {
    if (!targetUrl || icon) return;
    try {
      const hostname = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      setIcon(faviconUrl);
    } catch {
      // Ignore
    }
  };

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
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Label</p>
            <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">URL</p>
            <Input 
              placeholder="URL" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              onBlur={() => fetchFavicon(url)}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Icon</p>
            <div className="flex gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
                {isFaviconUrl(icon) ? (
                  <img src={icon} alt="" className="h-5 w-5 rounded-sm" />
                ) : icon ? (
                  <span className="text-lg">{icon}</span>
                ) : (
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <Input
                placeholder="Emoji or Favicon URL"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Category</p>
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onSave} loading={saving}>
            Save Changes
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

  const [searchTerm, setSearchTerm] = useState("");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);

  const fetchFavicon = (targetUrl: string) => {
    if (!targetUrl || icon) return;
    try {
      const hostname = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      setIcon(faviconUrl);
    } catch {
      // Ignore invalid URLs
    }
  };

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

  const filteredBookmarks = useMemo(() => {
    if (!searchTerm.trim()) return bookmarks;
    const lower = searchTerm.toLowerCase();
    return bookmarks.filter(
      (b) => b.label.toLowerCase().includes(lower) || b.url.toLowerCase().includes(lower)
    );
  }, [bookmarks, searchTerm]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookmarkItem[]>();
    for (const bookmark of filteredBookmarks) {
      if (!map.has(bookmark.category)) {
        map.set(bookmark.category, []);
      }
      map.get(bookmark.category)!.push(bookmark);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBookmarks]);

  const editingBookmark = useMemo(
    () => bookmarks.find((bookmark) => bookmark.id === editingId) ?? null,
    [bookmarks, editingId]
  );

  const bookmarkCount = bookmarks.length;
  const categoryCount = grouped.length;

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
    <section className="flex w-full flex-col gap-5">
      <header className="finance-shell overflow-hidden p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quick Links
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-[38px] md:leading-none">
              Your personal launchpad
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Keep your most-used destinations grouped, branded, and one click away with automatic favicons.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
              {bookmarkCount} bookmarks
            </div>
            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
              {categoryCount} categories
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Bookmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add new bookmark</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Label</p>
            <Input placeholder="Personal Blog" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">URL</p>
            <Input 
              placeholder="example.com" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => fetchFavicon(url)}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Icon</p>
            <div className="flex gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
                {isFaviconUrl(icon) ? (
                  <img src={icon} alt="" className="h-5 w-5 rounded-sm" />
                ) : icon ? (
                  <span className="text-lg">{icon}</span>
                ) : (
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <Input
                placeholder="Emoji or Favicon URL"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Category</p>
            <div className="flex gap-2">
              <Input
                list="bookmark-categories"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Button type="button" onClick={onCreate} loading={creating} size="icon" className="shrink-0">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
            <datalist id="bookmark-categories">
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <BookmarkSkeleton />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <BookmarkSkeleton key={j} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && grouped.length === 0 ? (
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardContent className="py-8">
            <EmptyState
              icon={Bookmark}
              title="No bookmarks"
              description="Add your first quick link above."
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map(([group, items]) => (
          <Card key={group} className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{group}</CardTitle>
                <div className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                  {items.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 transition hover:border-border hover:bg-background"
                >
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-sm">
                        {isFaviconUrl(bookmark.icon) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={bookmark.icon ?? ""}
                            alt=""
                            className="h-4 w-4 rounded-sm"
                            loading="lazy"
                          />
                        ) : bookmark.icon ? (
                          <span>{bookmark.icon}</span>
                        ) : (
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{bookmark.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{bookmark.url}</p>
                      </div>
                    </div>
                  </a>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => window.open(bookmark.url, "_blank", "noopener,noreferrer")}
                      aria-label="Open bookmark"
                    >
                      <ExternalLink className="h-4 w-4" />
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
                      loading={deletingId === bookmark.id}
                      onClick={() => void onDelete(bookmark.id)}
                      aria-label="Delete bookmark"
                    >
                      <Trash2 className="h-4 w-4" />
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