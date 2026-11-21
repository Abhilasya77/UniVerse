import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/campus/workspace-page";
export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Campus Connect | UniVerse" },
      {
        name: "description",
        content: "Find university events and discover open opportunities around you.",
      },
      { property: "og:title", content: "Campus Connect | UniVerse" },
      {
        property: "og:description",
        content: "Find university events and discover open opportunities around you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <WorkspacePage section="events" />;
}
