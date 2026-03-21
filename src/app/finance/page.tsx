import { FinanceTracker } from "@/components/finance/finance-tracker";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function FinancePage() {
  return (
    <SectionPageShell
      title="Finance"
      description="Track income, expenses, budgets, and trends with INR-first analytics."
    >
      <FinanceTracker />
    </SectionPageShell>
  );
}
