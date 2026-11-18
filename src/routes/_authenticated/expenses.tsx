import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: pageHead("Expenses", "Track spending against your monthly budget."),
  component: Page,
});

function Page() {
  return <ComingSoon title="Expenses" description="Track spending against your monthly budget." icon={Wallet} />;
}
