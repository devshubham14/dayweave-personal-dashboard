import { AlertCircle } from "lucide-react";

import type { TaskPriority } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

/** Signal-bar priority glyph: urgent is a filled alert, others are 1–3 bars. */
export function PriorityIcon({ priority, className }: { priority: string; className?: string }) {
  if (priority === "urgent") {
    return <AlertCircle className={cn("h-3.5 w-3.5 shrink-0 fill-destructive text-card", className)} aria-label="Urgent" />;
  }
  const level = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  return (
    <span className={cn("inline-flex h-3.5 w-3.5 shrink-0 items-end gap-[2px] pb-[2px]", className)} aria-label={`${priority} priority`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-[1px]", i <= level ? "bg-muted-foreground" : "bg-border-strong")}
          style={{ height: `${3 + i * 2.5}px` }}
        />
      ))}
    </span>
  );
}
