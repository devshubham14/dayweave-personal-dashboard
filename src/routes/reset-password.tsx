import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AuthFrame } from "@/components/auth/auth-frame";
import { Field } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — LifeOS" },
      { name: "description", content: "Set a new password for your LifeOS account." },
      { property: "og:title", content: "Choose a new password — LifeOS" },
      { property: "og:description", content: "Set a new password for your LifeOS account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => setReady(isRecovery || !!s.session));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorMessage(err));
    toast.success("Password updated");
    navigate({ to: "/overview", replace: true });
  };

  if (ready === false) {
    return (
      <AuthFrame title="Link expired" description="This reset link is no longer valid. Request a new one to continue.">
        <Button className="w-full" size="lg" onClick={() => navigate({ to: "/auth", search: { mode: "forgot" } })}>
          Request a new link
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Choose a new password" description="You'll use it the next time you sign in.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="New password" htmlFor="new-pass">
          <Input id="new-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
        </Field>
        <Field label="Confirm password" htmlFor="confirm-pass" error={error}>
          <Input id="confirm-pass" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-9" />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={busy || ready === null}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthFrame>
  );
}
