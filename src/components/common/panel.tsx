import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: (ReactNode) | undefined;
  description?: (ReactNode) | undefined;
  action?: (ReactNode) | undefined;
  children: ReactNode;
  className?: (string) | undefined;
  bodyClassName?: string;
  /** Remove body padding (for lists and tables that run edge to edge). */
  flush?: boolean;
}) {
  return (
    <section className={cn("surface flex min-w-0 flex-col", className)}>
      {title || action ? (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title ? <h2 className="type-h2 text-foreground">{title}</h2> : null}
            {description ? <p className="mt-0.5 type-caption text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("flex-1", !flush && "px-5 pb-5", !title && !action && !flush && "pt-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
