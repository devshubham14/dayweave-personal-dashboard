import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/settings")({
  head: pageHead("Settings", "Profile, preferences, notifications and data."),
  component: Page,
});

function Page() {
  return <ComingSoon title="Settings" description="Profile, preferences, notifications and data." icon={Settings} />;
}
