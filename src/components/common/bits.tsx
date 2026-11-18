import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { toneDot, toneSoft, type Tone } from "@/lib/tones";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", toneDot[tone], className)} aria-hidden />;
}

export function Chip({ tone, children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded px-1.5 text-[11px] font-medium whitespace-nowrap",
        tone ? toneSoft[tone] : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: (string) | undefined;
  error?: (string | null) | undefined;
  hint?: (string) | undefined;
  children: ReactNode;
  className?: (string) | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block type-caption font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="type-caption text-destructive">{error}</p>
      ) : hint ? (
        <p className="type-caption text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Compact segmented control for view and range switches. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: (string) | undefined;
  ariaLabel?: (string) | undefined;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("inline-flex h-8 items-center rounded-md border bg-muted p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-full cursor-pointer items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {typeof o.count === "number" ? (
              <span className={cn("tabular text-[11px]", active ? "text-muted-foreground" : "text-subtle-foreground")}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
