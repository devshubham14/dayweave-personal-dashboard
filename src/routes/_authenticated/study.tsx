import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { pageHead } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/study")({
  head: pageHead("Study Planner", "Subjects, study sessions and upcoming exams."),
  component: Page,
});

function Page() {
  return <ComingSoon title="Study Planner" description="Subjects, study sessions and upcoming exams." icon={GraduationCap} />;
}
