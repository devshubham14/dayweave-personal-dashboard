import { Check } from "lucide-react";

import { Chip } from "@/components/common/bits";
import { PriorityIcon } from "@/components/common/priority";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useTable } from "@/lib/data/mutations";
import type { Task } from "@/lib/data/types";
import { dueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function useToggleTask() {
  const { update } = useTable("tasks");
  return (task: Task) => {
    const done = task.status !== "done";
    update.mutate({
      id: task.id,
      values: { status: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null },
    });
  };
}

export function TaskCheck({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const done = task.status === "done";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
        done
          ? "border-primary bg-primary text-primary-foreground"
          : task.status === "in_progress"
            ? "border-warning bg-warning-soft hover:border-primary"
            : "border-border-strong bg-card hover:border-primary",
      )}
    >
      {done ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : null}
    </button>
  );
}

const dueTone = {
  overdue: "text-destructive",
  today: "text-warning",
  soon: "text-muted-foreground",
  later: "text-subtle-foreground",
} as const;

export function DueText({ due, today, className }: { due: string; today: string; className?: string | undefined }) {
  const d = dueLabel(due, today);
  return <span className={cn("tabular type-caption whitespace-nowrap", dueTone[d.tone], className)}>{d.label}</span>;
}

/** One-line task row used on the overview and the task list. */
export function TaskRow({ task, today, showProject = true }: { task: Task; today: string; showProject?: boolean }) {
  const toggle = useToggleTask();
  const dialogs = useDialogs();
  const done = task.status === "done";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => dialogs.open({ kind: "task", task })}
      onKeyDown={(e) => {
        if (e.key === "Enter") dialogs.open({ kind: "task", task });
      }}
      className="group flex h-10 cursor-pointer items-center gap-3 px-5 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
    >
      <TaskCheck task={task} onToggle={() => toggle(task)} />
      <PriorityIcon priority={task.priority} />
      <span className={cn("min-w-0 flex-1 truncate type-small", done ? "text-subtle-foreground line-through" : "text-foreground")}>{task.title}</span>
      {showProject ? <Chip className="hidden sm:inline-flex">{task.project}</Chip> : null}
      {task.due_date && !done ? <DueText due={task.due_date} today={today} className="w-20 text-right" /> : <span className="w-20" />}
    </div>
  );
}
