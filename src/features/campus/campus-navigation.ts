import { useNavigate } from "@tanstack/react-router";
import type { Section } from "./data";
export function useCampusNavigation(live: boolean) {
  const navigate = useNavigate();
  return (s: Section) => {
    if (s === "events") return void navigate({ to: "/events" });
    if (s === "profile") return void navigate({ to: "/profile" });
    if (s === "calendar") return void navigate({ to: "/calendar" });
    if (s === "linkedin") return void navigate({ to: "/linkedin" });
    const search = s === "overview" ? {} : { view: s };
    if (live) void navigate({ to: "/dashboard", search });
    else void navigate({ to: "/", search });
  };
}
