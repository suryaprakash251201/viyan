import { FinanceTracker } from "@/components/finance/finance-tracker";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function FinancePage() {
  return (
    <SectionPageShell
      title="Finance Tracker"
      description="Income, expenses, budgets, and trends in one place."
    >
      <FinanceTracker />
    </SectionPageShell>
  );
}
