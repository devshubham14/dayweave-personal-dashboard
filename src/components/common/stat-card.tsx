import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  hint,
  /** When true, an increase is bad (e.g. spending, pending work). */
  invert = false,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  change?: number | null;
  hint?: (ReactNode) | undefined;
  invert?: boolean;
}) {
  const hasChange = typeof change === "number";
  const up = hasChange && change > 0;
  const good = hasChange && (invert ? change <= 0 : change >= 0);

  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="type-small font-medium text-muted-foreground">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <div className="type-metric text-foreground">{value}</div>
      <div className="flex min-h-4 items-center gap-1.5 type-caption text-muted-foreground">
        {hasChange ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1 py-px font-medium tabular",
              good ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
        ) : null}
        {hint ? <span className="truncate">{hint}</span> : null}
      </div>
    </div>
  );
}
