import { createFileRoute } from "@tanstack/react-router";
import { useCampusNavigation } from "@/features/campus/campus-navigation";
import { Dashboard } from "@/features/campus/shell";
import { sections, type Section } from "@/features/campus/data";
import { workspaceQuery } from "@/features/campus/workspace";
const description = "Manage your campus activities, profile, and university updates in UniVerse.";
export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>): { view?: Section } => {
    const view = sections.find((s) => s === search["view"]);
    return view ? { view } : {};
  },
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceQuery(context.user.id));
  },
  head: () => ({
    meta: [
      { title: "My Campus | UniVerse" },
      { name: "description", content: description },
      { property: "og:title", content: "My Campus | UniVerse" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Live,
});
function Live() {
  const { user } = Route.useRouteContext();
  const { view } = Route.useSearch();
  const go = useCampusNavigation(true);
  return (
    <Dashboard key={user.id} id={user.id} email={user.email} section={view ?? "overview"} go={go} />
  );
}
