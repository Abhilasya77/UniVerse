import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCampusNavigation } from "@/features/campus/campus-navigation";
import { Dashboard } from "@/features/campus/shell";
import { sections, type Section } from "@/features/campus/data";
import { supabase } from "@/integrations/supabase/client";
const description =
  "Explore the UniVerse student dashboard: campus events, announcements, career opportunities, and support.";
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { view?: Section; onboarding?: boolean } => {
    const view = sections.find((s) => s === search["view"]);
    return {
      ...(view ? { view } : {}),
      ...(search["onboarding"] === true ? { onboarding: true } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "UniVerse | Student Dashboard" },
      { name: "description", content: description },
      { property: "og:title", content: "UniVerse Student Dashboard" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
function Index() {
  const { view, onboarding } = Route.useSearch();
  const navigate = useNavigate();
  const go = useCampusNavigation(false);
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user && !cancelled)
        void navigate({ to: "/dashboard", search: view ? { view } : {}, replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, view]);
  return <Dashboard section={view ?? "overview"} go={go} startOnboarding={onboarding === true} />;
}
