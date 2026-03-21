import { AiChatManager } from "@/components/ai/ai-chat-manager";
import { SectionPageShell } from "@/components/layout/section-page-shell";

export default function ChatPage() {
  return (
    <SectionPageShell
      title="AI Chat"
      description="Use Gemini or OpenRouter to analyze your workspace and data context."
    >
      <AiChatManager />
    </SectionPageShell>
  );
}
