import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { LogOut, Menu, Search, Settings, User } from "lucide-react";

import { Kbd } from "@/components/common/bits";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNow } from "@/hooks/use-now";
import { signOut } from "@/lib/auth";
import { profileQuery } from "@/lib/data/queries";
import { firstName, greetingFor, initials } from "@/lib/format";

export function Avatar({ name, className = "h-7 w-7 text-[11px]" }: { name: string | null | undefined; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary ${className}`} aria-hidden>
      {initials(name, "·")}
    </span>
  );
}

export function AppHeader({ onOpenSearch, onOpenNav }: { onOpenSearch: () => void; onOpenNav: () => void }) {
  const now = useNow();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery);
  const name = profile?.full_name;

  const handleSignOut = async () => {
    await signOut(qc);
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="-ml-1 lg:hidden" onClick={onOpenNav} aria-label="Open navigation">
          <Menu />
        </Button>
        <Link to="/overview" className="lg:hidden" aria-label="LifeOS overview">
          <Wordmark />
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate type-h3 text-foreground">
            {greetingFor(now)}, {firstName(name)}
          </p>
          <p className="type-caption text-muted-foreground">{format(now, "EEEE, d MMMM yyyy")}</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onOpenSearch}
            className="hidden h-8 w-64 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-2.5 text-left type-small text-subtle-foreground shadow-xs transition-colors hover:border-border-strong md:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Search or jump to…</span>
            <Kbd>⌘K</Kbd>
          </button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSearch} aria-label="Search">
            <Search />
          </Button>
          <NotificationsMenu />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none" aria-label="Open profile menu">
                <Avatar name={name} className="h-8 w-8 text-xs" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex items-center gap-2.5 py-2 font-normal">
                <Avatar name={name} className="h-8 w-8 text-xs" />
                <span className="min-w-0">
                  <span className="block truncate type-small font-medium text-foreground">{name || "Your account"}</span>
                  <span className="block truncate type-caption text-muted-foreground">{profile?.email}</span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/settings", hash: "profile" })}>
                <User /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
                <Settings /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
