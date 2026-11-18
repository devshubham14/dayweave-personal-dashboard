import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: (ReactNode) | undefined;
  action?: (ReactNode) | undefined;
  className?: (string) | undefined;
  compact?: (boolean) | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-8" : "gap-3 py-14",
        className,
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-xs">
        <Icon className="h-4 w-4" />
      </span>
      <div className="max-w-xs">
        <p className="type-h3 text-foreground">{title}</p>
        {description ? <p className="mt-1 type-small text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this page. Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: (string) | undefined;
  description?: (string) | undefined;
  onRetry?: (() => void) | undefined;
  className?: (string) | undefined;
}) {
  return (
    <div className={cn("surface flex flex-col items-center gap-3 px-6 py-14 text-center", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive-soft text-destructive">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div className="max-w-sm">
        <p className="type-h3 text-foreground">{title}</p>
        <p className="mt-1 type-small text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw /> Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Generic page skeleton shown while a page's data loads. */
export function PageSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {stats > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="surface space-y-3 p-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface space-y-4 p-5 lg:col-span-2">
          <Skeleton className="h-4 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="surface space-y-4 p-5">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
