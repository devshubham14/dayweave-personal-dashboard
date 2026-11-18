import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus, ReceiptText, TrendingDown, Wallet } from "lucide-react";

import { Chip } from "@/components/common/bits";
import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { ProgressRing } from "@/components/common/progress";
import { EmptyState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToday } from "@/hooks/use-today";
import { expensesQuery, profileQuery } from "@/lib/data/queries";
import { formatCurrency, parseDate } from "@/lib/format";
import { monthBounds, sumExpenses } from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { EXPENSE_CATEGORIES } from "@/lib/tones";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: pageHead("Expenses", "Track spending against your monthly budget."),
  loader: ({ context }) =>
    Promise.all(
      [expensesQuery, profileQuery].map((q) => context.queryClient.ensureQueryData(q as never)),
    ),
  ...pageStates,
  component: ExpensesPage,
});

function ExpensesPage() {
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const today = useToday();
  const dialogs = useDialogs();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const currency = profile?.currency ?? "INR";
  const month = monthBounds(today);
  const spent = sumExpenses(expenses, month.start, month.end);
  const budget = Number(profile?.monthly_budget ?? 0);
  const remaining = Math.max(0, budget - spent);
  const percent = budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter(
      (expense) =>
        (category === "all" || expense.category === category) &&
        (!q ||
          expense.title.toLowerCase().includes(q) ||
          (expense.note ?? "").toLowerCase().includes(q)),
    );
  }, [expenses, category, search]);

  const byCategory = EXPENSE_CATEGORIES.map((item) => ({
    ...item,
    amount: expenses
      .filter(
        (expense) =>
          expense.spent_on >= month.start &&
          expense.spent_on <= month.end &&
          expense.category === item.value,
      )
      .reduce((total, expense) => total + Number(expense.amount), 0),
  }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Expenses"
        description="Track spending against your monthly budget."
        actions={
          <Button onClick={() => dialogs.open({ kind: "expense" })}>
            <Plus /> Add expense
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Spent this month"
          icon={Wallet}
          value={formatCurrency(spent, currency)}
          hint={format(parseDate(today), "MMMM")}
        />
        <StatCard
          label="Remaining"
          icon={TrendingDown}
          value={formatCurrency(remaining, currency)}
          hint={budget ? "of monthly budget" : "no budget set"}
        />
        <StatCard
          label="Transactions"
          icon={ReceiptText}
          value={
            expenses.filter(
              (expense) => expense.spent_on >= month.start && expense.spent_on <= month.end,
            ).length
          }
          hint="this month"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Transactions" flush>
          <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search expenses"
              aria-label="Search expenses"
              className="sm:max-w-xs"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter expense category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {EXPENSE_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              compact
              icon={ReceiptText}
              title={expenses.length ? "No matching expenses" : "No expenses yet"}
              description={
                expenses.length
                  ? "Try another category or search."
                  : "Add your first expense to see spending here."
              }
              action={
                !expenses.length ? (
                  <Button size="sm" onClick={() => dialogs.open({ kind: "expense" })}>
                    <Plus /> Add expense
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y">
              {filtered.slice(0, 30).map((expense) => (
                <button
                  key={expense.id}
                  onClick={() => dialogs.open({ kind: "expense", expense })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                    <ReceiptText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-small font-medium">{expense.title}</span>
                    <span className="block truncate type-caption text-muted-foreground">
                      {expense.category} · {format(parseDate(expense.spent_on), "d MMM yyyy")}
                    </span>
                  </span>
                  <span className="tabular type-small font-medium">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Monthly budget"
          description={budget ? `${percent}% used` : "Set a budget in Settings"}
        >
          <div className="flex items-center gap-5">
            <ProgressRing value={percent} size={88} stroke={8}>
              <span className="type-h2 tabular">{percent}%</span>
            </ProgressRing>
            <div className="min-w-0">
              <p className="type-caption text-muted-foreground">Budget</p>
              <p className="type-h3 tabular">
                {budget ? formatCurrency(budget, currency) : "Not set"}
              </p>
            </div>
          </div>
          {byCategory.length ? (
            <div className="mt-5 space-y-2">
              {byCategory.slice(0, 5).map((item) => (
                <div
                  key={item.value}
                  className="flex items-center justify-between gap-3 type-caption"
                >
                  <Chip>{item.value}</Chip>
                  <span className="tabular font-medium">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
