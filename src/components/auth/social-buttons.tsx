import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";

const GOOGLE_G = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

function LovableHeart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" className="text-foreground">
      <path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 2.8 4.5 6.6 4.1c2.1-.2 3.9.9 5.4 2.7 1.5-1.8 3.3-2.9 5.4-2.7 3.8.4 5.7 4.3 4.2 7.6C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function SocialButtons({ disabled }: { disabled?: boolean | undefined }) {
  const [busy, setBusy] = useState<"google" | "lovable" | null>(null);

  const go = async (provider: "google" | "lovable") => {
    setBusy(provider);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) {
      setBusy(null);
      toast.error("Couldn't sign you in", { description: result.error.message });
      return;
    }
    if ("redirected" in result && result.redirected) return;
    // Session is set; the auth page navigates once it sees the signed-in state.
    setBusy(null);
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => go("google")}
        disabled={disabled || busy !== null}
        className={cn(
          "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-[10px] rounded-md border border-google-border bg-google px-3 text-google-foreground transition-opacity",
          "text-[14px] leading-5 font-medium [font-family:'Google_Sans',var(--font-sans)] disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
        )}
      >
        {GOOGLE_G}
        <span>{busy === "google" ? "Opening Google…" : "Continue with Google"}</span>
      </button>
      <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => go("lovable")} disabled={disabled || busy !== null}>
        <LovableHeart />
        {busy === "lovable" ? "Opening Lovable…" : "Continue with Lovable"}
      </Button>
    </div>
  );
}
