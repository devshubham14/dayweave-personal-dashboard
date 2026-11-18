import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: pageHead("Calendar", "Your events and deadlines by month."),
  component: Page,
});

function Page() {
  return <ComingSoon title="Calendar" description="Your events and deadlines by month." icon={CalendarDays} />;
}
