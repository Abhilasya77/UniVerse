import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/campus/workspace-page";
export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Student Hub | UniVerse" },
      { name: "description", content: "Manage your UniVerse profile, career goals, and skills." },
      { property: "og:title", content: "Student Hub | UniVerse" },
      {
        property: "og:description",
        content: "Manage your UniVerse profile, career goals, and skills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <WorkspacePage section="profile" />;
}
