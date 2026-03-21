import { SettingsManager } from "@/components/settings/settings-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function SettingsPage() {
  return (
    <SectionPageShell
      title="Settings"
      description="Manage theme, localization, integrations, and account controls."
    >
      <SettingsManager />
    </SectionPageShell>
  );
}
