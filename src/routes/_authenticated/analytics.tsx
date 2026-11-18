import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { CheckCircle2, GraduationCap, Wallet } from "lucide-react";
import { subDays } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { StatCard } from "@/components/common/stat-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useToday } from "@/hooks/use-today";
import { expensesQuery, profileQuery, sessionsQuery, tasksQuery } from "@/lib/data/queries";
import { formatCurrency, formatHours, parseDate, toISODate } from "@/lib/format";
import { countCompleted, monthBounds, percentChange, sumExpenses, sumMinutes } from "@/lib/metrics";
import { pageHead, pageStates } from "@/lib/page";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: pageHead("Analytics", "Trends in productivity, study, spending and habits."),
  loader: ({ context }) =>
    Promise.all(
      [tasksQuery, sessionsQuery, expensesQuery, profileQuery].map((q) =>
        context.queryClient.ensureQueryData(q as never),
      ),
    ),
  ...pageStates,
  component: AnalyticsPage,
});

const taskChartConfig = {
  tasks: { label: "Tasks completed", color: "var(--chart-1)" },
} satisfies ChartConfig;
const studyChartConfig = {
  hours: { label: "Study hours", color: "var(--chart-3)" },
} satisfies ChartConfig;
const expenseChartConfig = {
  amount: { label: "Spending", color: "var(--chart-2)" },
} satisfies ChartConfig;

function AnalyticsPage() {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: sessions } = useSuspenseQuery(sessionsQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const today = useToday();
  const currency = profile?.currency ?? "INR";

  const taskSeries = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const date = toISODate(subDays(parseDate(today), 29 - index));
        return {
          date: date.slice(5),
          tasks: tasks.filter(
            (task) => task.status === "done" && (task.completed_at ?? "").slice(0, 10) === date,
          ).length,
        };
      }),
    [tasks, today],
  );
  const studySeries = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const date = toISODate(subDays(parseDate(today), 29 - index));
        return {
          date: date.slice(5),
          hours:
            Math.round(
              sumMinutes(
                sessions.filter((session) => session.session_date === date),
                date,
                date,
              ) / 6,
            ) / 10,
        };
      }),
    [sessions, today],
  );
  const expenseSeries = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const date = toISODate(subDays(parseDate(today), 29 - index));
        return {
          date: date.slice(5),
          amount: expenses
            .filter((expense) => expense.spent_on === date)
            .reduce((total, expense) => total + Number(expense.amount), 0),
        };
      }),
    [expenses, today],
  );

  const month = monthBounds(today);
  const prior = monthBounds(today, -1);
  const spent = sumExpenses(expenses, month.start, month.end);
  const priorSpent = sumExpenses(expenses, prior.start, prior.end);
  const studyMinutes = sumMinutes(sessions, month.start, month.end);
  const priorStudy = sumMinutes(sessions, prior.start, prior.end);
  const completed = countCompleted(tasks, month.start, month.end);
  const priorCompleted = countCompleted(tasks, prior.start, prior.end);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Analytics"
        description="Trends across your productivity, study and spending."
      />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Tasks completed"
          icon={CheckCircle2}
          value={completed}
          change={percentChange(completed, priorCompleted)}
          hint="this month"
        />
        <StatCard
          label="Study hours"
          icon={GraduationCap}
          value={formatHours(studyMinutes)}
          change={percentChange(studyMinutes, priorStudy)}
          hint="this month"
        />
        <StatCard
          label="Monthly spending"
          icon={Wallet}
          value={formatCurrency(spent, currency)}
          change={percentChange(spent, priorSpent)}
          invert
          hint="this month"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Tasks completed" description="Last 30 days">
          <ChartContainer config={taskChartConfig} className="aspect-auto h-[260px] w-full">
            <LineChart data={taskSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="var(--color-tasks)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </Panel>
        <Panel title="Study time" description="Daily hours, last 30 days">
          <ChartContainer config={studyChartConfig} className="aspect-auto h-[260px] w-full">
            <LineChart data={studySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </Panel>
      </div>
      <Panel title="Daily spending" description="Last 30 days">
        <ChartContainer config={expenseChartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart data={expenseSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Panel>
    </div>
  );
}
