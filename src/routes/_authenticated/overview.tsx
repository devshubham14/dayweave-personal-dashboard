import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock, Flame, GraduationCap, ListTodo, Plus, Wallet } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { ActivityFeed } from "@/components/common/activity-feed";
import { Chip } from "@/components/common/bits";
import { Panel } from "@/components/common/panel";
import { ProgressRing } from "@/components/common/progress";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { TaskRow } from "@/components/tasks/task-row";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useNow } from "@/hooks/use-now";
import { useToday } from "@/hooks/use-today";
import { useToggleHabit } from "@/lib/data/mutations";
import {
  activityQuery,
  eventsQuery,
  examsQuery,
  expensesQuery,
  habitLogsQuery,
  habitsQuery,
  profileQuery,
  sessionsQuery,
  subjectsQuery,
  tasksQuery,
} from "@/lib/data/queries";
import { daysUntil, firstName, formatCurrency, formatHours, formatMinutes, greetingFor, parseDate, shortTime, timeToMinutes, toISODate } from "@/lib/format";
import {
  countCompleted,
  dailyProgress,
  dailySeries,
  habitStreak,
  monthBounds,
  percentChange,
  prioritise,
  sumExpenses,
  sumMinutes,
  weekBounds,
} from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { asTone, eventTone, toneBar, toneDot } from "@/lib/tones";
import { cn } from "@/lib/utils";

const QUERIES = [profileQuery, tasksQuery, sessionsQuery, subjectsQuery, examsQuery, expensesQuery, habitsQuery, habitLogsQuery, eventsQuery, activityQuery] as const;

export const Route = createFileRoute("/_authenticated/overview")({
  head: pageHead("Overview", "Your day at a glance: schedule, priorities, progress and spending."),
  loader: ({ context }) => Promise.all(QUERIES.map((q) => context.queryClient.ensureQueryData(q as never))),
  ...pageStates,
  component: OverviewPage,
});

function useOverviewData() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: sessions } = useSuspenseQuery(sessionsQuery);
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const { data: exams } = useSuspenseQuery(examsQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: habits } = useSuspenseQuery(habitsQuery);
  const { data: logs } = useSuspenseQuery(habitLogsQuery);
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: activity } = useSuspenseQuery(activityQuery);
  return { profile, tasks, sessions, subjects, exams, expenses, habits, logs, events, activity };
}

