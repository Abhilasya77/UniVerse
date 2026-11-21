import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/campus/workspace-page";
export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Academic Calendar | UniVerse" },
      {
        name: "description",
        content: "Plan upcoming exams, event RSVPs, and registration deadlines.",
      },
      { property: "og:title", content: "Academic Calendar | UniVerse" },
      {
        property: "og:description",
        content: "Plan upcoming exams, event RSVPs, and registration deadlines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <WorkspacePage section="calendar" />;
}
