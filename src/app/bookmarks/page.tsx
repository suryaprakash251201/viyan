import { BookmarksManager } from "@/components/bookmarks/bookmarks-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function BookmarksPage() {
  return (
    <SectionPageShell
      title="Quick Links"
      description="Your personal launchpad for fast access to frequently used sites."
    >
      <BookmarksManager />
    </SectionPageShell>
  );
}
