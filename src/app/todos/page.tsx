import { SectionPageShell } from "@/components/layout/section-page-shell";
import { TodoManager } from "@/components/todo/todo-manager";

export default function TodosPage() {
  return (
    <SectionPageShell
      title="Todos"
      description="Plan your day, track progress, and keep priorities clear."
    >
      <TodoManager />
    </SectionPageShell>
  );
}
