import { NotesManager } from "@/components/notes/notes-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function NotesPage() {
  return (
    <SectionPageShell
      title="Notes"
      description="Capture ideas, organize with tags, and find everything instantly."
    >
      <NotesManager />
    </SectionPageShell>
  );
}
