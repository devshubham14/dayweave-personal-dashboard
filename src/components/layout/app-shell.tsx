import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { DialogsProvider } from "@/components/dialogs/dialogs-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar, SidebarContent } from "@/components/layout/app-sidebar";
import { CommandMenu } from "@/components/layout/command-menu";
import { ALL_NAV } from "@/components/layout/nav-items";
import { WelcomeDialog } from "@/components/layout/welcome-dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/** "G" then a letter jumps between pages, matching the shortcuts shown in the command menu. */
function useGoShortcuts() {
  const navigate = useNavigate();
  const pending = useRef<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || document.querySelector("[role=dialog]")) return;
      const key = e.key.toUpperCase();
      if (pending.current !== null) {
        window.clearTimeout(pending.current);
        pending.current = null;
        const item = ALL_NAV.find((n) => n.shortcut === `G ${key}`);
        if (item) {
          e.preventDefault();
          navigate({ to: item.to });
        }
        return;
      }
      if (key === "G") pending.current = window.setTimeout(() => (pending.current = null), 900);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  useGoShortcuts();

  return (
    <DialogsProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="lg:pl-60">
          <AppHeader onOpenSearch={() => setSearchOpen(true)} onOpenNav={() => setNavOpen(true)} />
          <main className="mx-auto w-full max-w-[1280px] px-4 pt-6 pb-16 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
        <WelcomeDialog />
      </div>
    </DialogsProvider>
  );
}
