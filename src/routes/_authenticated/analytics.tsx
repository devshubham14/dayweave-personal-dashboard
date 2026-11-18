import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: pageHead("Analytics", "Trends in productivity, study, spending and habits."),
  component: Page,
});

function Page() {
  return <ComingSoon title="Analytics" description="Trends in productivity, study, spending and habits." icon={BarChart3} />;
}
