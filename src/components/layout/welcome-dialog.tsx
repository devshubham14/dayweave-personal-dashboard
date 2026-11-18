import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Loader2, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LogoMark } from "@/components/layout/wordmark";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data/queries";
import { firstName, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

/** First sign-in: choose between a populated demo workspace and a blank one. */
export function WelcomeDialog() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQuery);
  const [busy, setBusy] = useState<"sample" | "empty" | null>(null);
  const open = !!profile && !profile.onboarded_at;

  const choose = async (kind: "sample" | "empty") => {
    setBusy(kind);
    const { error } =
      kind === "sample" ? await supabase.rpc("load_sample_data", { _today: todayISO() }) : await supabase.rpc("clear_my_data");
    setBusy(null);
    if (error) {
      toast.error("Couldn't set up your workspace", { description: error.message });
      return;
    }
    await qc.invalidateQueries();
    navigate({ to: "/overview" });
    toast.success(kind === "sample" ? "Sample workspace ready" : "Your workspace is ready");
  };

  const options = [
    {
      kind: "sample" as const,
      icon: LayoutGrid,
      title: "Explore with sample data",
      body: "A realistic week of tasks, classes, spending and habits. Clear it anytime in Settings.",
    },
    {
      kind: "empty" as const,
      icon: Square,
      title: "Start from a blank slate",
      body: "An empty workspace you fill in yourself.",
    },
  ];

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-[460px] gap-0 p-0 [&>button]:hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="px-6 pt-6 pb-5">
          <LogoMark className="h-8 w-8 p-[7px]" />
          <DialogTitle className="mt-4 type-h1">Welcome to LifeOS, {firstName(profile?.full_name)}</DialogTitle>
          <DialogDescription className="mt-1 type-small text-muted-foreground">
            How would you like to begin? You can switch later from Settings.
          </DialogDescription>
        </div>
        <div className="space-y-2 px-6 pb-6">
          {options.map((o) => (
            <button
              key={o.kind}
              disabled={busy !== null}
              onClick={() => choose(o.kind)}
              className={cn(
                "group flex w-full cursor-pointer items-start gap-3 rounded-lg border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/40 disabled:cursor-wait",
                o.kind === "sample" && "border-primary/40",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary-soft group-hover:text-primary">
                {busy === o.kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <o.icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block type-h3 text-foreground">{o.title}</span>
                <span className="mt-0.5 block type-caption text-muted-foreground">{o.body}</span>
              </span>
              <ArrowRight className="mt-2 h-4 w-4 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
