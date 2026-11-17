import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * One query per table. Row-level security scopes every read to the signed-in
 * user, so no user filter is needed here.
 */
async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error instanceof Error ? error : new Error((error as { message?: string }).message ?? "Request failed");
  return (data ?? ([] as unknown)) as T;
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
});

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: () => unwrap(supabase.from("tasks").select("*").order("created_at", { ascending: false })),
});

export const subjectsQuery = queryOptions({
  queryKey: ["study_subjects"],
  queryFn: () => unwrap(supabase.from("study_subjects").select("*").order("created_at")),
});

export const sessionsQuery = queryOptions({
  queryKey: ["study_sessions"],
  queryFn: () =>
    unwrap(
      supabase
        .from("study_sessions")
        .select("*")
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ),
});

export const examsQuery = queryOptions({
  queryKey: ["exams"],
  queryFn: () => unwrap(supabase.from("exams").select("*").order("exam_date")),
});

export const expensesQuery = queryOptions({
  queryKey: ["expenses"],
  queryFn: () =>
    unwrap(
      supabase
        .from("expenses")
        .select("*")
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false }),
    ),
});

export const habitsQuery = queryOptions({
  queryKey: ["habits"],
  queryFn: () => unwrap(supabase.from("habits").select("*").order("created_at")),
});

export const habitLogsQuery = queryOptions({
  queryKey: ["habit_logs"],
  queryFn: () => unwrap(supabase.from("habit_logs").select("*").order("log_date", { ascending: false })),
});

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: () =>
    unwrap(supabase.from("events").select("*").order("event_date").order("start_time")),
});

export const activityQuery = queryOptions({
  queryKey: ["activity"],
  queryFn: () =>
    unwrap(supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(25)),
});
