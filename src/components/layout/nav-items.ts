import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutGrid,
  Repeat,
  Settings,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavPath =
  | "/overview"
  | "/tasks"
  | "/study"
  | "/expenses"
  | "/habits"
  | "/calendar"
  | "/assistant"
  | "/analytics"
  | "/settings";

export interface NavItem {
  title: string;
  to: NavPath;
  icon: LucideIcon;
  shortcut?: string;
}

export const WORKSPACE_NAV: NavItem[] = [
  { title: "Overview", to: "/overview", icon: LayoutGrid, shortcut: "G O" },
  { title: "Tasks", to: "/tasks", icon: CheckSquare, shortcut: "G T" },
  { title: "Study Planner", to: "/study", icon: GraduationCap, shortcut: "G S" },
  { title: "Expenses", to: "/expenses", icon: Wallet, shortcut: "G E" },
  { title: "Habits", to: "/habits", icon: Repeat, shortcut: "G H" },
  { title: "Calendar", to: "/calendar", icon: CalendarDays, shortcut: "G C" },
];

export const INSIGHTS_NAV: NavItem[] = [
  { title: "AI Assistant", to: "/assistant", icon: Sparkles, shortcut: "G A" },
  { title: "Analytics", to: "/analytics", icon: BarChart3, shortcut: "G N" },
];

export const SETTINGS_NAV: NavItem = { title: "Settings", to: "/settings", icon: Settings };

export const ALL_NAV: NavItem[] = [...WORKSPACE_NAV, ...INSIGHTS_NAV, SETTINGS_NAV];
