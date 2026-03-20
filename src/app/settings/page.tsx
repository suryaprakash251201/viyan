import { SettingsManager } from "@/components/settings/settings-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function SettingsPage() {
  return (
    <SectionPageShell
      title="Settings"
      description="Tune appearance, localization, and account controls."
    >
      <SettingsManager />
    </SectionPageShell>
  );
}
