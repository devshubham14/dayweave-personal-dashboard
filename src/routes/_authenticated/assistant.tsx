import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: pageHead("AI Assistant", "Ask questions about your tasks, study and spending."),
  component: Page,
});

function Page() {
  return <ComingSoon title="AI Assistant" description="Ask questions about your tasks, study and spending." icon={MessageSquare} />;
}
