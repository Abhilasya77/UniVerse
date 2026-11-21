import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/campus/workspace-page";
export const Route = createFileRoute("/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Review Queue | UniVerse" },
      {
        name: "description",
        content: "Review and approve drafts based on your campus achievements.",
      },
      { property: "og:title", content: "LinkedIn Review Queue | UniVerse" },
      {
        property: "og:description",
        content: "Review and approve drafts based on your campus achievements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <WorkspacePage section="linkedin" />;
}
