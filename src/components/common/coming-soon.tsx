import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";

/** Placeholder for pages that are not built yet. */
export function ComingSoon({ title, description, icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title={title} description={description} />
      <div className="surface">
        <EmptyState icon={icon} title="This page is on its way" description="It isn't built yet. Your data is safe and will appear here once it is." />
      </div>
    </div>
  );
}
