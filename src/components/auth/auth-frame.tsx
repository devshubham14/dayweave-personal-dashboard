import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/layout/wordmark";

export function AuthFrame({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center px-6">
        <Link to="/" aria-label="LifeOS home">
          <Wordmark />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16">
        <div className="w-full max-w-[380px] animate-fade-up">
          <div className="mb-6">
            <h1 className="type-display text-foreground">{title}</h1>
            {description ? <p className="mt-1.5 type-body text-muted-foreground">{description}</p> : null}
          </div>
          <div className="surface p-6 shadow-sm">{children}</div>
          {footer ? <div className="mt-5 text-center type-small text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-border" />
      <span className="type-caption text-subtle-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
