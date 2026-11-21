import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Code2,
  Compass,
  FileText,
  GraduationCap,
  LifeBuoy,
  MapPin,
  Megaphone,
  PackageSearch,
  PenTool,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp, FocusText } from "./universe-motion";
import lecture from "@/assets/campus-lecture.webp.asset.json";
import notice from "@/assets/campus-noticeboard.webp.asset.json";
import artwork from "@/assets/campus-sunrise.webp.asset.json";
import { EventRing } from "./event-ring";
import { eventFit, upcoming as upcomingExams } from "./planner";
import { Badge, Empty, Heading, IconTile, Panel, type Shade } from "./ui";
import { dateText, type Section } from "./data";
import { UpcomingExams } from "./study";
import type { CampusState, useWorkspace } from "./workspace";
import type { Tables } from "@/integrations/supabase/types";

export function EventLine({
  event,
  onClick,
  index = 0,
}: {
  event: Tables<"events">;
  onClick: () => void;
  index?: number;
}) {
  const tones: Shade[] = ["violet", "sky", "mint"];
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full justify-start gap-3 whitespace-normal rounded-none px-4 py-3.5 text-left hover:bg-muted/60 sm:px-5"
    >
      <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <span className="text-[9px] font-bold uppercase">
          {dateText(event.starts_at, { day: undefined })}
        </span>
        <span className="font-display text-base leading-4 font-extrabold">
          {dateText(event.starts_at, { month: undefined, day: "2-digit" })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{event.title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="!size-3" />
          {event.venue}
        </div>
      </div>
      <Badge shade={tones[index % tones.length] ?? "violet"}>{event.category}</Badge>
      <ArrowUpRight className="hidden text-muted-foreground sm:block" />
    </Button>
  );
}
export function Overview({
  state,
  go,
  openEvent,
  openNotice,
  workspace,
  student,
}: {
  state: CampusState;
  workspace: ReturnType<typeof useWorkspace>;
  student: boolean;
  go: (s: Section) => void;
  openEvent: (e: Tables<"events">) => void;
  openNotice: (n: Tables<"announcements">) => void;
}) {
  const demo = state.profile?.id === "demo";
  const first = state.profile?.name.trim().split(/\s+/)[0] || "there";
  const upcoming = state.events
    .filter((e) => Date.parse(e.starts_at) > Date.now())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const ranked = upcoming
    .map((event) => ({ event, fit: eventFit(event, state.plan, state.profile) }))
    .sort((a, b) => b.fit.score - a.fit.score)
    .slice(0, 10);
  const skills = (state.profile?.skills ?? "").split(",").filter((s) => s.trim());
  const matches = (event: Tables<"events">) =>
    `${state.profile?.skills ?? ""},${state.profile?.interests ?? ""},${state.profile?.goals ?? ""}`
      .split(/[,\s]+/)
      .filter(
        (s) =>
          s.length >= 2 &&
          `${event.title} ${event.category} ${event.description}`
            .toLowerCase()
            .includes(s.toLowerCase()),
      ).length;
  const rec = [...upcoming].sort((a, b) => matches(b) - matches(a))[0];
  const complaint = state.complaints[0];
  const examLoad = student ? upcomingExams(state.plan.exams) : [];
  const stats = [
    {
      label: "Upcoming Events",
      value: String(upcoming.length).padStart(2, "0"),
      detail: "Explore what’s on",
      icon: CalendarDays,
      shade: "violet",
      key: "events",
    },
    {
      label: "Registered Events",
      value: String(
        state.activity.filter((a) => a.kind === "registered" && a.user_id === state.profile?.id)
          .length,
      ).padStart(2, "0"),
      detail: "Your campus schedule",
      icon: Target,
      shade: "sky",
      key: "events",
    },
    {
      label: "Skills Tracked",
      value: String(skills.length).padStart(2, "0"),
      detail: "Build your portfolio",
      icon: TrendingUp,
      shade: "mint",
      key: "profile",
    },
    {
      label: "Active Requests",
      value: String(state.complaints.filter((c) => c.status !== "Resolved").length).padStart(
        2,
        "0",
      ),
      detail: "Track your updates",
      icon: LifeBuoy,
      shade: "amber",
      key: "care",
    },
  ] as const;
  return (
    <div className="space-y-6">
      <div className="universe-home-scene">
        <section className="campus-hero campus-daily-hero">
          {[artwork, lecture, notice].map((scene, i) => (
            <img
              key={scene.url}
              className="universe-home-slide"
              src={scene.url}
              alt={i === 0 ? "Illustrated university campus with a glowing clocktower" : ""}
              width={768}
              height={512}
              loading={i ? "lazy" : "eager"}
            />
          ))}
          <svg className="universe-hero-lines" viewBox="0 0 400 245" aria-hidden="true">
            <path d="m9 194 75-57 74 22 46-75 95 22 78-89m-219 142 81 70 60-123" />
            {[
              [9, 194],
              [84, 137],
              [158, 159],
              [204, 84],
              [299, 106],
              [377, 17],
              [239, 229],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" />
            ))}
          </svg>
          <div className="relative w-full max-w-[680px] min-w-0">
            <span className="campus-mono inline-flex items-center gap-2 text-xs text-night-text">
              <Sparkles size={14} /> Today’s Pulse
            </span>
            <h1 className="campus-greeting mt-3 font-display">
              <FocusText text={`Welcome back, ${first}!`} accent />
            </h1>
            <p className="universe-paragraph mt-3 max-w-sm text-base leading-relaxed text-night-text">
              Here’s what’s happening on campus and what’s next for you.
            </p>
            <div className="universe-home-labels campus-mono mt-4 text-[10px] text-night-text">
              <span className="universe-home-word">Your student workspace</span>
              <span className="universe-home-word" aria-hidden="true">
                Student Hub
              </span>
              <span className="universe-home-word" aria-hidden="true">
                Campus Connect
              </span>
            </div>
            <Button className="campus-cta mt-5" onClick={() => go("events")}>
              Explore campus <ArrowRight />
            </Button>
          </div>
        </section>
      </div>
      <div
        className="campus-pulse-stats"
        onPointerMove={(e) => {
          if (
            e.pointerType !== "mouse" ||
            !window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)")
              .matches
          )
            return;
          const card = e.target instanceof Element ? e.target.closest("button") : null;
          if (!card) return;
          const bounds = card.getBoundingClientRect();
          card.style.setProperty(
            "--pulse-tilt",
            `${3 * ((e.clientX - bounds.left) / bounds.width - 0.5)}deg`,
          );
        }}
      >
        <>
          {stats.map((s) => (
            <Button
              key={s.label}
              variant="ghost"
              className="campus-card h-auto min-h-[119px] flex-col items-start justify-between gap-2 whitespace-normal px-3.5 py-3.5 text-left hover:bg-card hover:border-primary/35"
              onClick={() => go(s.key)}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <IconTile icon={s.icon} shade={s.shade} />
                <ArrowUpRight className="!size-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="campus-mono text-2xl leading-tight font-semibold">
                  <CountUp value={Number(s.value)} digits={2} />
                </div>
                <div className="mt-1 text-xs font-semibold text-muted-foreground">{s.label}</div>
              </div>
            </Button>
          ))}
        </>
      </div>
      {examLoad.length > 0 && (
        <div className="campus-exam-strip">
          <span className="campus-mono text-xs text-muted-foreground">Exam load</span>
          <Button variant="link" className="h-11 px-0 text-left" onClick={() => go("calendar")}>
            {examLoad.length} upcoming {examLoad.length === 1 ? "exam" : "exams"} <ArrowUpRight />
          </Button>
        </div>
      )}
      <div className="campus-layout">
        <div className="min-w-0 space-y-6">
          {student && ranked.length > 0 && (
            <div className="space-y-2">
              <Heading title="Events for you" />
              <EventRing label="Events for you" items={ranked} open={openEvent} />
            </div>
          )}
          {student && <UpcomingExams workspace={workspace} open={() => go("calendar")} />}
          <div className="space-y-2.5">
            <Heading
              title="Upcoming events"
              action="View all events"
              onAction={() => go("events")}
            />
            <Panel className="divide-y overflow-hidden">
              {upcoming.length ? (
                upcoming
                  .slice(0, 3)
                  .map((e, i) => (
                    <EventLine key={e.id} event={e} index={i} onClick={() => openEvent(e)} />
                  ))
              ) : (
                <Empty>No upcoming events yet.</Empty>
              )}
            </Panel>
          </div>
          <div className="space-y-2.5">
            <Heading title="Quick actions" />
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {(
                [
                  { label: "Analyze notice", icon: FileText, shade: "violet", key: "intelligence" },
                  { label: "Report an issue", icon: LifeBuoy, shade: "amber", key: "care" },
                  { label: "Find an item", icon: PackageSearch, shade: "mint", key: "lost-found" },
                  { label: "My portfolio", icon: GraduationCap, shade: "sky", key: "profile" },
                ] as const
              ).map((a) => (
                <Button
                  key={a.key}
                  variant="ghost"
                  className="campus-card h-auto flex-col items-start whitespace-normal p-3.5 text-left hover:bg-accent"
                  onClick={() => go(a.key)}
                >
                  <IconTile icon={a.icon} shade={a.shade} />
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Panel className="p-4">
              <div className="flex items-center gap-3">
                <IconTile icon={LifeBuoy} shade="amber" />
                <div>
                  <h3 className="text-sm font-extrabold">Campus Care</h3>
                  <p className="text-xs text-muted-foreground">
                    {complaint
                      ? `${complaint.category} · ${complaint.status}`
                      : "No active campus requests"}
                  </p>
                </div>
              </div>
            </Panel>
            <Panel className="p-4">
              <div className="flex items-center gap-3">
                <IconTile icon={PackageSearch} shade="mint" />
                <div>
                  <h3 className="text-sm font-extrabold">Lost & Found</h3>
                  <p className="text-xs text-muted-foreground">
                    {state.items.filter((i) => i.status === "Open").length} open campus listings
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
        <aside className="min-w-0 space-y-5">
          <Panel className="overflow-hidden">
            <div className="border-b bg-secondary/50 px-4 py-3.5">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-secondary-foreground">
                <Sparkles size={14} /> CampusIQ recommendation
              </div>
              <h2 className="mt-1.5 text-[15px] font-extrabold">YOUR NEXT BEST STEP</h2>
            </div>
            <div className="p-4">
              {rec ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <IconTile icon={Code2} />
                    <Badge shade="mint">{demo ? "96% Match" : "Recommended"}</Badge>
                  </div>
                  <h3 className="mt-3 text-[15px] font-extrabold leading-snug">{rec.title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {demo
                      ? "A Great fit for your AI interests and your goal of becoming a machine learning engineer."
                      : matches(rec)
                        ? "Matches skills, interests, or goals on your profile."
                        : "An upcoming campus opportunity you can explore."}
                  </p>
                  <Button
                    className="mt-3.5 w-full"
                    variant="secondary"
                    onClick={() => openEvent(rec)}
                  >
                    View opportunity <ArrowRight />
                  </Button>
                </>
              ) : (
                <Empty>New campus events will appear here.</Empty>
              )}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center gap-2.5 border-b px-4 py-3.5">
              <Megaphone size={17} className="text-primary" />
              <h2 className="text-sm font-extrabold">Announcements</h2>
            </div>
            <div className="divide-y">
              {state.announcements.length ? (
                state.announcements.slice(0, 3).map((n) => (
                  <Button
                    key={n.id}
                    variant="ghost"
                    className="h-auto w-full flex-col items-start gap-1 whitespace-normal rounded-none px-4 py-3 text-left hover:bg-muted/60"
                    onClick={() => openNotice(n)}
                  >
                    {n.urgent && <Badge shade="amber">Important</Badge>}
                    <span className="text-xs leading-5 font-bold">{n.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {dateText(n.created_at)}
                    </span>
                  </Button>
                ))
              ) : (
                <Empty>No notices posted yet.</Empty>
              )}
            </div>
            <div className="border-t px-4 py-2">
              <Button variant="link" size="sm" className="px-0" onClick={() => go("intelligence")}>
                View announcements <ArrowRight />
              </Button>
            </div>
          </Panel>
          <Panel className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={17} className="text-primary" />
              <h2 className="text-sm font-extrabold">Development progress</h2>
            </div>
            {[
              { label: "Skills added", value: Math.min(skills.length * 20, 100), icon: PenTool },
              {
                label: "Profile completeness",
                value: state.profile
                  ? Math.round(
                      (["name", "university", "degree", "skills", "goals"].filter((k) =>
                        Boolean(state.profile?.[k as "name"]),
                      ).length /
                        5) *
                        100,
                    )
                  : 0,
                icon: Compass,
              },
            ].map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>{p.label}</span>
                  <span className="text-muted-foreground">{p.value}%</span>
                </div>
                <progress
                  className="campus-progress"
                  value={p.value}
                  max={100}
                  aria-label={p.label}
                />
              </div>
            ))}
          </Panel>
          <Button variant="outline" className="w-full" onClick={() => go("notifications")}>
            <Bell /> Notification center
          </Button>
        </aside>
      </div>
    </div>
  );
}
