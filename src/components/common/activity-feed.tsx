import { CalendarPlus, CheckCircle2, Clock, Plus, Receipt, Repeat, type LucideIcon } from "lucide-react";

import type { Activity } from "@/lib/data/types";
import { formatCurrency, formatMinutes, timeAgo } from "@/lib/format";

const KIND: Record<string, { icon: LucideIcon; verb: (a: Activity, currency: string) => string }> = {
  task_created: { icon: Plus, verb: () => "Added task" },
  task_completed: { icon: CheckCircle2, verb: () => "Completed" },
  expense_added: {
    icon: Receipt,
    verb: (a, c) => `Spent ${formatCurrency(Number(meta(a, "amount") ?? 0), c)} on`,
  },
  study_logged: {
    icon: Clock,
    verb: (a) => `Studied ${formatMinutes(Number(meta(a, "minutes") ?? 0))} ·`,
  },
  habit_checked: { icon: Repeat, verb: () => "Checked in" },
  event_created: { icon: CalendarPlus, verb: () => "Scheduled" },
};

function meta(a: Activity, key: string): unknown {
  return a.meta && typeof a.meta === "object" && !Array.isArray(a.meta) ? (a.meta as Record<string, unknown>)[key] : undefined;
}

export function ActivityFeed({ items, currency, limit = 8 }: { items: Activity[]; currency: string; limit?: number }) {
  return (
    <ol className="relative space-y-0">
      {items.slice(0, limit).map((a, i, arr) => {
        const k = KIND[a.kind] ?? { icon: Plus, verb: () => "Updated" };
        const Icon = k.icon;
        return (
          <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < arr.length - 1 ? <span className="absolute top-7 bottom-0 left-[13px] w-px bg-border" aria-hidden /> : null}
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate type-small text-foreground">
                <span className="text-muted-foreground">{k.verb(a, currency)}</span> <span className="font-medium">{a.title}</span>
              </p>
              <p className="type-caption text-subtle-foreground">{timeAgo(a.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
