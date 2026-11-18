import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { EmptyState } from "@/components/common/states";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { examsQuery, eventsQuery, subjectsQuery, tasksQuery } from "@/lib/data/queries";
import { parseDate, shortTime, toISODate } from "@/lib/format";
import { pageHead, pageStates } from "@/lib/page";
import { eventTone, toneDot } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: pageHead("Calendar", "Your events and deadlines by month."),
  loader: ({ context }) =>
    Promise.all(
      [eventsQuery, tasksQuery, examsQuery, subjectsQuery].map((q) =>
        context.queryClient.ensureQueryData(q as never),
      ),
    ),
  ...pageStates,
  component: CalendarPage,
});

function CalendarPage() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: exams } = useSuspenseQuery(examsQuery);
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const today = useToday();
  const dialogs = useDialogs();
  const [month, setMonth] = useState(startOfMonth(parseDate(today)));
  const [selected, setSelected] = useState(today);
  const monthStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const monthEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const selectedEvents = events
    .filter((event) => event.event_date === selected)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const selectedTasks = tasks.filter(
    (task) => task.status !== "done" && task.due_date === selected,
  );
  const selectedExams = exams.filter((exam) => exam.exam_date === selected);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Calendar"
        description="Events, tasks and exams in one view."
        actions={
          <Button onClick={() => dialogs.open({ kind: "event", date: selected })}>
            <Plus /> New event
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel flush>
          <div className="flex h-12 items-center justify-between border-b px-3">
            <h2 className="type-h3">{format(month, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMonth(startOfMonth(parseDate(today)));
                  setSelected(today);
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous month"
                onClick={() => setMonth((current) => addMonths(current, -1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next month"
                onClick={() => setMonth((current) => addMonths(current, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="py-2 text-center type-caption font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const date = toISODate(day);
              const dayEvents = events.filter((event) => event.event_date === date);
              const dayTasks = tasks.filter(
                (task) => task.status !== "done" && task.due_date === date,
              );
              const dayExams = exams.filter((exam) => exam.exam_date === date);
              const count = dayEvents.length + dayTasks.length + dayExams.length;
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={cn(
                    "min-h-24 border-r border-b p-1.5 text-left transition-colors sm:min-h-28 sm:p-2",
                    !isSameMonth(day, month) && "bg-muted/40 text-subtle-foreground",
                    selected === date
                      ? "bg-primary-soft/50 ring-1 ring-inset ring-primary/20"
                      : "hover:bg-accent/40",
                  )}
                  aria-label={`${format(day, "d MMMM yyyy")}, ${count} items`}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full tabular type-caption",
                      date === today && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="mt-1 block space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-muted text-foreground"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            toneDot[eventTone(event.category)],
                          )}
                        />
                        <span className="truncate">{event.title}</span>
                      </span>
                    ))}
                    {dayTasks.slice(0, 1).map((task) => (
                      <span
                        key={task.id}
                        className="block truncate rounded px-1 py-0.5 text-[10px] text-muted-foreground"
                      >
                        • {task.title}
                      </span>
                    ))}
                    {dayExams.slice(0, 1).map((exam) => (
                      <span
                        key={exam.id}
                        className="block truncate rounded px-1 py-0.5 text-[10px] font-medium text-warning"
                      >
                        Exam · {exam.title}
                      </span>
                    ))}
                    {count > 4 ? (
                      <span className="block px-1 type-caption text-subtle-foreground">
                        +{count - 4} more
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          title={format(parseDate(selected), "EEEE, d MMM")}
          description={`${selectedEvents.length + selectedTasks.length + selectedExams.length} items`}
        >
          {selectedEvents.length + selectedTasks.length + selectedExams.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="Nothing scheduled"
              description="This day is clear."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dialogs.open({ kind: "event", date: selected })}
                >
                  <Plus /> Add event
                </Button>
              }
            />
          ) : (
            <ul className="-mx-2 space-y-1">
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={() => dialogs.open({ kind: "event", event })}
                    className="flex w-full gap-3 rounded-md px-2 py-2 text-left hover:bg-accent/70"
                  >
                    <span className="w-11 shrink-0 tabular type-caption text-muted-foreground">
                      {shortTime(event.start_time)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate type-small font-medium">{event.title}</span>
                      <span className="block truncate type-caption text-muted-foreground">
                        {event.location || event.category}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {selectedTasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => dialogs.open({ kind: "task", task })}
                    className="flex w-full gap-3 rounded-md px-2 py-2 text-left hover:bg-accent/70"
                  >
                    <span className="w-11 shrink-0 type-caption text-muted-foreground">Due</span>
                    <span className="truncate type-small font-medium">{task.title}</span>
                  </button>
                </li>
              ))}
              {selectedExams.map((exam) => (
                <li key={exam.id}>
                  <button
                    onClick={() => dialogs.open({ kind: "exam", exam })}
                    className="flex w-full gap-3 rounded-md px-2 py-2 text-left hover:bg-accent/70"
                  >
                    <span className="w-11 shrink-0 type-caption text-warning">Exam</span>
                    <span className="min-w-0">
                      <span className="block truncate type-small font-medium">{exam.title}</span>
                      <span className="block truncate type-caption text-muted-foreground">
                        {subjects.find((subject) => subject.id === exam.subject_id)?.name}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
