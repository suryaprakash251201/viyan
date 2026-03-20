import { NotesManager } from "@/components/notes/notes-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function NotesPage() {
  return (
    <SectionPageShell
      title="Notes"
      description="Capture ideas, organize them with tags, and keep them searchable."
    >
      <NotesManager />
    </SectionPageShell>
  );
}
