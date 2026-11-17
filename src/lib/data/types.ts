import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Task = Tables<"tasks">;
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type Subject = Tables<"study_subjects">;
export type StudySession = Tables<"study_sessions">;
export type Exam = Tables<"exams">;
export type Expense = Tables<"expenses">;
export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;
export type CalendarEvent = Tables<"events">;
export type Activity = Tables<"activity">;
export type EventCategory = "work" | "study" | "personal" | "health";
