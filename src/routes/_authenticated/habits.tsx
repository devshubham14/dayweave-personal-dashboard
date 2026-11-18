import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, startOfWeek } from "date-fns";
import { Check, Flame, Plus, Repeat } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { EmptyState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { useToggleHabit } from "@/lib/data/mutations";
import { habitLogsQuery, habitsQuery } from "@/lib/data/queries";
import { parseDate, toISODate } from "@/lib/format";
import { habitStreak } from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { asTone, toneDot } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/habits")({
  head: pageHead("Habits", "Daily check-ins, streaks and consistency."),
  loader: ({ context }) =>
    Promise.all(
      [habitsQuery, habitLogsQuery].map((q) => context.queryClient.ensureQueryData(q as never)),
    ),
  ...pageStates,
  component: HabitsPage,
});

function HabitsPage() {
  const { data: habits } = useSuspenseQuery(habitsQuery);
  const { data: logs } = useSuspenseQuery(habitLogsQuery);
  const today = useToday();
  const dialogs = useDialogs();
  const toggle = useToggleHabit();
  const weekStart = startOfWeek(parseDate(today), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, index) => toISODate(addDays(weekStart, index)));
  const doneToday = habits.filter((habit) =>
    logs.some((log) => log.habit_id === habit.id && log.log_date === today),
  ).length;
  const longest = habits.reduce(
    (best, habit) =>
      Math.max(
        best,
        habitStreak(
          logs.filter((log) => log.habit_id === habit.id).map((log) => log.log_date),
          today,
        ),
      ),
    0,
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Habits"
        description="Daily check-ins, streaks and consistency."
        actions={
          <Button onClick={() => dialogs.open({ kind: "habit" })}>
            <Plus /> New habit
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Done today"
          icon={Check}
          value={`${doneToday}/${habits.length}`}
          hint="habits complete"
        />
        <StatCard label="Longest streak" icon={Flame} value={`${longest}d`} hint="current streak" />
        <StatCard
          label="Active habits"
          icon={Repeat}
          value={habits.length}
          hint="tracked routines"
        />
      </section>

      <Panel title="This week" description="Tap a day to check in" flush>
        {habits.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No habits yet"
            description="Create a routine and check in every day."
            action={
              <Button size="sm" onClick={() => dialogs.open({ kind: "habit" })}>
                <Plus /> Create habit
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[minmax(180px,1.4fr)_repeat(7,minmax(56px,0.4fr))] border-b bg-background/60">
                <div className="px-4 py-2 type-caption font-medium text-muted-foreground">
                  Habit
                </div>
                {weekDates.map((date) => (
                  <div
                    key={date}
                    className={cn(
                      "border-l py-2 text-center type-caption text-muted-foreground",
                      date === today && "text-primary",
                    )}
                  >
                    <span className="block">{format(parseDate(date), "EEE")}</span>
                    <span className="block tabular">{format(parseDate(date), "d")}</span>
                  </div>
                ))}
              </div>
              {habits.map((habit) => {
                const dates = logs
                  .filter((log) => log.habit_id === habit.id)
                  .map((log) => log.log_date);
                const streak = habitStreak(dates, today);
                return (
                  <div
                    key={habit.id}
                    className="grid grid-cols-[minmax(180px,1.4fr)_repeat(7,minmax(56px,0.4fr))] border-b last:border-b-0"
                  >
                    <button
                      onClick={() => dialogs.open({ kind: "habit", habit })}
                      className="flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/40"
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          toneDot[asTone(habit.color)],
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate type-small font-medium">
                        {habit.name}
                      </span>
                      <span className="flex items-center gap-1 type-caption text-muted-foreground">
                        <Flame className="h-3 w-3" />
                        {streak}
                      </span>
                    </button>
                    {weekDates.map((date) => {
                      const done = dates.includes(date);
                      const future = date > today;
                      return (
                        <div key={date} className="flex justify-center border-l py-3">
                          <button
                            disabled={future}
                            aria-label={`${done ? "Uncheck" : "Check"} ${habit.name} for ${format(parseDate(date), "d MMM")}`}
                            aria-pressed={done}
                            onClick={() => toggle.mutate({ habitId: habit.id, date, done: !done })}
                            className={cn(
                              "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition-colors",
                              done
                                ? cn(
                                    "border-transparent text-primary-foreground",
                                    toneDot[asTone(habit.color)],
                                  )
                                : "border-border-strong bg-card hover:border-primary",
                              future && "cursor-not-allowed opacity-35",
                            )}
                          >
                            {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
