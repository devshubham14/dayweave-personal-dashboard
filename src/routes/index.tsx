import { createFileRoute, redirect } from "@tanstack/react-router";

// The app's home is the signed-in overview; signed-out visitors are sent to sign in.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifeOS — Personal productivity workspace" },
      { name: "description", content: "Plan tasks, study sessions, spending and habits in one calm workspace." },
      { property: "og:title", content: "LifeOS — Personal productivity workspace" },
      { property: "og:description", content: "Plan tasks, study sessions, spending and habits in one calm workspace." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/overview" });
  },
});
