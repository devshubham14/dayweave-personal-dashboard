import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
} from "date-fns";

/** Local calendar date as yyyy-MM-dd (never UTC-shifted). */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDate(value: string): Date {
  // Date-only strings are parsed as local midnight.
  return parseISO(value);
}

export function todayISO(): string {
  return toISODate(new Date());
}

const CURRENCY_LOCALE: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

export const CURRENCIES = [
  { code: "INR", label: "Indian rupee (₹)" },
  { code: "USD", label: "US dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British pound (£)" },
] as const;

export function formatCurrency(
  amount: number,
  currency = "INR",
  opts: { compact?: boolean; decimals?: boolean } = {},
): string {
  const locale = CURRENCY_LOCALE[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.decimals ? 2 : opts.compact ? 1 : 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatMinutes(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}

export function formatHours(minutes: number, digits = 1): string {
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(digits)}h`;
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string | null | undefined): string {
  const name = (fullName ?? "").trim();
  if (!name) return "there";
  return name.split(/\s+/)[0];
}

export function initials(fullName: string | null | undefined, fallback = "?"): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Human label for a due date relative to today. */
export function dueLabel(due: string, today: string): { label: string; tone: "overdue" | "today" | "soon" | "later" } {
  const diff = differenceInCalendarDays(parseDate(due), parseDate(today));
  if (diff < 0) return { label: diff === -1 ? "Yesterday" : `${Math.abs(diff)}d overdue`, tone: "overdue" };
  if (diff === 0) return { label: "Today", tone: "today" };
  if (diff === 1) return { label: "Tomorrow", tone: "soon" };
  if (diff < 7) return { label: format(parseDate(due), "EEEE"), tone: "soon" };
  return { label: format(parseDate(due), "d MMM"), tone: "later" };
}

export function daysUntil(date: string, today: string): number {
  return differenceInCalendarDays(parseDate(date), parseDate(today));
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (!isValid(d)) return "";
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return "Just now";
  return `${formatDistanceToNowStrict(d)} ago`;
}

/** "14:00:00" -> "14:00" */
export function shortTime(t: string): string {
  return t.slice(0, 5);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
