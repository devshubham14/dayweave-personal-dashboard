import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { BookOpen, CalendarClock, Clock3, GraduationCap, Plus } from "lucide-react";

import { Chip } from "@/components/common/bits";
import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { EmptyState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { examsQuery, sessionsQuery, subjectsQuery } from "@/lib/data/queries";
import { daysUntil, formatMinutes, parseDate } from "@/lib/format";
import { sumMinutes, weekBounds } from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { asTone, toneDot } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/study")({
  head: pageHead("Study Planner", "Subjects, study sessions and upcoming exams."),
  loader: ({ context }) =>
    Promise.all(
      [subjectsQuery, sessionsQuery, examsQuery].map((q) =>
        context.queryClient.ensureQueryData(q as never),
      ),
    ),
  ...pageStates,
  component: StudyPage,
});

function StudyPage() {
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const { data: sessions } = useSuspenseQuery(sessionsQuery);
  const { data: exams } = useSuspenseQuery(examsQuery);
  const today = useToday();
  const dialogs = useDialogs();
  const week = weekBounds(today);
  const weekMinutes = sumMinutes(sessions, week.start, week.end);
  const upcoming = exams
    .filter((exam) => exam.exam_date >= today)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Study Planner"
        description="Subjects, study sessions and upcoming exams."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => dialogs.open({ kind: "subject" })}>
              <Plus /> Subject
            </Button>
            <Button onClick={() => dialogs.open({ kind: "session" })}>
              <Clock3 /> Log study
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="This week"
          icon={Clock3}
          value={formatMinutes(weekMinutes)}
          hint="study time"
        />
        <StatCard label="Subjects" icon={BookOpen} value={subjects.length} hint="active" />
        <StatCard
          label="Upcoming exams"
          icon={CalendarClock}
          value={upcoming.length}
          hint="scheduled"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Subjects"
          description="Weekly goals and recorded time"
          flush
        >
          {subjects.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No subjects yet"
              description="Add a subject to organise study sessions and exams."
              action={
                <Button size="sm" onClick={() => dialogs.open({ kind: "subject" })}>
                  <Plus /> Add subject
                </Button>
              }
            />
          ) : (
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {subjects.map((subject) => {
                const minutes = sumMinutes(
                  sessions.filter((session) => session.subject_id === subject.id),
                  week.start,
                  week.end,
                );
                const goal = subject.weekly_goal_hours * 60;
                const percent = goal ? Math.min(100, Math.round((minutes / goal) * 100)) : 0;
                return (
                  <button
                    key={subject.id}
                    onClick={() => dialogs.open({ kind: "subject", subject })}
                    className="group flex min-h-32 flex-col justify-between bg-card p-4 text-left hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-2 type-small font-medium text-foreground">
                        <span
                          className={cn("h-2.5 w-2.5 rounded-full", toneDot[asTone(subject.color)])}
                        />
                        {subject.name}
                      </span>
                      <Chip>{percent}%</Chip>
                    </div>
                    <div className="mt-5">
                      <div className="mb-1.5 flex justify-between type-caption text-muted-foreground">
                        <span>{formatMinutes(minutes)}</span>
                        <span>{subject.weekly_goal_hours}h goal</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", toneDot[asTone(subject.color)])}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Upcoming exams"
          action={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Add exam"
              onClick={() => dialogs.open({ kind: "exam" })}
            >
              <Plus />
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarClock}
              title="No exams scheduled"
              description="Add an exam and keep it in view."
            />
          ) : (
            <ul className="-mx-2 space-y-1">
              {upcoming.slice(0, 6).map((exam) => {
                const subject = subjects.find((item) => item.id === exam.subject_id);
                const days = daysUntil(exam.exam_date, today);
                return (
                  <li key={exam.id}>
                    <button
                      onClick={() => dialogs.open({ kind: "exam", exam })}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent/70"
                    >
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border bg-card leading-none">
                        <span className="type-overline text-[9px] text-subtle-foreground">
                          {format(parseDate(exam.exam_date), "MMM")}
                        </span>
                        <span className="mt-1 type-h3 tabular">
                          {format(parseDate(exam.exam_date), "d")}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate type-small font-medium">{exam.title}</span>
                        <span className="block truncate type-caption text-muted-foreground">
                          {subject?.name ?? "Subject"}
                        </span>
                      </span>
                      <span className="type-caption text-muted-foreground">
                        {days === 0 ? "Today" : `${days}d`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent sessions" description="Your latest study entries" flush>
        {sessions.length === 0 ? (
          <EmptyState
            compact
            icon={Clock3}
            title="No sessions logged"
            description="Log a session to start tracking your study time."
            action={
              <Button size="sm" variant="outline" onClick={() => dialogs.open({ kind: "session" })}>
                <Plus /> Log session
              </Button>
            }
          />
        ) : (
          <div className="divide-y">
            {sessions.slice(0, 12).map((session) => {
              const subject = subjects.find((item) => item.id === session.subject_id);
              return (
                <button
                  key={session.id}
                  onClick={() => dialogs.open({ kind: "session", session })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                >
                  <span
                    className={cn(
                      "h-8 w-1 rounded-full",
                      toneDot[asTone(subject?.color ?? "teal")],
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-small font-medium">
                      {session.topic || subject?.name || "Study session"}
                    </span>
                    <span className="block truncate type-caption text-muted-foreground">
                      {subject?.name ?? "Subject"} ·{" "}
                      {format(parseDate(session.session_date), "d MMM yyyy")}
                    </span>
                  </span>
                  <span className="tabular type-small font-medium">
                    {formatMinutes(session.minutes)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
