import { addDays, format, startOfWeek, subDays } from "date-fns";

import { parseDate, toISODate } from "@/lib/format";
import type { Expense, Habit, HabitLog, StudySession, Task } from "@/lib/data/types";

/** Local date (yyyy-MM-dd) on which a task was completed, or null. */
export function completedOn(task: Pick<Task, "completed_at">): string | null {
  return task.completed_at ? toISODate(new Date(task.completed_at)) : null;
}

export function isOverdue(task: Pick<Task, "status" | "due_date">, today: string): boolean {
  return task.status !== "done" && !!task.due_date && task.due_date < today;
}

export interface DailyProgress {
  tasks: { done: number; total: number };
  study: { minutes: number; goal: number };
  habits: { done: number; total: number };
  /** 0–100, the average of the parts that apply today. */
  percent: number;
}

/**
 * Today's plan = tasks due today or overdue that are still open, plus tasks
 * completed today; study minutes against the daily goal; habits checked today.
 */
export function dailyProgress(input: {
  tasks: Task[];
  sessions: StudySession[];
  habits: Habit[];
  logs: HabitLog[];
  today: string;
  studyGoalMinutes: number;
}): DailyProgress {
  const { tasks, sessions, habits, logs, today, studyGoalMinutes } = input;

  const doneToday = tasks.filter((t) => t.status === "done" && completedOn(t) === today).length;
  const openDue = tasks.filter((t) => t.status !== "done" && !!t.due_date && t.due_date <= today).length;
  const taskTotal = doneToday + openDue;

  const minutes = sessions.filter((s) => s.session_date === today).reduce((sum, s) => sum + s.minutes, 0);

  const habitIds = new Set(habits.map((h) => h.id));
  const habitsDone = new Set(logs.filter((l) => l.log_date === today && habitIds.has(l.habit_id)).map((l) => l.habit_id)).size;

  const parts: number[] = [];
  if (taskTotal > 0) parts.push(doneToday / taskTotal);
  if (studyGoalMinutes > 0) parts.push(Math.min(1, minutes / studyGoalMinutes));
  if (habits.length > 0) parts.push(habitsDone / habits.length);

  const percent = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : 0;

  return {
    tasks: { done: doneToday, total: taskTotal },
    study: { minutes, goal: studyGoalMinutes },
    habits: { done: habitsDone, total: habits.length },
    percent,
  };
}

/**
 * Consecutive days with a check-in, counting back from today. A streak stays
 * alive through today until the day is over, so it counts from yesterday when
 * today has no check-in yet.
 */
export function habitStreak(logDates: Iterable<string>, today: string): number {
  const set = new Set(logDates);
  let cursor = parseDate(today);
  if (!set.has(today)) cursor = subDays(cursor, 1);
  let streak = 0;
  while (set.has(toISODate(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** Share of days in the last `days` (including today) with a check-in, 0–100. */
export function habitRate(logDates: Iterable<string>, today: string, days = 30): number {
  const set = new Set(logDates);
  let hits = 0;
  for (let i = 0; i < days; i++) {
    if (set.has(toISODate(subDays(parseDate(today), i)))) hits += 1;
  }
  return Math.round((hits / days) * 100);
}

/** Monday-based week containing `date`, as yyyy-MM-dd bounds (inclusive). */
export function weekBounds(date: string, offsetWeeks = 0): { start: string; end: string } {
  const start = addDays(startOfWeek(parseDate(date), { weekStartsOn: 1 }), offsetWeeks * 7);
  return { start: toISODate(start), end: toISODate(addDays(start, 6)) };
}

export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function sumMinutes(sessions: StudySession[], start: string, end: string): number {
  return sessions.filter((s) => inRange(s.session_date, start, end)).reduce((sum, s) => sum + s.minutes, 0);
}

export function countCompleted(tasks: Task[], start: string, end: string): number {
  return tasks.filter((t) => {
    const d = completedOn(t);
    return d !== null && inRange(d, start, end);
  }).length;
}

export function sumExpenses(expenses: Expense[], start: string, end: string): number {
  return expenses.filter((e) => inRange(e.spent_on, start, end)).reduce((sum, e) => sum + Number(e.amount), 0);
}

/** Month bounds for a yyyy-MM-dd date; `throughDay` caps the end (for like-for-like comparisons). */
export function monthBounds(date: string, offsetMonths = 0, throughDay?: number): { start: string; end: string } {
  const d = parseDate(date);
  const first = new Date(d.getFullYear(), d.getMonth() + offsetMonths, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const endDay = throughDay ? Math.min(throughDay, last.getDate()) : last.getDate();
  return { start: toISODate(first), end: toISODate(new Date(first.getFullYear(), first.getMonth(), endDay)) };
}

/** Percentage change from `previous` to `current`, or null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface DayPoint {
  date: string;
  label: string;
  tasks: number;
  hours: number;
}

/** Tasks completed and study hours for each of the last `days` days, oldest first. */
export function dailySeries(tasks: Task[], sessions: StudySession[], today: string, days = 7): DayPoint[] {
  const points: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(parseDate(today), i);
    const iso = toISODate(d);
    points.push({
      date: iso,
      label: days <= 7 ? format(d, "EEE") : format(d, "d MMM"),
      tasks: countCompleted(tasks, iso, iso),
      hours: Math.round((sumMinutes(sessions, iso, iso) / 60) * 10) / 10,
    });
  }
  return points;
}

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

/** Open tasks ordered by priority, then nearest due date. */
export function prioritise(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const p = PRIORITY_RANK[a.priority as keyof typeof PRIORITY_RANK] - PRIORITY_RANK[b.priority as keyof typeof PRIORITY_RANK];
      if (p !== 0) return p;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
}
