import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type TableName =
  | "tasks"
  | "study_subjects"
  | "study_sessions"
  | "exams"
  | "expenses"
  | "habits"
  | "habit_logs"
  | "events";

type Row = { id: string } & Record<string, unknown>;

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: string }).message);
  return "Something went wrong";
}

/**
 * Create / update / delete for a table with optimistic cache updates.
 * Activity is refreshed afterwards because database triggers write to it.
 */
export function useTable<T extends TableName>(table: T, options: { related?: QueryKey[] } = {}) {
  const qc = useQueryClient();
  const key: QueryKey = [table];

  const settle = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["activity"] });
    options.related?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };

  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: key });
    return qc.getQueryData<Row[]>(key);
  };
  const rollback = (prev: Row[] | undefined, error: unknown) => {
    if (prev) qc.setQueryData(key, prev);
    toast.error("Couldn't save your change", { description: errorMessage(error) });
  };

  const create = useMutation({
    mutationFn: async (values: TablesInsert<T>) => {
      const { data, error } = await supabase.from(table).insert(values as never).select().single();
      if (error) throw error;
      return data as unknown as Row;
    },
    onMutate: async (values) => {
      const prev = await snapshot();
      const temp = { id: `temp-${crypto.randomUUID()}`, created_at: new Date().toISOString(), ...(values as object) } as Row;
      qc.setQueryData<Row[]>(key, (old) => [temp, ...(old ?? [])]);
      return { prev };
    },
    onError: (error, _v, ctx) => rollback(ctx?.prev, error),
    onSettled: settle,
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<T> }) => {
      const { data, error } = await supabase.from(table).update(values as never).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as Row;
    },
    onMutate: async ({ id, values }) => {
      const prev = await snapshot();
      qc.setQueryData<Row[]>(key, (old) => old?.map((r) => (r.id === id ? { ...r, ...(values as object) } : r)));
      return { prev };
    },
    onError: (error, _v, ctx) => rollback(ctx?.prev, error),
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      const prev = await snapshot();
      qc.setQueryData<Row[]>(key, (old) => old?.filter((r) => r.id !== id));
      return { prev };
    },
    onError: (error, _v, ctx) => rollback(ctx?.prev, error),
    onSettled: settle,
  });

  return { create, update, remove };
}

/** Toggle a habit check-in for a given day. */
export function useToggleHabit() {
  const qc = useQueryClient();
  const key: QueryKey = ["habit_logs"];
  return useMutation({
    mutationFn: async ({ habitId, date, done }: { habitId: string; date: string; done: boolean }) => {
      if (done) {
        const { error } = await supabase.from("habit_logs").insert({ habit_id: habitId, log_date: date });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("log_date", date);
        if (error) throw error;
      }
    },
    onMutate: async ({ habitId, date, done }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Row[]>(key);
      qc.setQueryData<Row[]>(key, (old = []) =>
        done
          ? [{ id: `temp-${habitId}-${date}`, habit_id: habitId, log_date: date } as Row, ...old]
          : old.filter((l) => !(l.habit_id === habitId && l.log_date === date)),
      );
      return { prev };
    },
    onError: (error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Couldn't update habit", { description: errorMessage(error) });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
