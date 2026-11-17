import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Bell, CalendarClock, GraduationCap, Repeat } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { examsQuery, habitLogsQuery, habitsQuery, profileQuery, subjectsQuery, tasksQuery } from "@/lib/data/queries";
import { daysUntil, todayISO } from "@/lib/format";
import type { NavPath } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  icon: typeof Bell;
  tone: "danger" | "warning" | "default";
  title: string;
  body: string;
  to: NavPath;
}

const READ_KEY = "lifeos:read-notifications";

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQuery);
  const { data: tasks = [] } = useQuery(tasksQuery);
  const { data: exams = [] } = useQuery(examsQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const { data: habits = [] } = useQuery(habitsQuery);
  const { data: logs = [] } = useQuery(habitLogsQuery);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setRead(new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[]));
    } catch {
      setRead(new Set());
    }
  }, []);

  const notices = useMemo<Notice[]>(() => {
    const today = todayISO();
    const list: Notice[] = [];
    const wantDeadlines = profile?.notify_deadlines ?? true;
    const wantHabits = profile?.notify_habits ?? true;

    if (wantDeadlines) {
      const overdue = tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < today);
      if (overdue.length) {
        list.push({
          id: `overdue-${today}-${overdue.length}`,
          icon: AlertCircle,
          tone: "danger",
          title: `${overdue.length} overdue ${overdue.length === 1 ? "task" : "tasks"}`,
          body: overdue.slice(0, 2).map((t) => t.title).join(" · "),
          to: "/tasks",
        });
      }
      const dueToday = tasks.filter((t) => t.status !== "done" && t.due_date === today);
      if (dueToday.length) {
        list.push({
          id: `due-${today}-${dueToday.length}`,
          icon: CalendarClock,
          tone: "warning",
          title: `${dueToday.length} ${dueToday.length === 1 ? "task" : "tasks"} due today`,
          body: dueToday.slice(0, 2).map((t) => t.title).join(" · "),
          to: "/tasks",
        });
      }
      exams
        .filter((e) => {
          const d = daysUntil(e.exam_date, today);
          return d >= 0 && d <= 10;
        })
        .forEach((e) => {
          const d = daysUntil(e.exam_date, today);
          list.push({
            id: `exam-${e.id}-${d}`,
            icon: GraduationCap,
            tone: "default",
            title: `${e.title} ${d === 0 ? "is today" : `in ${d} ${d === 1 ? "day" : "days"}`}`,
            body: subjects.find((s) => s.id === e.subject_id)?.name ?? "Study",
            to: "/study",
          });
        });
    }
    if (wantHabits && habits.length) {
      const doneIds = new Set(logs.filter((l) => l.log_date === today).map((l) => l.habit_id));
      const left = habits.filter((h) => !doneIds.has(h.id));
      if (left.length) {
        list.push({
          id: `habits-${today}-${left.length}`,
          icon: Repeat,
          tone: "default",
          title: `${left.length} ${left.length === 1 ? "habit" : "habits"} left today`,
          body: left.slice(0, 3).map((h) => h.name).join(" · "),
          to: "/habits",
        });
      }
    }
    return list;
  }, [tasks, exams, subjects, habits, logs, profile]);

  const unread = notices.filter((n) => !read.has(n.id)).length;

  const persist = (next: Set<string>) => {
    setRead(next);
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next).slice(-200)));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell />
          {unread ? <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-card bg-primary" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="type-h3">Notifications</p>
          {unread ? (
            <button className="cursor-pointer type-caption font-medium text-primary hover:underline" onClick={() => persist(new Set([...read, ...notices.map((n) => n.id)]))}>
              Mark all as read
            </button>
          ) : null}
        </div>
        {notices.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="type-h3">You're all caught up</p>
            <p className="mt-1 type-caption text-muted-foreground">Deadlines and reminders will appear here.</p>
          </div>
        ) : (
          <ul className="max-h-[360px] divide-y overflow-y-auto scrollbar-thin">
            {notices.map((n) => {
              const isUnread = !read.has(n.id);
              return (
                <li key={n.id}>
                  <button
                    className="flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60"
                    onClick={() => {
                      persist(new Set([...read, n.id]));
                      setOpen(false);
                      navigate({ to: n.to });
                    }}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        n.tone === "danger" && "bg-destructive-soft text-destructive",
                        n.tone === "warning" && "bg-warning-soft text-warning",
                        n.tone === "default" && "bg-muted text-muted-foreground",
                      )}
                    >
                      <n.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block type-small", isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>{n.title}</span>
                      <span className="block truncate type-caption text-muted-foreground">{n.body}</span>
                    </span>
                    {isUnread ? <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
