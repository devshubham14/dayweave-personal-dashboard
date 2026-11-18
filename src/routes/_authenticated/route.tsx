import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";

// The session lives in browser storage, so the gate runs client-side only.
// Every data request is still checked by the database's row-level security.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.session.user };
  },
  component: AppShell,
});
