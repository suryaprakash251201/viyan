import { BookmarksManager } from "@/components/bookmarks/bookmarks-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function BookmarksPage() {
  return (
    <SectionPageShell
      title="Bookmarks"
      description="Your launchpad for frequently used websites and tools."
    >
      <BookmarksManager />
    </SectionPageShell>
  );
}
