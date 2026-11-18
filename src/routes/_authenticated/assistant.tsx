import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Avatar } from "@/components/layout/app-header";
import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToday } from "@/hooks/use-today";
import {
  eventsQuery,
  expensesQuery,
  profileQuery,
  sessionsQuery,
  tasksQuery,
} from "@/lib/data/queries";
import { formatCurrency, formatMinutes } from "@/lib/format";
import { monthBounds, sumExpenses, sumMinutes } from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: pageHead("AI Assistant", "Ask questions about your tasks, study and spending."),
  loader: ({ context }) =>
    Promise.all(
      [profileQuery, tasksQuery, sessionsQuery, expensesQuery, eventsQuery].map((q) =>
        context.queryClient.ensureQueryData(q as never),
      ),
    ),
  ...pageStates,
  component: AssistantPage,
});

type Message = { role: "assistant" | "user"; text: string };

function AssistantPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: sessions } = useSuspenseQuery(sessionsQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: events } = useSuspenseQuery(eventsQuery);
  const today = useToday();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "I can summarize your workload, study time, spending and calendar from the data already in LifeOS.",
    },
  ]);

  const answer = (question: string) => {
    const q = question.toLowerCase();
    const open = tasks.filter((task) => task.status !== "done");
    const overdue = open.filter((task) => task.due_date && task.due_date < today);
    const dueToday = open.filter((task) => task.due_date === today);
    const month = monthBounds(today);
    const spent = sumExpenses(expenses, month.start, month.end);
    const study = sumMinutes(sessions, today, today);
    const todayEvents = events.filter((event) => event.event_date === today);
    const currency = profile?.currency ?? "INR";

    if (/(spend|expense|budget|money)/.test(q)) {
      const budget = Number(profile?.monthly_budget ?? 0);
      return `You have spent ${formatCurrency(spent, currency)} this month${budget ? ` against a ${formatCurrency(budget, currency)} budget` : ""}.`;
    }
    if (/(study|study time|studied|session)/.test(q)) {
      const goal = profile?.daily_study_goal_minutes ?? 180;
      return `You have logged ${formatMinutes(study)} of study today, with a ${formatMinutes(goal)} daily goal. Across the latest entries, ${formatMinutes(sumMinutes(sessions, month.start, month.end))} has been logged this month.`;
    }
    if (/(calendar|schedule|today|event)/.test(q)) {
      return todayEvents.length
        ? `Your calendar has ${todayEvents.length} ${todayEvents.length === 1 ? "event" : "events"} today: ${todayEvents.map((event) => `${event.title} at ${event.start_time.slice(0, 5)}`).join(", ")}.`
        : "Your calendar is clear today.";
    }
    if (/(priority|urgent|task|work)/.test(q)) {
      if (!open.length) return "You have no open tasks.";
      const urgent = overdue.length ? `${overdue.length} overdue` : "no overdue tasks";
      return `You have ${open.length} open tasks, ${dueToday.length} due today, and ${urgent}. ${open
        .slice(0, 3)
        .map((task) => task.title)
        .join(", ")} are closest in your list.`;
    }
    if (/(summary|plan|overview|progress)/.test(q)) {
      return `Today's snapshot: ${open.length} open tasks, ${dueToday.length} due today, ${formatMinutes(study)} studied, ${formatCurrency(spent, currency)} spent this month, and ${todayEvents.length} calendar ${todayEvents.length === 1 ? "event" : "events"}.`;
    }
    return "I can help with tasks, today's calendar, study sessions or monthly spending. Try one of the suggestions below.";
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { role: "user", text },
      { role: "assistant", text: answer(text) },
    ]);
    setPrompt("");
  };

  const quick = [
    "Summarize today",
    "Which tasks need attention?",
    "How much have I studied?",
    "How much did I spend?",
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="AI Assistant" description="Answers grounded in your LifeOS data." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Panel title="Workspace chat" className="min-h-[560px]" flush>
          <div className="flex min-h-[460px] flex-col">
            <div className="flex-1 space-y-4 p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn("flex gap-3", message.role === "user" && "justify-end")}
                >
                  {message.role === "assistant" ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Bot className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2.5 type-small",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card",
                    )}
                  >
                    {message.text}
                  </div>
                  {message.role === "user" ? (
                    <Avatar name={profile?.full_name} className="h-8 w-8 text-xs" />
                  ) : null}
                </div>
              ))}
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t p-3">
              <Input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask about your day…"
                aria-label="Message LifeOS assistant"
              />
              <Button type="submit" size="icon" aria-label="Send message" disabled={!prompt.trim()}>
                <Send />
              </Button>
            </form>
          </div>
        </Panel>
        <Panel title="Suggested prompts">
          <div className="space-y-2">
            {quick.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setPrompt(item);
                }}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left type-small hover:bg-accent/70"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                {item}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
