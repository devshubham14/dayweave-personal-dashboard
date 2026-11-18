import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Columns3, List, MoreHorizontal, Plus, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { Chip, Segmented } from "@/components/common/bits";
import { PageHeader } from "@/components/common/page-header";
import { PriorityIcon } from "@/components/common/priority";
import { EmptyState } from "@/components/common/states";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { DueText, TaskCheck, TaskRow, useToggleTask } from "@/components/tasks/task-row";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToday } from "@/hooks/use-today";
import { useTable } from "@/lib/data/mutations";
import { tasksQuery } from "@/lib/data/queries";
import type { Task, TaskStatus } from "@/lib/data/types";
import { countCompleted, prioritise, weekBounds } from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: pageHead("Tasks", "Plan, prioritise and finish your work across every project."),
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery),
  ...pageStates,
  component: TasksPage,
});

type Filter = "all" | TaskStatus;
type View = "list" | "board";

const STATUS: { value: TaskStatus; label: string }[] = [
  { value: "in_progress", label: "In progress" },
  { value: "todo", label: "To do" },
  { value: "done", label: "Done" },
];

function TasksPage() {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const today = useToday();
  const dialogs = useDialogs();
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("all");

  const projects = useMemo(() => Array.from(new Set(tasks.map((t) => t.project))).sort(), [tasks]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (project === "all" || t.project === project) &&
        (!q || t.title.toLowerCase().includes(q) || (t.notes ?? "").toLowerCase().includes(q) || t.project.toLowerCase().includes(q)),
    );
  }, [tasks, query, project]);

  const count = (s: TaskStatus) => matches.filter((t) => t.status === s).length;
  const visible = filter === "all" ? matches : matches.filter((t) => t.status === filter);
  const open = tasks.filter((t) => t.status !== "done").length;
  const week = weekBounds(today);
  const filtered = query.trim() !== "" || project !== "all";

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Tasks"
        description={`${open} open · ${countCompleted(tasks, week.start, today)} completed this week`}
        actions={
          <Button onClick={() => dialogs.open({ kind: "task", defaults: project !== "all" ? { project } : {} })}>
            <Plus /> New task
          </Button>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          ariaLabel="Filter by status"
          value={filter}
          onChange={setFilter}
          className="self-start"
          options={[
            { value: "all", label: "All", count: matches.length },
            { value: "todo", label: "To do", count: count("todo") },
            { value: "in_progress", label: "In progress", count: count("in_progress") },
            { value: "done", label: "Done", count: count("done") },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-subtle-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" className="pl-8" aria-label="Search tasks" />
          </div>
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="w-40" aria-label="Filter by project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Segmented
            ariaLabel="Layout"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: <List className="h-3.5 w-3.5" aria-label="List" /> },
              { value: "board", label: <Columns3 className="h-3.5 w-3.5" aria-label="Board" /> },
            ]}
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Capture assignments, errands and goals — then work through them by priority."
            action={
              <Button onClick={() => dialogs.open({ kind: "task" })}>
                <Plus /> Create your first task
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 && view === "list" ? (
        <div className="surface">
          <EmptyState
            icon={SearchX}
            title="No matching tasks"
            description={filtered ? "Try a different search or project." : "Nothing in this status right now."}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setProject("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : view === "list" ? (
        <ListView tasks={visible} today={today} />
      ) : (
        <BoardView tasks={filter === "all" ? matches : visible} today={today} />
      )}
    </div>
  );
}

function sortGroup(tasks: Task[], status: TaskStatus) {
  if (status === "done") return [...tasks].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  return prioritise(tasks);
}

