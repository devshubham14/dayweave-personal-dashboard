/**
 * Category tones map a stored colour name to literal Tailwind classes, so the
 * compiler sees every class and components never hardcode colours.
 */
export const TONES = ["indigo", "teal", "amber", "rose", "sky", "violet", "green", "slate"] as const;
export type Tone = (typeof TONES)[number];

export const toneDot: Record<Tone, string> = {
  indigo: "bg-tone-indigo",
  teal: "bg-tone-teal",
  amber: "bg-tone-amber",
  rose: "bg-tone-rose",
  sky: "bg-tone-sky",
  violet: "bg-tone-violet",
  green: "bg-tone-green",
  slate: "bg-tone-slate",
};

export const toneSoft: Record<Tone, string> = {
  indigo: "bg-tone-indigo/10 text-tone-indigo",
  teal: "bg-tone-teal/12 text-tone-teal",
  amber: "bg-tone-amber/15 text-tone-amber",
  rose: "bg-tone-rose/10 text-tone-rose",
  sky: "bg-tone-sky/12 text-tone-sky",
  violet: "bg-tone-violet/10 text-tone-violet",
  green: "bg-tone-green/12 text-tone-green",
  slate: "bg-tone-slate/10 text-tone-slate",
};

export const toneBar: Record<Tone, string> = {
  indigo: "border-l-tone-indigo",
  teal: "border-l-tone-teal",
  amber: "border-l-tone-amber",
  rose: "border-l-tone-rose",
  sky: "border-l-tone-sky",
  violet: "border-l-tone-violet",
  green: "border-l-tone-green",
  slate: "border-l-tone-slate",
};

/** CSS variable for charts (recharts needs a colour value, not a class). */
export const toneVar: Record<Tone, string> = {
  indigo: "var(--tone-indigo)",
  teal: "var(--tone-teal)",
  amber: "var(--tone-amber)",
  rose: "var(--tone-rose)",
  sky: "var(--tone-sky)",
  violet: "var(--tone-violet)",
  green: "var(--tone-green)",
  slate: "var(--tone-slate)",
};

export function asTone(value: string | null | undefined): Tone {
  return (TONES as readonly string[]).includes(value ?? "") ? (value as Tone) : "slate";
}

export const EVENT_CATEGORIES = [
  { value: "work", label: "Work", tone: "indigo" },
  { value: "study", label: "Study", tone: "teal" },
  { value: "personal", label: "Personal", tone: "amber" },
  { value: "health", label: "Health", tone: "rose" },
] as const satisfies readonly { value: string; label: string; tone: Tone }[];

export function eventTone(category: string): Tone {
  return EVENT_CATEGORIES.find((c) => c.value === category)?.tone ?? "slate";
}

export const EXPENSE_CATEGORIES = [
  { value: "Housing", tone: "indigo" },
  { value: "Groceries", tone: "green" },
  { value: "Food & dining", tone: "amber" },
  { value: "Transport", tone: "sky" },
  { value: "Utilities", tone: "slate" },
  { value: "Subscriptions", tone: "violet" },
  { value: "Shopping", tone: "rose" },
  { value: "Entertainment", tone: "teal" },
  { value: "Health", tone: "rose" },
  { value: "Education", tone: "indigo" },
  { value: "Other", tone: "slate" },
] as const satisfies readonly { value: string; tone: Tone }[];

export function expenseTone(category: string): Tone {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.tone ?? "slate";
}