function OverviewPage() {
  const d = useOverviewData();
  const today = useToday();
  const now = useNow();
  const dialogs = useDialogs();
  const currency = d.profile?.currency ?? "INR";
  const goal = d.profile?.daily_study_goal_minutes ?? 180;

  const progress = dailyProgress({ tasks: d.tasks, sessions: d.sessions, habits: d.habits, logs: d.logs, today, studyGoalMinutes: goal });
  const week = weekBounds(today);
  const lastWeek = weekBounds(today, -1);
  // Compare like-for-like: this week so far against the same days last week.
  const lastWeekToDate = { start: lastWeek.start, end: toISODate(subDays(parseDate(today), 7)) };
  const dayOfMonth = parseDate(today).getDate();
  const month = monthBounds(today, 0, dayOfMonth);
  const prevMonth = monthBounds(today, -1, dayOfMonth);

  const completedWeek = countCompleted(d.tasks, week.start, today);
  const completedPrev = countCompleted(d.tasks, lastWeekToDate.start, lastWeekToDate.end);
  const studyWeek = sumMinutes(d.sessions, week.start, today);
  const studyPrev = sumMinutes(d.sessions, lastWeekToDate.start, lastWeekToDate.end);
  const open = d.tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.due_date && t.due_date < today).length;
  const spent = sumExpenses(d.expenses, month.start, month.end);
  const spentPrev = sumExpenses(d.expenses, prevMonth.start, prevMonth.end);
  const budget = Number(d.profile?.monthly_budget ?? 0);

  const dueToday = open.filter((t) => t.due_date === today).length;
  const todaysEvents = d.events.filter((e) => e.event_date === today).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const nextExam = d.exams.filter((e) => e.exam_date >= today).sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];

  const summary: string[] = [];
  if (todaysEvents.length) summary.push(`${todaysEvents.length} ${todaysEvents.length === 1 ? "event" : "events"} on your calendar`);
  if (dueToday) summary.push(`${dueToday} ${dueToday === 1 ? "task" : "tasks"} due`);
  if (nextExam) {
    const n = daysUntil(nextExam.exam_date, today);
    summary.push(`${nextExam.title} ${n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`}`);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome */}
      <section className="surface flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="type-caption text-muted-foreground">{format(now, "EEEE, d MMMM")}</p>
          <h1 className="mt-1 type-display text-foreground">
            {greetingFor(now)}, {firstName(d.profile?.full_name)}
          </h1>
          <p className="mt-1 type-body text-muted-foreground">
            {summary.length ? `Today: ${summary.join(" · ")}.` : "A clear day — a good time to plan ahead."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => dialogs.open({ kind: "task", defaults: { due_date: today } })}>
              <Plus /> New task
            </Button>
            <Button size="sm" variant="outline" onClick={() => dialogs.open({ kind: "session" })}>
              <Clock /> Log study
            </Button>
            <Button size="sm" variant="outline" onClick={() => dialogs.open({ kind: "expense" })}>
              <Wallet /> Add expense
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-lg border bg-background/60 p-4 md:min-w-[340px]">
          <ProgressRing value={progress.percent} size={76} stroke={7}>
            <span className="text-center">
              <span className="block type-h2 tabular text-foreground">{progress.percent}%</span>
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="type-overline text-subtle-foreground">Daily progress</p>
            <ProgressLine label="Tasks" value={`${progress.tasks.done}/${progress.tasks.total}`} />
            <ProgressLine label="Study" value={`${formatMinutes(progress.study.minutes)} / ${formatMinutes(progress.study.goal)}`} />
            <ProgressLine label="Habits" value={`${progress.habits.done}/${progress.habits.total}`} />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key statistics">
        <StatCard label="Completed tasks" icon={CheckCircle2} value={completedWeek} change={percentChange(completedWeek, completedPrev)} hint="this week" />
        <StatCard label="Study hours" icon={GraduationCap} value={formatHours(studyWeek)} change={percentChange(studyWeek, studyPrev)} hint="this week" />
        <StatCard label="Pending tasks" icon={ListTodo} value={open.length} hint={overdue ? <span className="text-destructive">{overdue} overdue</span> : "none overdue"} />
        <StatCard
          label="Monthly expenditure"
          icon={Wallet}
          value={formatCurrency(spent, currency)}
          change={percentChange(spent, spentPrev)}
          invert
          hint={budget ? `of ${formatCurrency(budget, currency, { compact: true })} budget` : "this month"}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Today's schedule"
          description={format(now, "EEEE, d MMM")}
          action={
            <Button variant="ghost" size="icon-sm" aria-label="Add event" onClick={() => dialogs.open({ kind: "event", date: today })}>
              <Plus />
            </Button>
          }
        >
          <Schedule events={todaysEvents} nowMinutes={now.getHours() * 60 + now.getMinutes()} onAdd={() => dialogs.open({ kind: "event", date: today })} />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Priority tasks"
          description="Open work, most important first"
          flush
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                All tasks <ArrowRight />
              </Link>
            </Button>
          }
        >
          {open.length === 0 ? (
            <EmptyState
              compact
              icon={CheckCircle2}
              title="Nothing open"
              description="You've cleared your list. Add what's next."
              action={
                <Button size="sm" variant="outline" onClick={() => dialogs.open({ kind: "task" })}>
                  <Plus /> New task
                </Button>
              }
            />
          ) : (
            <div className="divide-y border-t pb-1">
              {prioritise(d.tasks)
                .slice(0, 6)
                .map((t) => (
                  <TaskRow key={t.id} task={t} today={today} />
                ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Weekly productivity" description="Tasks completed and hours studied, last 7 days">
          <WeeklyChart data={dailySeries(d.tasks, d.sessions, today, 7)} />
        </Panel>
        <Panel title="Upcoming deadlines" description="Next two weeks">
          <Deadlines d={d} today={today} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Recent activity">
          {d.activity.length ? (
            <ActivityFeed items={d.activity} currency={currency} limit={7} />
          ) : (
            <EmptyState compact icon={Clock} title="No activity yet" description="Changes you make across LifeOS show up here." />
          )}
        </Panel>
        <Panel
          title="Habits today"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/habits">
                View <ArrowRight />
              </Link>
            </Button>
          }
        >
          <HabitsToday d={d} today={today} />
        </Panel>
      </div>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 type-caption">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium text-foreground">{value}</span>
    </div>
  );
}

function Schedule({ events, nowMinutes, onAdd }: { events: ReturnType<typeof useOverviewData>["events"]; nowMinutes: number; onAdd: () => void }) {
  const dialogs = useDialogs();
  if (!events.length) {
    return (
      <EmptyState
        compact
        icon={CalendarDays}
        title="Nothing scheduled"
        description="Your calendar is clear for today."
        action={
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus /> Add event
          </Button>
        }
      />
    );
  }
  return (
    <ul className="space-y-1.5">
      {events.map((e) => {
        const start = timeToMinutes(e.start_time);
        const end = timeToMinutes(e.end_time);
        const isNow = nowMinutes >= start && nowMinutes < end;
        const past = nowMinutes >= end;
        return (
          <li key={e.id}>
            <button
              onClick={() => dialogs.open({ kind: "event", event: e })}
              className={cn(
                "flex w-full cursor-pointer gap-3 rounded-md border-l-2 py-1.5 pr-2 pl-3 text-left transition-colors hover:bg-accent/70",
                toneBar[eventTone(e.category)],
                isNow && "bg-primary-soft/60",
              )}
            >
              <span className={cn("w-11 shrink-0 pt-px tabular type-caption", past ? "text-subtle-foreground" : "text-muted-foreground")}>{shortTime(e.start_time)}</span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate type-small font-medium", past ? "text-muted-foreground" : "text-foreground")}>{e.title}</span>
                <span className="block truncate type-caption text-muted-foreground">
                  {shortTime(e.start_time)}–{shortTime(e.end_time)}
                  {e.location ? ` · ${e.location}` : ""}
                </span>
              </span>
              {isNow ? <Chip tone="indigo" className="self-center">Now</Chip> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const chartConfig = {
  tasks: { label: "Tasks completed", color: "var(--chart-1)" },
  hours: { label: "Study hours", color: "var(--chart-3)" },
} satisfies ChartConfig;

function WeeklyChart({ data }: { data: ReturnType<typeof dailySeries> }) {
  const totalTasks = data.reduce((s, p) => s + p.tasks, 0);
  const totalHours = Math.round(data.reduce((s, p) => s + p.hours, 0) * 10) / 10;
  return (
    <div>
      <div className="mb-3 flex gap-6">
        <Legend color="bg-chart-1" label="Tasks completed" value={String(totalTasks)} />
        <Legend color="bg-chart-3" label="Study hours" value={`${totalHours}h`} />
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis yAxisId="tasks" allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <YAxis yAxisId="hours" orientation="right" tickLine={false} axisLine={false} width={28} hide />
          <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
          <Bar yAxisId="tasks" dataKey="tasks" fill="var(--color-tasks)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Line yAxisId="hours" dataKey="hours" type="monotone" stroke="var(--color-hours)" strokeWidth={2} dot={{ r: 2.5 }} />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 type-caption text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-sm", color)} /> {label}
      </p>
      <p className="mt-0.5 type-h2 tabular text-foreground">{value}</p>
    </div>
  );
}

function Deadlines({ d, today }: { d: ReturnType<typeof useOverviewData>; today: string }) {
  const dialogs = useDialogs();
  const items = [
    ...d.tasks
      .filter((t) => t.status !== "done" && t.due_date && t.due_date >= today && daysUntil(t.due_date, today) <= 14)
      .map((t) => ({ id: t.id, date: t.due_date as string, title: t.title, meta: t.project, kind: "task" as const, open: () => dialogs.open({ kind: "task", task: t }) })),
    ...d.exams
      .filter((e) => e.exam_date >= today && daysUntil(e.exam_date, today) <= 30)
      .map((e) => ({
        id: e.id,
        date: e.exam_date,
        title: e.title,
        meta: d.subjects.find((s) => s.id === e.subject_id)?.name ?? "Exam",
        kind: "exam" as const,
        open: () => dialogs.open({ kind: "exam", exam: e }),
      })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  if (!items.length) return <EmptyState compact icon={CalendarDays} title="No deadlines soon" description="Due dates and exams in the next two weeks appear here." />;

  return (
    <ul className="-mx-2 space-y-0.5">
      {items.map((it) => {
        const n = daysUntil(it.date, today);
        return (
          <li key={`${it.kind}-${it.id}`}>
            <button onClick={it.open} className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-accent/70">
              <span className="flex w-10 shrink-0 flex-col items-center rounded-md border bg-card py-1 leading-none">
                <span className="type-overline text-[9px] text-subtle-foreground">{format(parseDate(it.date), "MMM")}</span>
                <span className="mt-0.5 type-h3 tabular text-foreground">{format(parseDate(it.date), "d")}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate type-small font-medium text-foreground">{it.title}</span>
                <span className="block truncate type-caption text-muted-foreground">
                  {it.kind === "exam" ? "Exam · " : ""}
                  {it.meta}
                </span>
              </span>
              <span className={cn("shrink-0 tabular type-caption", n <= 1 ? "font-medium text-warning" : "text-muted-foreground")}>
                {n === 0 ? "Today" : n === 1 ? "Tomorrow" : `${n}d`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function HabitsToday({ d, today }: { d: ReturnType<typeof useOverviewData>; today: string }) {
  const toggle = useToggleHabit();
  const dialogs = useDialogs();
  if (!d.habits.length) {
    return (
      <EmptyState
        compact
        icon={Flame}
        title="No habits yet"
        description="Track small routines you want to keep."
        action={
          <Button size="sm" variant="outline" onClick={() => dialogs.open({ kind: "habit" })}>
            <Plus /> New habit
          </Button>
        }
      />
    );
  }
  return (
    <ul className="-mx-2 space-y-0.5">
      {d.habits.map((h) => {
        const dates = d.logs.filter((l) => l.habit_id === h.id).map((l) => l.log_date);
        const done = dates.includes(today);
        const streak = habitStreak(dates, today);
        return (
          <li key={h.id}>
            <button
              onClick={() => toggle.mutate({ habitId: h.id, date: today, done: !done })}
              aria-pressed={done}
              className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-accent/70"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  done ? cn("border-transparent text-primary-foreground", toneDot[asTone(h.color)]) : "border-border-strong bg-card",
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className={cn("min-w-0 flex-1 truncate type-small", done ? "text-muted-foreground" : "text-foreground")}>{h.name}</span>
              <span className="flex items-center gap-1 tabular type-caption text-muted-foreground">
                <Flame className={cn("h-3 w-3", streak > 0 ? "text-warning" : "text-subtle-foreground")} />
                {streak}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
