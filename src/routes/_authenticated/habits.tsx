import { createFileRoute } from "@tanstack/react-router";
import { Repeat } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/habits")({
  head: pageHead("Habits", "Daily check-ins, streaks and consistency."),
  component: Page,
});

function Page() {
  return <ComingSoon title="Habits" description="Daily check-ins, streaks and consistency." icon={Repeat} />;
}
