import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, CheckSquare, Clock, Plus, Receipt, Repeat, Sparkles } from "lucide-react";
import { useEffect } from "react";

import { Kbd } from "@/components/common/bits";
import { PriorityIcon } from "@/components/common/priority";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { ALL_NAV } from "@/components/layout/nav-items";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { tasksQuery } from "@/lib/data/queries";

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const { data: tasks = [] } = useQuery(tasksQuery);
  const openTasks = tasks.filter((t) => t.status !== "done").slice(0, 30);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    // Let the palette close before opening a dialog so focus returns cleanly.
    setTimeout(fn, 0);
  };

  const actions = [
    { label: "New task", icon: Plus, run: () => dialogs.open({ kind: "task" }) },
    { label: "Add expense", icon: Receipt, run: () => dialogs.open({ kind: "expense" }) },
    { label: "Log study session", icon: Clock, run: () => dialogs.open({ kind: "session" }) },
    { label: "New calendar event", icon: CalendarPlus, run: () => dialogs.open({ kind: "event" }) },
    { label: "New habit", icon: Repeat, run: () => dialogs.open({ kind: "habit" }) },
    { label: "Ask the AI assistant", icon: Sparkles, run: () => navigate({ to: "/assistant" }) },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, tasks and actions…" />
      <CommandList className="max-h-[380px] scrollbar-thin">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          {actions.map((a) => (
            <CommandItem key={a.label} onSelect={() => run(a.run)}>
              <a.icon className="text-muted-foreground" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {ALL_NAV.map((item) => (
            <CommandItem key={item.to} value={`go ${item.title}`} onSelect={() => run(() => navigate({ to: item.to }))}>
              <item.icon className="text-muted-foreground" />
              <span className="flex-1">{item.title}</span>
              {item.shortcut ? (
                <span className="flex gap-1">
                  {item.shortcut.split(" ").map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
        {openTasks.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Open tasks">
              {openTasks.map((t) => (
                <CommandItem key={t.id} value={`task ${t.title} ${t.project}`} onSelect={() => run(() => dialogs.open({ kind: "task", task: t }))}>
                  <CheckSquare className="text-muted-foreground" />
                  <span className="flex-1 truncate">{t.title}</span>
                  <PriorityIcon priority={t.priority} />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
