import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useCampusNavigation } from "./campus-navigation";
import { Dashboard } from "./shell";
import type { Section } from "./data";

export function WorkspacePage({ section }: { section: Section }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const go = useCampusNavigation(Boolean(user));
  useEffect(() => {
    let active = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);
  if (user === undefined)
    return (
      <main
        className="grid min-h-screen place-items-center text-sm text-muted-foreground"
        aria-busy
      >
        Loading your campus workspace…
      </main>
    );
  return (
    <Dashboard
      key={user?.id ?? "sample"}
      id={user?.id}
      email={user?.email}
      section={section}
      go={go}
    />
  );
}
