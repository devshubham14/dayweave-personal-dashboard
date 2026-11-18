import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, LockKeyhole, Palette, User } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Field } from "@/components/common/bits";
import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data/queries";
import { CURRENCIES } from "@/lib/format";
import { pageHead, pageStates } from "@/lib/page";

export const Route = createFileRoute("/_authenticated/settings")({
  head: pageHead("Settings", "Profile, preferences, notifications and data."),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  ...pageStates,
  component: SettingsPage,
});

function SettingsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "INR");
  const [budget, setBudget] = useState(String(profile?.monthly_budget ?? ""));
  const [goal, setGoal] = useState(String(profile?.daily_study_goal_minutes ?? 180));
  const [notifyDeadlines, setNotifyDeadlines] = useState(profile?.notify_deadlines ?? true);
  const [notifyHabits, setNotifyHabits] = useState(profile?.notify_habits ?? true);
  const [notifySummary, setNotifySummary] = useState(profile?.notify_weekly_summary ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    setCurrency(profile.currency ?? "INR");
    setBudget(String(profile.monthly_budget ?? ""));
    setGoal(String(profile.daily_study_goal_minutes ?? 180));
    setNotifyDeadlines(profile.notify_deadlines);
    setNotifyHabits(profile.notify_habits);
    setNotifySummary(profile.notify_weekly_summary);
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profile is not available.");
      const monthlyBudget = budget.trim() ? Number(budget) : 0;
      const studyGoal = Number(goal);
      if (!name.trim()) throw new Error("Enter your name.");
      if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0)
        throw new Error("Enter a valid monthly budget.");
      if (!Number.isFinite(studyGoal) || studyGoal < 1 || studyGoal > 1440)
        throw new Error("Enter a daily study goal from 1 to 1440 minutes.");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          currency,
          monthly_budget: monthlyBudget,
          daily_study_goal_minutes: Math.round(studyGoal),
          notify_deadlines: notifyDeadlines,
          notify_habits: notifyHabits,
          notify_weekly_summary: notifySummary,
        })
        .eq("id", profile.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: (saveError) =>
      setError(saveError instanceof Error ? saveError.message : "Couldn't save settings."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Settings" description="Profile, preferences and notifications." />
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Profile" description="Personal details used across LifeOS" flush>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="settings-name">
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" htmlFor="settings-email">
                <Input id="settings-email" value={profile?.email ?? ""} readOnly disabled />
              </Field>
            </div>
          </Panel>

          <Panel title="Preferences" description="Defaults for your workspace" flush>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="Currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Monthly budget" htmlFor="settings-budget">
                <Input
                  id="settings-budget"
                  inputMode="decimal"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                />
              </Field>
              <Field label="Daily study goal (minutes)" htmlFor="settings-goal">
                <Input
                  id="settings-goal"
                  inputMode="numeric"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value.replace(/\D/g, ""))}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Notifications" description="Choose which reminders matter to you" flush>
            <div className="divide-y">
              <NotificationRow
                icon={Bell}
                title="Deadline reminders"
                description="Surface upcoming tasks and exams."
                checked={notifyDeadlines}
                onChange={setNotifyDeadlines}
              />
              <NotificationRow
                icon={Bell}
                title="Habit reminders"
                description="Highlight routines waiting for a check-in."
                checked={notifyHabits}
                onChange={setNotifyHabits}
              />
              <NotificationRow
                icon={Palette}
                title="Weekly summary"
                description="Receive a progress summary each week."
                checked={notifySummary}
                onChange={setNotifySummary}
              />
            </div>
          </Panel>

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive-soft px-3 py-2 type-caption text-destructive"
            >
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <Panel title="Account" description="Keep account access secure">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                <User className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate type-small font-medium">
                  {profile?.full_name || "Your account"}
                </p>
                <p className="truncate type-caption text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                if (!profile?.email) return;
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                  profile.email,
                  { redirectTo: `${window.location.origin}/reset-password` },
                );
                if (resetError)
                  toast.error("Couldn't send reset email", { description: resetError.message });
                else toast.success("Password reset email sent");
              }}
            >
              <LockKeyhole /> Reset password
            </Button>
          </div>
        </Panel>
      </form>
    </div>
  );
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-small font-medium">{title}</p>
        <p className="type-caption text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
