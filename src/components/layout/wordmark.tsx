import { cn } from "@/lib/utils";

/** LifeOS mark: four quadrants, one filled — the parts of a life, one in focus. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid h-6 w-6 grid-cols-2 gap-[2px] rounded-[6px] bg-foreground p-[5px]", className)} aria-hidden>
      <span className="rounded-[1.5px] bg-primary" />
      <span className="rounded-[1.5px] bg-card/35" />
      <span className="rounded-[1.5px] bg-card/35" />
      <span className="rounded-[1.5px] bg-card/90" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[13px] font-semibold tracking-[0.14em] text-foreground">LIFEOS</span>
    </span>
  );
}