function ListView({ tasks, today }: { tasks: Task[]; today: string }) {
  const dialogs = useDialogs();
  const [showAllDone, setShowAllDone] = useState(false);
  return (
    <div className="surface overflow-hidden">
      {STATUS.map((s) => {
        let group = sortGroup(
          tasks.filter((t) => t.status === s.value),
          s.value,
        );
        if (!group.length) return null;
        const total = group.length;
        if (s.value === "done" && !showAllDone) group = group.slice(0, 8);
        return (
          <section key={s.value} aria-label={s.label}>
            <header className="flex h-9 items-center justify-between border-b bg-background/60 px-5 first:border-t-0">
              <p className="flex items-center gap-2 type-caption font-medium text-foreground">
                <StatusDot status={s.value} /> {s.label}
                <span className="tabular text-subtle-foreground">{total}</span>
              </p>
              {s.value !== "done" ? (
                <Button variant="ghost" size="icon-sm" aria-label={`Add task to ${s.label}`} onClick={() => dialogs.open({ kind: "task", defaults: { status: s.value } })}>
                  <Plus />
                </Button>
              ) : null}
            </header>
            <div className="divide-y border-b last:border-b-0">
              {group.map((t) => (
                <TaskRow key={t.id} task={t} today={today} />
              ))}
            </div>
            {s.value === "done" && total > 8 ? (
              <button className="w-full cursor-pointer py-2 type-caption font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground" onClick={() => setShowAllDone((v) => !v)}>
                {showAllDone ? "Show fewer" : `Show all ${total} completed`}
              </button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        status === "done" ? "bg-success" : status === "in_progress" ? "bg-warning" : "border border-border-strong bg-card",
      )}
      aria-hidden
    />
  );
}

function BoardView({ tasks, today }: { tasks: Task[]; today: string }) {
  const dialogs = useDialogs();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(["todo", "in_progress", "done"] as const).map((status) => {
        const col = sortGroup(
          tasks.filter((t) => t.status === status),
          status,
        );
        const label = STATUS.find((s) => s.value === status)?.label ?? status;
        return (
          <section key={status} className="flex min-w-0 flex-col rounded-lg border bg-muted/50 p-2" aria-label={label}>
            <header className="flex items-center justify-between px-2 py-1.5">
              <p className="flex items-center gap-2 type-caption font-medium text-foreground">
                <StatusDot status={status} /> {label}
                <span className="tabular text-subtle-foreground">{col.length}</span>
              </p>
              <Button variant="ghost" size="icon-sm" aria-label={`Add to ${label}`} onClick={() => dialogs.open({ kind: "task", defaults: { status } })}>
                <Plus />
              </Button>
            </header>
            <div className="space-y-2">
              {col.map((t) => (
                <BoardCard key={t.id} task={t} today={today} />
              ))}
              {col.length === 0 ? <p className="px-2 py-6 text-center type-caption text-subtle-foreground">No tasks</p> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BoardCard({ task, today }: { task: Task; today: string }) {
  const dialogs = useDialogs();
  const toggle = useToggleTask();
  const { update } = useTable("tasks");
  const done = task.status === "done";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => dialogs.open({ kind: "task", task })}
      onKeyDown={(e) => {
        if (e.key === "Enter") dialogs.open({ kind: "task", task });
      }}
      className="group cursor-pointer rounded-md border bg-card p-3 shadow-xs transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className="flex items-start gap-2.5">
        <span className="pt-0.5">
          <TaskCheck task={task} onToggle={() => toggle(task)} />
        </span>
        <p className={cn("min-w-0 flex-1 type-small font-medium", done ? "text-subtle-foreground line-through" : "text-foreground")}>{task.title}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100" aria-label="Task actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel className="type-caption text-muted-foreground">Move to</DropdownMenuLabel>
            {STATUS.filter((s) => s.value !== task.status).map((s) => (
              <DropdownMenuItem
                key={s.value}
                onSelect={() => update.mutate({ id: task.id, values: { status: s.value, completed_at: s.value === "done" ? new Date().toISOString() : null } })}
              >
                <StatusDot status={s.value} /> {s.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => dialogs.open({ kind: "task", task })}>Edit task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2.5 flex items-center gap-2 pl-6.5">
        <PriorityIcon priority={task.priority} />
        <Chip>{task.project}</Chip>
        {task.due_date && !done ? <DueText due={task.due_date} today={today} className="ml-auto" /> : null}
      </div>
    </div>
  );
}
