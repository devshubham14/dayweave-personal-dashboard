import { describe, expect, it } from "vitest";

import { dailyProgress, habitStreak, monthBounds, percentChange, prioritise } from "@/lib/metrics";
import type { Habit, HabitLog, StudySession, Task } from "@/lib/data/types";

const task = (p: Partial<Task>): Task =>
  ({
    id: Math.random().toString(),
    user_id: "u",
    title: "t",
    notes: null,
    status: "todo",
    priority: "medium",
    project: "Personal",
    due_date: null,
    completed_at: null,
    created_at: "2026-11-01T00:00:00Z",
    ...p,
  }) as Task;

describe("habitStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(habitStreak(["2026-11-18", "2026-11-17", "2026-11-16", "2026-11-14"], "2026-11-18")).toBe(3);
  });
  it("keeps yesterday's streak alive when today isn't checked yet", () => {
    expect(habitStreak(["2026-11-17", "2026-11-16"], "2026-11-18")).toBe(2);
  });
  it("is zero when neither today nor yesterday is checked", () => {
    expect(habitStreak(["2026-11-15"], "2026-11-18")).toBe(0);
  });
});

describe("dailyProgress", () => {
  it("averages tasks, study and habits for today", () => {
    const today = "2026-11-18";
    const tasks = [
      task({ status: "done", completed_at: new Date(2026, 10, 18, 9).toISOString(), due_date: today }),
      task({ status: "todo", due_date: today }),
      task({ status: "todo", due_date: "2026-11-25" }), // not due yet — not part of today
    ];
    const sessions = [{ session_date: today, minutes: 90 }] as StudySession[];
    const habits = [{ id: "h1" }, { id: "h2" }] as Habit[];
    const logs = [{ habit_id: "h1", log_date: today }] as HabitLog[];

    const p = dailyProgress({ tasks, sessions, habits, logs, today, studyGoalMinutes: 180 });
    expect(p.tasks).toEqual({ done: 1, total: 2 });
    expect(p.percent).toBe(50); // (0.5 + 0.5 + 0.5) / 3
  });
});

describe("prioritise", () => {
  it("orders open tasks by priority then due date and drops done tasks", () => {
    const list = prioritise([
      task({ title: "low", priority: "low", due_date: "2026-11-18" }),
      task({ title: "done", priority: "urgent", status: "done" }),
      task({ title: "high-later", priority: "high", due_date: "2026-11-25" }),
      task({ title: "high-soon", priority: "high", due_date: "2026-11-19" }),
    ]);
    expect(list.map((t) => t.title)).toEqual(["high-soon", "high-later", "low"]);
  });
});

describe("period helpers", () => {
  it("caps a previous month to the same day for like-for-like comparison", () => {
    expect(monthBounds("2026-11-18", -1, 18)).toEqual({ start: "2026-10-01", end: "2026-10-18" });
  });
  it("returns null change when there is no baseline", () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(12, 10)).toBe(20);
  });
});
