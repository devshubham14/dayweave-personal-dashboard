import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

import { ErrorState, PageSkeleton } from "@/components/common/states";

/** Shared loading and error states for pages inside the app shell. */
export function PagePending() {
  return <PageSkeleton />;
}

export function PageError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();
  useEffect(() => {
    queryReset.reset();
  }, [queryReset]);
  console.error(error);
  return (
    <ErrorState
      title="This page didn't load"
      description="We couldn't reach your data. Check your connection and try again."
      onRetry={() => {
        reset();
        router.invalidate();
      }}
    />
  );
}

export const pageStates = { pendingComponent: PagePending, errorComponent: PageError } as const;

export function pageHead(title: string, description: string) {
  return () => ({
    meta: [
      { title: `${title} — LifeOS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — LifeOS` },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  });
}
