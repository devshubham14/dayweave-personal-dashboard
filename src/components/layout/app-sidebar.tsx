import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";

import { INSIGHTS_NAV, SETTINGS_NAV, WORKSPACE_NAV, type NavItem } from "@/components/layout/nav-items";
import { Wordmark } from "@/components/layout/wordmark";
import { tasksQuery } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

function NavLink({ item, active, badge, onNavigate }: { item: NavItem; active: boolean; badge?: number | undefined; onNavigate?: (() => void) | undefined }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-subtle-foreground group-hover:text-muted-foreground")} strokeWidth={2} />
      <span className="flex-1 truncate">{item.title}</span>
      {badge ? <span className="tabular text-[11px] font-medium text-subtle-foreground">{badge}</span> : null}
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: tasks } = useQuery(tasksQuery);
  const openTasks = tasks?.filter((t) => t.status !== "done").length;
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link to="/overview" onClick={onNavigate} aria-label="LifeOS overview">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pt-2 scrollbar-thin" aria-label="Main">
        <div className="space-y-0.5">
          <p className="px-2 pb-1.5 type-overline text-subtle-foreground">Workspace</p>
          {WORKSPACE_NAV.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              active={isActive(item.to)}
              badge={item.to === "/tasks" ? openTasks : undefined}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <div className="space-y-0.5">
          <p className="px-2 pb-1.5 type-overline text-subtle-foreground">Insights</p>
          {INSIGHTS_NAV.map((item) => (
            <NavLink key={item.to} item={item} active={isActive(item.to)} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="border-t p-3">
        <NavLink item={SETTINGS_NAV} active={isActive(SETTINGS_NAV.to)} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-sidebar lg:block">
      <SidebarContent />
    </aside>
  );
}
