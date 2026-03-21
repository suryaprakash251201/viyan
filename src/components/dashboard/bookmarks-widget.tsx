"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useEffect, useState } from "react";
import { Bookmark, ExternalLink } from "lucide-react";
import { BookmarkSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface BookmarkItem {
  id: string;
  label: string;
  url: string;
  icon?: string | null;
  category: string;
}

function isFaviconUrl(value: string | null | undefined): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}

const passthroughImageLoader = ({ src }: ImageLoaderProps) => src;

export function BookmarksWidget() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const response = await fetch("/api/bookmarks", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load bookmarks");
        const payload = (await response.json()) as { bookmarks: BookmarkItem[] };
        setBookmarks(payload.bookmarks.slice(0, 6));
      } catch {
        // Silently fail for widget
      } finally {
        setLoading(false);
      }
    };
    void loadBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <BookmarkSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No bookmarks"
        description="Add your favorite links"
        action={{
          label: "Add Bookmark",
          onClick: () => window.location.href = "/bookmarks",
        }}
      />
    );
  }

  // Group by category
  const grouped = bookmarks.reduce(
    (acc, bookmark) => {
      const category = bookmark.category || "Misc";
      if (!acc[category]) acc[category] = [];
      acc[category].push(bookmark);
      return acc;
    },
    {} as Record<string, BookmarkItem[]>
  );

  return (
    <div className="space-y-3" role="list" aria-label="Bookmarks">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {category}
          </h4>
          <ul className="space-y-1.5">
            {items.map((bookmark) => (
              <li key={bookmark.id}>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="widget-row flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted/30"
                  aria-label={`${bookmark.label} - opens in new tab`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/20 text-[10px]">
                    {isFaviconUrl(bookmark.icon) ? (
                      <Image
                        loader={passthroughImageLoader}
                        unoptimized
                        src={bookmark.icon ?? ""}
                        alt=""
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 rounded-sm"
                      />
                    ) : bookmark.icon ? (
                      <span>{bookmark.icon}</span>
                    ) : (
                      <Bookmark className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">{bookmark.label}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}