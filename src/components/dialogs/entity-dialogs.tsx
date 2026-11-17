import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/common/bits";
import { PRIORITIES } from "@/components/common/priority";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { TonePicker } from "@/components/dialogs/tone-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTable } from "@/lib/data/mutations";
import { profileQuery, subjectsQuery, tasksQuery } from "@/lib/data/queries";
import type { CalendarEvent, Exam, Expense, Habit, StudySession, Subject, Task } from "@/lib/data/types";
import { todayISO } from "@/lib/format";
import { EVENT_CATEGORIES, EXPENSE_CATEGORIES, asTone, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

type BaseProps = { open: boolean; onOpenChange: (o: boolean) => void };

function SimpleSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ Task */

export function TaskDialog({ open, onOpenChange, task, defaults }: BaseProps & { task?: Task; defaults?: Partial<Task> }) {
  const { create, update, remove } = useTable("tasks");
  const { data: tasks = [] } = useQuery(tasksQuery);
  const projects = Array.from(new Set(["Personal", "Coursework", "Internship", "Career", "Health", ...tasks.map((t) => t.project)]));

  const [title, setTitle] = useState(task?.title ?? defaults?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [status, setStatus] = useState<string>(task?.status ?? defaults?.status ?? "todo");
  const [priority, setPriority] = useState<string>(task?.priority ?? defaults?.priority ?? "medium");
  const [project, setProject] = useState(task?.project ?? defaults?.project ?? "Personal");
  const [due, setDue] = useState(task?.due_date ?? defaults?.due_date ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) return setError("Give the task a title.");
    const values = {
      title: title.trim(),
      notes: notes.trim() || null,
      status,
      priority,
      project: project.trim() || "Personal",
      due_date: due || null,
    };
    if (task) {
      update.mutate({ id: task.id, values });
      toast.success("Task updated");
    } else {
      create.mutate(values);
      toast.success("Task created");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      submitLabel={task ? "Save changes" : "Create task"}
      onSubmit={submit}
      onDelete={
        task
          ? () => {
              remove.mutate(task.id);
              toast("Task deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Title" htmlFor="task-title" error={error}>
        <Input
          id="task-title"
          autoFocus
          value={title}
          aria-invalid={!!error}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="e.g. Submit lab report"
        />
      </Field>
      <Field label="Notes" htmlFor="task-notes">
        <Textarea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add details (optional)" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <SimpleSelect
            value={status}
            onChange={setStatus}
            options={[
              { value: "todo", label: "To do" },
              { value: "in_progress", label: "In progress" },
              { value: "done", label: "Done" },
            ]}
          />
        </Field>
        <Field label="Priority">
          <SimpleSelect value={priority} onChange={setPriority} options={PRIORITIES} />
        </Field>
        <Field label="Project" htmlFor="task-project">
          <Input id="task-project" list="task-projects" value={project} onChange={(e) => setProject(e.target.value)} />
          <datalist id="task-projects">
            {projects.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Due date" htmlFor="task-due">
          <Input id="task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
    </FormDialog>
  );
}

/* --------------------------------------------------------------- Expense */

export function ExpenseDialog({ open, onOpenChange, expense }: BaseProps & { expense?: Expense }) {
  const { create, update, remove } = useTable("expenses");
  const { data: profile } = useQuery(profileQuery);
  const currency = profile?.currency ?? "INR";

  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState(expense?.category ?? "Food & dining");
  const [date, setDate] = useState(expense?.spent_on ?? todayISO());
  const [note, setNote] = useState(expense?.note ?? "");
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  const submit = () => {
    const value = Number(amount);
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Add a short description.";
    if (!amount || !Number.isFinite(value) || value <= 0) next.amount = "Enter an amount above zero.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const values = { title: title.trim(), amount: Math.round(value * 100) / 100, category, spent_on: date || todayISO(), note: note.trim() || null };
    if (expense) {
      update.mutate({ id: expense.id, values });
      toast.success("Expense updated");
    } else {
      create.mutate(values);
      toast.success("Expense added");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? "Edit expense" : "Add expense"}
      submitLabel={expense ? "Save changes" : "Add expense"}
      onSubmit={submit}
      onDelete={
        expense
          ? () => {
              remove.mutate(expense.id);
              toast("Expense deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Description" htmlFor="exp-title" error={errors.title}>
        <Input id="exp-title" autoFocus value={title} aria-invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Groceries" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Amount (${currency})`} htmlFor="exp-amount" error={errors.amount}>
          <Input
            id="exp-amount"
            inputMode="decimal"
            className="tabular"
            value={amount}
            aria-invalid={!!errors.amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
          />
        </Field>
        <Field label="Date" htmlFor="exp-date">
          <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Category">
        <SimpleSelect value={category} onChange={setCategory} options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.value }))} />
      </Field>
      <Field label="Note" htmlFor="exp-note">
        <Input id="exp-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </Field>
    </FormDialog>
  );
}

/* --------------------------------------------------------- Study session */

export function SessionDialog({
  open,
  onOpenChange,
  session,
  defaults,
}: BaseProps & { session?: StudySession; defaults?: Partial<StudySession> }) {
  const { create, update, remove } = useTable("study_sessions");
  const { data: subjects = [] } = useQuery(subjectsQuery);

  const [subjectId, setSubjectId] = useState(session?.subject_id ?? defaults?.subject_id ?? subjects[0]?.id ?? "");
  const [topic, setTopic] = useState(session?.topic ?? defaults?.topic ?? "");
  const [minutes, setMinutes] = useState(String(session?.minutes ?? defaults?.minutes ?? 45));
  const [date, setDate] = useState(session?.session_date ?? todayISO());
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const m = Number(minutes);
    if (!subjectId) return setError("Add a subject first.");
    if (!Number.isFinite(m) || m <= 0 || m > 1440) return setError("Enter between 1 and 1440 minutes.");
    const values = { subject_id: subjectId, topic: topic.trim(), minutes: Math.round(m), session_date: date || todayISO() };
    if (session) {
      update.mutate({ id: session.id, values });
      toast.success("Session updated");
    } else {
      create.mutate(values);
      toast.success("Study session logged");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={session ? "Edit session" : "Log study session"}
      submitLabel={session ? "Save changes" : "Log session"}
      onSubmit={submit}
      onDelete={
        session
          ? () => {
              remove.mutate(session.id);
              toast("Session deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Subject" error={subjects.length === 0 ? "Add a subject on the Study Planner page first." : undefined}>
        <SimpleSelect value={subjectId} onChange={setSubjectId} placeholder="Choose a subject" options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
      </Field>
      <Field label="Topic" htmlFor="ses-topic">
        <Input id="ses-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What did you work on?" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration (minutes)" htmlFor="ses-min" error={error}>
          <Input id="ses-min" inputMode="numeric" className="tabular" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Date" htmlFor="ses-date">
          <Input id="ses-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-1.5">
        {[25, 45, 60, 90, 120].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(String(m))}
            className={cn(
              "h-6 cursor-pointer rounded border px-2 text-[11px] font-medium transition-colors tabular",
              Number(minutes) === m ? "border-primary bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {m}m
          </button>
        ))}
      </div>
    </FormDialog>
  );
}

/* ----------------------------------------------------------------- Event */

export function EventDialog({ open, onOpenChange, event, date }: BaseProps & { event?: CalendarEvent; date?: string }) {
  const { create, update, remove } = useTable("events");
  const [title, setTitle] = useState(event?.title ?? "");
  const [day, setDay] = useState(event?.event_date ?? date ?? todayISO());
  const [start, setStart] = useState(event?.start_time.slice(0, 5) ?? "09:00");
  const [end, setEnd] = useState(event?.end_time.slice(0, 5) ?? "10:00");
  const [category, setCategory] = useState<string>(event?.category ?? "personal");
  const [location, setLocation] = useState(event?.location ?? "");
  const [errors, setErrors] = useState<{ title?: string; time?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Give the event a title.";
    if (end <= start) next.time = "End time must be after the start time.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const values = { title: title.trim(), event_date: day, start_time: start, end_time: end, category, location: location.trim() || null };
    if (event) {
      update.mutate({ id: event.id, values });
      toast.success("Event updated");
    } else {
      create.mutate(values);
      toast.success("Event added to your calendar");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={event ? "Edit event" : "New event"}
      submitLabel={event ? "Save changes" : "Add event"}
      onSubmit={submit}
      onDelete={
        event
          ? () => {
              remove.mutate(event.id);
              toast("Event deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Title" htmlFor="ev-title" error={errors.title}>
        <Input id="ev-title" autoFocus value={title} aria-invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study group" />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Date" htmlFor="ev-date" className="col-span-2 sm:col-span-1">
          <Input id="ev-date" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <Field label="Starts" htmlFor="ev-start">
          <Input id="ev-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Ends" htmlFor="ev-end">
          <Input id="ev-end" type="time" value={end} aria-invalid={!!errors.time} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      {errors.time ? <p className="-mt-2 type-caption text-destructive">{errors.time}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <SimpleSelect value={category} onChange={setCategory} options={EVENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
        </Field>
        <Field label="Location" htmlFor="ev-loc">
          <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
        </Field>
      </div>
    </FormDialog>
  );
}

/* ----------------------------------------------------------------- Habit */

export function HabitDialog({ open, onOpenChange, habit }: BaseProps & { habit?: Habit }) {
  const { create, update, remove } = useTable("habits", { related: [["habit_logs"]] });
  const [name, setName] = useState(habit?.name ?? "");
  const [target, setTarget] = useState(String(habit?.target_per_week ?? 7));
  const [tone, setTone] = useState<Tone>(asTone(habit?.color ?? "indigo"));
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setError("Name the habit.");
    const values = { name: name.trim(), target_per_week: Number(target), color: tone };
    if (habit) {
      update.mutate({ id: habit.id, values });
      toast.success("Habit updated");
    } else {
      create.mutate(values);
      toast.success("Habit created");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={habit ? "Edit habit" : "New habit"}
      submitLabel={habit ? "Save changes" : "Create habit"}
      onSubmit={submit}
      onDelete={
        habit
          ? () => {
              remove.mutate(habit.id);
              toast("Habit deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Name" htmlFor="habit-name" error={error}>
        <Input id="habit-name" autoFocus value={name} aria-invalid={!!error} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stretch for 10 minutes" />
      </Field>
      <Field label="Target" hint="How many days a week you aim to do this.">
        <SimpleSelect
          value={target}
          onChange={setTarget}
          options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: n === 7 ? "Every day" : `${n}× per week` }))}
        />
      </Field>
      <Field label="Colour">
        <TonePicker value={tone} onChange={setTone} />
      </Field>
    </FormDialog>
  );
}

/* --------------------------------------------------------------- Subject */

export function SubjectDialog({ open, onOpenChange, subject }: BaseProps & { subject?: Subject }) {
  const { create, update, remove } = useTable("study_subjects", { related: [["study_sessions"], ["exams"]] });
  const [name, setName] = useState(subject?.name ?? "");
  const [goal, setGoal] = useState(String(subject?.weekly_goal_hours ?? 5));
  const [tone, setTone] = useState<Tone>(asTone(subject?.color ?? "teal"));
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const g = Number(goal);
    if (!name.trim()) return setError("Name the subject.");
    if (!Number.isFinite(g) || g <= 0 || g > 100) return setError("Weekly goal must be between 0.5 and 100 hours.");
    const values = { name: name.trim(), weekly_goal_hours: g, color: tone };
    if (subject) {
      update.mutate({ id: subject.id, values });
      toast.success("Subject updated");
    } else {
      create.mutate(values);
      toast.success("Subject added");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={subject ? "Edit subject" : "Add subject"}
      description={subject ? "Deleting a subject also removes its sessions and exams." : undefined}
      submitLabel={subject ? "Save changes" : "Add subject"}
      onSubmit={submit}
      onDelete={
        subject
          ? () => {
              remove.mutate(subject.id);
              toast("Subject deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Name" htmlFor="sub-name" error={error}>
        <Input id="sub-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Operating Systems" />
      </Field>
      <Field label="Weekly goal (hours)" htmlFor="sub-goal">
        <Input id="sub-goal" inputMode="decimal" className="tabular" value={goal} onChange={(e) => setGoal(e.target.value.replace(/[^0-9.]/g, ""))} />
      </Field>
      <Field label="Colour">
        <TonePicker value={tone} onChange={setTone} />
      </Field>
    </FormDialog>
  );
}

/* ------------------------------------------------------------------ Exam */

export function ExamDialog({ open, onOpenChange, exam }: BaseProps & { exam?: Exam }) {
  const { create, update, remove } = useTable("exams");
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const [title, setTitle] = useState(exam?.title ?? "");
  const [subjectId, setSubjectId] = useState(exam?.subject_id ?? subjects[0]?.id ?? "");
  const [date, setDate] = useState(exam?.exam_date ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) return setError("Name the exam.");
    if (!subjectId) return setError("Add a subject first.");
    if (!date) return setError("Pick the exam date.");
    const values = { title: title.trim(), subject_id: subjectId, exam_date: date };
    if (exam) {
      update.mutate({ id: exam.id, values });
      toast.success("Exam updated");
    } else {
      create.mutate(values);
      toast.success("Exam added");
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={exam ? "Edit exam" : "Add exam"}
      submitLabel={exam ? "Save changes" : "Add exam"}
      onSubmit={submit}
      onDelete={
        exam
          ? () => {
              remove.mutate(exam.id);
              toast("Exam deleted");
              onOpenChange(false);
            }
          : undefined
      }
    >
      <Field label="Exam" htmlFor="exam-title" error={error}>
        <Input id="exam-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. End-semester exam" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <SimpleSelect value={subjectId} onChange={setSubjectId} placeholder="Choose" options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Date" htmlFor="exam-date">
          <Input id="exam-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
    </FormDialog>
  );
}
