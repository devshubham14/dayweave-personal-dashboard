import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  EventDialog,
  ExamDialog,
  ExpenseDialog,
  HabitDialog,
  SessionDialog,
  SubjectDialog,
  TaskDialog,
} from "@/components/dialogs/entity-dialogs";
import type { CalendarEvent, Exam, Expense, Habit, StudySession, Subject, Task } from "@/lib/data/types";

export type DialogRequest =
  | { kind: "task"; task?: Task; defaults?: Partial<Task> }
  | { kind: "expense"; expense?: Expense }
  | { kind: "session"; session?: StudySession; defaults?: Partial<StudySession> }
  | { kind: "event"; event?: CalendarEvent; date?: string }
  | { kind: "habit"; habit?: Habit }
  | { kind: "subject"; subject?: Subject }
  | { kind: "exam"; exam?: Exam };

const DialogsContext = createContext<{ open: (req: DialogRequest) => void } | null>(null);

/** Hosts every create/edit dialog once, so any page or the command menu can open them. */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<DialogRequest | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const open = useCallback((r: DialogRequest) => {
    setReq(r);
    setNonce((n) => n + 1);
    setIsOpen(true);
  }, []);
  const value = useMemo(() => ({ open }), [open]);
  const onOpenChange = (o: boolean) => setIsOpen(o);
  const key = `${req?.kind}-${nonce}`;

  return (
    <DialogsContext.Provider value={value}>
      {children}
      {req?.kind === "task" ? <TaskDialog key={key} open={isOpen} onOpenChange={onOpenChange} task={req.task} defaults={req.defaults} /> : null}
      {req?.kind === "expense" ? <ExpenseDialog key={key} open={isOpen} onOpenChange={onOpenChange} expense={req.expense} /> : null}
      {req?.kind === "session" ? <SessionDialog key={key} open={isOpen} onOpenChange={onOpenChange} session={req.session} defaults={req.defaults} /> : null}
      {req?.kind === "event" ? <EventDialog key={key} open={isOpen} onOpenChange={onOpenChange} event={req.event} date={req.date} /> : null}
      {req?.kind === "habit" ? <HabitDialog key={key} open={isOpen} onOpenChange={onOpenChange} habit={req.habit} /> : null}
      {req?.kind === "subject" ? <SubjectDialog key={key} open={isOpen} onOpenChange={onOpenChange} subject={req.subject} /> : null}
      {req?.kind === "exam" ? <ExamDialog key={key} open={isOpen} onOpenChange={onOpenChange} exam={req.exam} /> : null}
    </DialogsContext.Provider>
  );
}

export function useDialogs() {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error("useDialogs must be used inside DialogsProvider");
  return ctx;
}
