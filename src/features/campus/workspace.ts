import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import {
  demoAnnouncements,
  demoComplaints,
  demoEvents,
  demoItems,
  demoNotices,
  demoProfile,
} from "./data";
import { emptyPlan, sampleExams, type StudentPlan } from "./planner";
import { openEvents } from "./discovery-data";
import { campusPhotoLink } from "./media.functions";

export type CampusState = {
  plan: StudentPlan;
  profile: Tables<"profiles"> | null;
  roles: string[];
  events: Tables<"events">[];
  activity: Tables<"event_activity">[];
  announcements: Tables<"announcements">[];
  complaints: Tables<"complaints">[];
  items: Tables<"items">[];
  notices: Tables<"notifications">[];
  messages: Tables<"messages">[];
  analyses: Tables<"analyses">[];
};
const empty: CampusState = {
  plan: emptyPlan,
  profile: null,
  roles: [],
  events: [],
  activity: [],
  announcements: [],
  complaints: [],
  items: [],
  notices: [],
  messages: [],
  analyses: [],
};
const sample: CampusState = {
  ...empty,
  plan: { ...emptyPlan, exams: sampleExams(), careers: ["Data / AI"] },
  profile: demoProfile,
  roles: ["student"],
  events: [...demoEvents, ...openEvents],
  announcements: demoAnnouncements,
  complaints: demoComplaints,
  items: demoItems,
  notices: demoNotices,
  activity: [
    {
      created_at: demoEvents[0]?.created_at ?? "",
      user_id: "demo",
      event_id: "demo-design",
      kind: "registered",
    },
  ],
};
const demoStorage = "campus360-demo-v1";
function checked<T>(response: { data: T; error: { message: string } | null }) {
  if (response.error) throw new Error(response.error.message);
  return response.data;
}
export function workspaceQuery(id: string) {
  return {
    queryKey: ["campus", id],
    queryFn: async (): Promise<CampusState> => {
      const [
        profile,
        roles,
        events,
        activity,
        announcements,
        complaints,
        items,
        notices,
        messages,
        analyses,
        plan,
      ] = await Promise.all([
        supabase.from("profiles").select().eq("id", id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", id),
        supabase.from("events").select().order("starts_at"),
        supabase.from("event_activity").select(),
        supabase.from("announcements").select().order("created_at", { ascending: false }),
        supabase.from("complaints").select().order("created_at", { ascending: false }),
        supabase.from("items").select().order("created_at", { ascending: false }),
        supabase.from("notifications").select().order("created_at", { ascending: false }),
        supabase.from("messages").select().order("created_at"),
        supabase.from("analyses").select().order("created_at", { ascending: false }),
        supabase.from("campus_student_plans").select("plan").eq("user_id", id).maybeSingle(),
      ]);
      return {
        plan: { ...emptyPlan, ...(checked(plan)?.plan as Partial<StudentPlan> | undefined) },
        profile: checked(profile),
        roles: checked(roles)?.map((r) => r.role) ?? [],
        events: checked(events) ?? [],
        activity: checked(activity) ?? [],
        announcements: checked(announcements) ?? [],
        complaints: checked(complaints) ?? [],
        items: checked(items) ?? [],
        notices: checked(notices) ?? [],
        messages: checked(messages) ?? [],
        analyses: checked(analyses) ?? [],
      };
    },
    staleTime: 12000,
    refetchInterval: 20000,
  };
}
export function useWorkspace(id?: string) {
  const [demo, setDemo] = useState(sample);
  const client = useQueryClient();
  const pendingPlan = useRef({ writes: 0, queue: Promise.resolve() });
  const [planError, setPlanError] = useState("");
  const query = useQuery({ ...workspaceQuery(id ?? ""), enabled: Boolean(id) });
  useEffect(() => {
    if (id) return;
    try {
      const stored = localStorage.getItem(demoStorage);
      if (stored) {
        const values = JSON.parse(stored);
        setDemo({
          ...sample,
          ...values,
          events: [
            ...demoEvents,
            ...openEvents,
            ...(Array.isArray(values.events)
              ? values.events.filter((e: Tables<"events">) => e.owner === "demo-organizer")
              : []),
          ],
          plan: { ...sample.plan, ...values.plan },
          announcements: demoAnnouncements,
          roles: ["student"],
        });
      }
    } catch {
      /* Keep initial sample data. */
    }
  }, [id]);
  function update(transform: (current: CampusState) => CampusState) {
    if (id) return;
    setDemo((current) => {
      const next = transform(current);
      try {
        localStorage.setItem(demoStorage, JSON.stringify(next));
      } catch {
        /* Storage may be unavailable. */
      }
      return next;
    });
  }
  const refresh = () => client.invalidateQueries({ queryKey: ["campus", id] });
  async function savePlan(transform: (plan: StudentPlan) => StudentPlan, optimistic = true) {
    if (!id) {
      update((s) => ({ ...s, plan: transform(s.plan) }));
      return true;
    }
    const key = ["campus", id];
    const pending = pendingPlan.current;
    pending.writes++;
    await client.cancelQueries({ queryKey: key });
    const current = client.getQueryData<CampusState>(key);
    if (!current) {
      pending.writes--;
      return false;
    }
    const plan = transform(current.plan);
    if (optimistic) client.setQueryData<CampusState>(key, { ...current, plan });
    setPlanError("");
    const write = pending.queue.then(async () => {
      checked(
        await supabase
          .from("campus_student_plans")
          .upsert({ user_id: id, plan: plan as unknown as Json }),
      );
    });
    pending.queue = write.catch(() => {});
    try {
      await write;
      return true;
    } catch {
      setPlanError("Couldn’t save your changes. Please try again.");
      return false;
    } finally {
      pending.writes--;
      if (!pending.writes) void refresh();
    }
  }
  return {
    savePlan,
    planError,
    state: id ? (query.data ?? empty) : demo,
    update,
    refresh,
    error: id ? query.error : null,
    pending: Boolean(id) && query.isPending,
  };
}
export async function uploadPhoto(id: string, file: File | null) {
  if (!file?.size) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_000_000)
    throw new Error("Choose a PNG, JPG, or WebP image under 5 MB.");
  const path = `${id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  const response = await supabase.storage
    .from("campus-media")
    .upload(path, file, { contentType: file.type });
  checked(response);
  return path;
}
export function usePhoto(path: string, viewerId: string | undefined) {
  const signPhoto = useServerFn(campusPhotoLink);
  const query = useQuery({
    queryKey: ["campus-photo", viewerId, path],
    queryFn: async () => {
      const suffix = await signPhoto({ data: { path } });
      const base = import.meta.env["VITE_SUPABASE_URL"]?.replace(/\/+$/, "");
      return suffix && base ? `${base}${suffix}` : null;
    },
    enabled: Boolean(viewerId && path),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  return query.data;
}
