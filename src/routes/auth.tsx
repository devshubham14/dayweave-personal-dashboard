import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { AuthFrame, OrDivider } from "@/components/auth/auth-frame";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Field } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, safeRedirect } from "@/lib/auth";

type Mode = "signin" | "signup" | "forgot";
type AuthSearch = { mode?: Mode; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const out: AuthSearch = {};
    if (search["mode"] === "signup" || search["mode"] === "forgot" || search["mode"] === "signin") out.mode = search["mode"];
    if (typeof search["redirect"] === "string") out.redirect = search["redirect"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Sign in — LifeOS" },
      { name: "description", content: "Sign in to LifeOS to plan your tasks, study, spending and habits." },
      { property: "og:title", content: "Sign in — LifeOS" },
      { property: "og:description", content: "Sign in to LifeOS to plan your tasks, study, spending and habits." },
    ],
  }),
  component: AuthPage,
});

const COPY: Record<Mode, { title: string; description: string }> = {
  signin: { title: "Welcome back", description: "Sign in to pick up where you left off." },
  signup: { title: "Create your workspace", description: "Tasks, study, money and habits — organised in one place." },
  forgot: { title: "Reset your password", description: "We'll email you a link to choose a new one." },
};

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const mode: Mode = search.mode ?? "signin";
  const target = safeRedirect(search.redirect);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  // Signed-in visitors (including OAuth returns) go straight to the app.
  useEffect(() => {
    let active = true;
    const go = () => active && navigate({ to: target, replace: true });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, target]);

  const setMode = (m: Mode) => {
    setError(null);
    setSent(null);
    navigate({ to: "/auth", search: { mode: m, ...(search.redirect ? { redirect: search.redirect } : {}) }, replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (mode !== "forgot" && password.length < 8) return setError("Passwords are at least 8 characters.");
    if (mode === "signup" && !name.trim()) return setError("Tell us your name.");

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name.trim() } },
        });
        if (err) throw err;
        if (!data.session) setSent("confirm");
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setSent("reset");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthFrame
        title="Check your inbox"
        description={
          <>
            We sent a link to <span className="font-medium text-foreground">{email.trim()}</span>.
          </>
        }
        footer={
          <button className="cursor-pointer font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
            Back to sign in
          </button>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <MailCheck className="h-4 w-4" />
          </span>
          <p className="type-small text-muted-foreground">
            {sent === "confirm"
              ? "Open the email and confirm your address to finish creating your account. You'll land in your new workspace."
              : "Open the email and follow the link to choose a new password. The link expires after an hour."}
          </p>
        </div>
      </AuthFrame>
    );
  }

  const copy = COPY[mode];
  return (
    <AuthFrame
      title={copy.title}
      description={copy.description}
      footer={
        mode === "signin" ? (
          <>
            New to LifeOS?{" "}
            <button className="cursor-pointer font-medium text-primary hover:underline" onClick={() => setMode("signup")}>
              Create an account
            </button>
          </>
        ) : (
          <>
            {mode === "signup" ? "Already have an account? " : "Remembered it? "}
            <button className="cursor-pointer font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
              Sign in
            </button>
          </>
        )
      }
    >
      {mode !== "forgot" ? (
        <>
          <SocialButtons disabled={busy} />
          <OrDivider />
        </>
      ) : null}
      <form onSubmit={submit} noValidate className="space-y-4">
        {mode === "signup" ? (
          <Field label="Full name" htmlFor="auth-name">
            <Input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Mehta" className="h-9" />
          </Field>
        ) : null}
        <Field label="Email" htmlFor="auth-email">
          <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-9" />
        </Field>
        {mode !== "forgot" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="type-caption font-medium text-foreground">
                Password
              </label>
              {mode === "signin" ? (
                <button type="button" className="cursor-pointer type-caption text-muted-foreground hover:text-foreground" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              ) : null}
            </div>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
              className="h-9"
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-md bg-destructive-soft px-3 py-2 type-caption text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </Button>
      </form>
    </AuthFrame>
  );
}
