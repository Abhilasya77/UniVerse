import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FocusText, PageFrame } from "./universe-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LayoutGrid,
  Linkedin,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  PackageSearch,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Pause,
  Play,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { canSeePulse, dateText, roleLabels, sections, titles, type Section } from "./data";
import { Badge, Brand, Empty, Modal } from "./ui";
import { useWorkspace } from "./workspace";
import { Overview } from "./overview";
import { Events, EventModal } from "./events";
import { Care, LostFound, Messages, Photo, Preferences, Profile } from "./services";
import { CampusIQ, Intelligence, Notices, Pulse } from "./intelligence";
import { LinkedInQueue, Onboarding, ProfilePlan } from "./student-profile";
import { NextExam, StudyCalendar } from "./study";
import { upcoming } from "./planner";
import { sampleInbox } from "./discovery-data";
import { Toaster } from "@/components/ui/sonner";

const icons = {
  overview: LayoutGrid,
  events: CalendarDays,
  calendar: CalendarDays,
  linkedin: Linkedin,
  intelligence: Sparkles,
  profile: GraduationCap,
  care: LifeBuoy,
  "lost-found": PackageSearch,
  pulse: TrendingUp,
  messages: MessageSquare,
  notifications: Bell,
  settings: Settings,
};
const subtitles: Record<Section, string> = {
  overview: "Your campus at a glance",
  events: "Discover events and opportunities",
  calendar: "Exams, deadlines, and campus events",
  linkedin: "Review and approve achievement drafts",
  intelligence: "Announcements and opportunity insights",
  profile: "Your profile, skills, and career development",
  care: "Campus feedback and service requests",
  "lost-found": "Find and return campus belongings",
  pulse: "University engagement and service insights",
  messages: "Private campus conversations",
  notifications: "Updates from around campus",
  settings: "Manage your UniVerse preferences",
};
const navLabels: Partial<Record<Section, string>> = {
  overview: "Home",
  events: "Events",
  profile: "Profile",
  linkedin: "LinkedIn",
  care: "Mess",
  pulse: "Admin",
};
const navGroups: Section[][] = [
  ["overview", "events", "calendar"],
  ["profile", "linkedin"],
  ["care", "lost-found", "pulse"],
];
const tabSections: Section[] = ["overview", "events", "calendar", "care", "profile"];
export function Dashboard({
  id,
  email,
  section,
  go,
  startOnboarding = false,
}: {
  id?: string | undefined;
  email?: string | undefined;
  section: Section;
  go: (s: Section) => void;
  startOnboarding?: boolean;
}) {
  const workspace = useWorkspace(id),
    { state } = workspace;
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [chat, setChat] = useState(false),
    [account, setAccount] = useState(false),
    [demoOnboarding, setDemoOnboarding] = useState(startOnboarding),
    [signalsPaused, setSignalsPaused] = useState(false),
    [selected, setSelected] = useState<Tables<"events"> | null>(null),
    [notice, setNotice] = useState<Tables<"announcements"> | null>(null);
  const topbar = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    let previous = Math.max(0, window.scrollY);
    const bar = topbar.current;
    if (!bar) return;
    bar.dataset["hidden"] = "false";
    const scroll = () => {
      const y = Math.max(0, window.scrollY);
      if (y < 85 || y < previous - 5) bar.dataset["hidden"] = "false";
      else if (y > previous + 5 && !bar.contains(document.activeElement))
        bar.dataset["hidden"] = "true";
      if (Math.abs(y - previous) > 5) previous = y;
    };
    if (!reduceMotion) window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, [section, reduceMotion]);
  const navigate = useNavigate();
  const client = useQueryClient();
  const goTo = (s: Section) => {
    go(s);
    setMobile(false);
    setSearch(false);
    setAccount(false);
  };
  const name = state.profile?.name || email?.split("@")[0] || "Campus member";
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const profilePrefs = state.profile?.preferences;
  const prefs =
    profilePrefs && typeof profilePrefs === "object" && !Array.isArray(profilePrefs)
      ? profilePrefs
      : {};
  const unseen = state.notices.filter((n) => !n.read && prefs[n.kind] !== false).length;
  const role = state.roles.find((r) => r !== "student") ?? "student";
  const student = role === "student";
  const onboarding =
    student &&
    !workspace.pending &&
    !workspace.error &&
    (id ? !state.plan.completed : demoOnboarding && !state.plan.completed);
  const nextExam = student && !onboarding ? upcoming(state.plan.exams)[0] : undefined;
  const nav = sections.filter(
    (s) =>
      (s !== "pulse" || canSeePulse(state.roles) || !id) &&
      (student || (s !== "calendar" && s !== "linkedin")),
  );
  const openEvent = (e: Tables<"events">) => {
    setSearch(false);
    setSelected(e);
  };
  const openNotice = (n: Tables<"announcements">) => {
    setSearch(false);
    setNotice(n);
  };
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function logout() {
    await client.cancelQueries();
    client.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  const scope = { workspace, id, email };
  const content =
    section === "overview" ? (
      <Overview
        state={state}
        go={goTo}
        openEvent={openEvent}
        openNotice={openNotice}
        workspace={workspace}
        student={student}
      />
    ) : section === "events" ? (
      <Events {...scope} openEvent={openEvent} />
    ) : section === "calendar" && student ? (
      <StudyCalendar {...scope} openEvent={openEvent} />
    ) : section === "linkedin" && student ? (
      <LinkedInQueue {...scope} />
    ) : section === "intelligence" ? (
      <Intelligence {...scope} go={goTo} openEvent={openEvent} openNotice={openNotice} />
    ) : section === "profile" ? (
      <div className="space-y-5">
        {student && <ProfilePlan {...scope} start={() => setDemoOnboarding(true)} />}
        <Profile {...scope} />
      </div>
    ) : section === "care" ? (
      <Care {...scope} />
    ) : section === "lost-found" ? (
      <LostFound {...scope} />
    ) : section === "pulse" ? (
      <Pulse {...scope} />
    ) : section === "messages" ? (
      <Messages {...scope} />
    ) : section === "notifications" ? (
      <Notices {...scope} />
    ) : (
      <Preferences {...scope} />
    );
  const matches = (value: string) => value.toLowerCase().includes(query.trim().toLowerCase());
  return (
    <div className="universe-workspace min-h-screen" data-section={section}>
      <div>
        <header ref={topbar} className="campus-topbar">
          <div className="campus-top-inner">
            <Link className="campus-brand-link" to="/welcome" aria-label="About UniVerse">
              <Brand />
            </Link>
            <nav className="campus-primary-nav" aria-label="Campus navigation">
              {navGroups.map((group) => (
                <div className="campus-nav-group" key={group[0]}>
                  {group
                    .filter((s) => nav.includes(s))
                    .map((s) => (
                      <Button
                        key={s}
                        variant="ghost"
                        aria-current={section === s ? "page" : undefined}
                        title={titles[s]}
                        onClick={() => goTo(s)}
                      >
                        {!reduceMotion && section === s && (
                          <motion.span
                            className="universe-nav-marker"
                            layoutId="universe-nav-marker"
                            transition={{ type: "spring", stiffness: 400, damping: 37 }}
                          />
                        )}
                        <span className="relative">{navLabels[s] ?? titles[s]}</span>
                      </Button>
                    ))}
                </div>
              ))}
            </nav>
            <div className="campus-top-tools">
              {nextExam && <NextExam exam={nextExam} open={() => goTo("calendar")} />}
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSearch(true);
                }}
                aria-label="Search campus"
                className="campus-top-search size-11 shrink-0 px-0"
              >
                <Search />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open notifications"
                className="campus-top-bell relative size-11"
                onClick={() => goTo("notifications")}
              >
                <Bell />
                {unseen > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-card bg-primary" />
                )}
              </Button>

              <div className="campus-account relative">
                <Button
                  variant="ghost"
                  className="campus-account-pill h-auto gap-2 px-2 py-1"
                  aria-label="Account menu"
                  aria-expanded={account}
                  onClick={() => setAccount(!account)}
                >
                  {state.profile?.avatar ? (
                    <span className="flex size-8 overflow-hidden rounded-full">
                      <Photo avatar path={state.profile.avatar} alt="Profile" viewerId={id} />
                    </span>
                  ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">
                      {initials}
                    </span>
                  )}
                  <span className="hidden max-w-32 min-w-0 text-left sm:block">
                    <span className="block truncate text-xs font-bold">{name}</span>
                    <span className="campus-mono flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-mint-ink" />
                      {roleLabels[role]}
                    </span>
                  </span>
                  <ChevronDown className="hidden !size-3 text-muted-foreground sm:block" />
                </Button>
                {account && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setAccount(false)} />
                    <div className="campus-card absolute right-0 z-10 mt-2 w-44 p-1.5">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => goTo("profile")}
                      >
                        <GraduationCap /> My profile
                      </Button>
                      {id ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => void logout()}
                        >
                          <LogOut /> Log out
                        </Button>
                      ) : (
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/auth">
                            Log in <ChevronRight />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
              <Dialog open={mobile} onOpenChange={setMobile}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11 shrink-0"
                    aria-label="Open navigation"
                  >
                    <Menu />
                  </Button>
                </DialogTrigger>
                <DialogContent className="campus-dialog campus-navigation-dialog">
                  <DialogTitle>
                    <Brand />
                  </DialogTitle>
                  <DialogDescription className="sr-only">Campus navigation</DialogDescription>
                  <div className="campus-menu-tools flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobile(false);
                        setQuery("");
                        setSearch(true);
                      }}
                    >
                      <Search /> Search campus
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobile(false);
                        goTo("notifications");
                      }}
                    >
                      <Bell /> Notifications{unseen ? ` · ${unseen}` : ""}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={id ? "/welcome" : "/auth"}>{id ? "About UniVerse" : "Log in"}</Link>
                    </Button>
                    {id && (
                      <Button variant="outline" onClick={() => void logout()}>
                        <LogOut /> Log out
                      </Button>
                    )}
                  </div>
                  <nav className="campus-overlay-links" aria-label="All campus pages">
                    {nav.map((s, index) => {
                      const Icon = icons[s];
                      return (
                        <Button
                          key={s}
                          variant="ghost"
                          className="universe-menu-link justify-start"
                          style={{ animationDelay: `${index * 31}ms` }}
                          aria-current={section === s ? "page" : undefined}
                          onClick={() => goTo(s)}
                        >
                          <Icon /> <FocusText text={titles[s]} />
                        </Button>
                      );
                    })}
                    <Button asChild variant="ghost" className="justify-start">
                      <Link to="/welcome">
                        <CircleHelp /> About UniVerse
                      </Link>
                    </Button>
                  </nav>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        <main className="campus-workspace mx-auto max-w-[1440px] px-4 pt-4 sm:px-8 sm:pt-5">
          {!id && (
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge shade="violet">DEMO WORKSPACE</Badge>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Sample campus data
                </span>
              </div>
              <div className="flex flex-wrap justify-end gap-x-3">
                {!state.plan.completed && !onboarding && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-7 px-0"
                    onClick={() => setDemoOnboarding(true)}
                  >
                    Try onboarding
                  </Button>
                )}
                <Button asChild variant="link" size="sm" className="h-7 px-0">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Create an account <ChevronRight />
                  </Link>
                </Button>
              </div>
            </div>
          )}
          {workspace.planError && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {workspace.planError}
            </p>
          )}
          {workspace.pending ? (
            <div
              className="universe-skeleton"
              role="status"
              aria-label="Loading your campus workspace…"
            >
              <i />
              <i />
              <i />
            </div>
          ) : workspace.error ? (
            <Empty>
              Couldn’t load your workspace.{" "}
              <Button onClick={() => void workspace.refresh()} variant="link">
                Try again
              </Button>
            </Empty>
          ) : onboarding ? (
            <Onboarding
              {...scope}
              onDone={() => {
                setDemoOnboarding(false);
                goTo("overview");
              }}
            />
          ) : (
            <div className="universe-page-stack">
              <AnimatePresence initial={false}>
                <PageFrame key={section}>
                  {section !== "overview" && (
                    <div className="campus-page-heading">
                      <p className="universe-subtitle">{subtitles[section]}</p>
                      <p className="font-display">
                        <FocusText text={titles[section]} accent />
                      </p>
                    </div>
                  )}
                  {content}
                </PageFrame>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
      {(() => {
        const signals = [
          ...(!id
            ? sampleInbox
                .filter(
                  (item) =>
                    item.importance === "Critical" && Date.parse(item.event.deadline) > Date.now(),
                )
                .slice(0, 1)
                .map((item) => `${item.event.title} closes ${dateText(item.event.deadline)}`)
            : []),
          ...state.items
            .filter((item) => item.status === "Potential Match")
            .slice(0, 1)
            .map(() => "Lost item match found"),
          ...state.events
            .filter((event) => Date.parse(event.deadline) > Date.now())
            .sort((a, b) => a.deadline.localeCompare(b.deadline))
            .slice(0, 4)
            .map((event) => `${event.title} closes ${dateText(event.deadline)}`),
          ...state.announcements
            .filter((a) => a.urgent)
            .slice(0, 2)
            .map((a) => a.title),
        ];
        if (!signals.length) return null;
        return (
          <div className="campus-ticker" data-paused={signalsPaused}>
            <Button
              variant="ghost"
              className="campus-ticker-toggle"
              aria-label={signalsPaused ? "Play campus signals" : "Pause campus signals"}
              title={signalsPaused ? "Play campus signals" : "Pause campus signals"}
              onClick={() => setSignalsPaused(!signalsPaused)}
            >
              {signalsPaused ? <Play /> : <Pause />}
            </Button>
            <span className="campus-ticker-label campus-mono">
              <Radio /> Live signals
            </span>
            <div className="campus-ticker-window campus-mono">
              <div className="campus-ticker-track">
                <span>
                  {signals.map((signal) => (
                    <span key={signal} className="universe-signal">
                      {signal} •{" "}
                    </span>
                  ))}
                </span>
                <span aria-hidden="true">{signals.join("  •  ")}</span>
              </div>
            </div>
          </div>
        );
      })()}
      <nav className="campus-bottom-tabs" aria-label="Quick campus navigation">
        {tabSections
          .filter((s) => nav.includes(s))
          .map((s) => {
            const Icon = icons[s];
            return (
              <Button
                key={s}
                variant="ghost"
                aria-current={section === s ? "page" : undefined}
                onClick={() => goTo(s)}
              >
                <motion.span
                  className="inline-flex"
                  whileTap={reduceMotion ? {} : { scale: 0.78, y: 1 }}
                  transition={{ type: "spring", stiffness: 540, damping: 18 }}
                >
                  <Icon />
                </motion.span>
                {s === "care" ? "Report" : (navLabels[s] ?? titles[s])}
              </Button>
            );
          })}
      </nav>
      <Toaster />
      <CampusIQ id={id} open={chat} close={() => setChat(false)} go={goTo} events={state.events} />
      <Button
        className="campus-iq-launch fixed right-3 z-30 h-11 rounded-full px-4 shadow-lg sm:right-6"
        onClick={() => setChat(!chat)}
        aria-expanded={chat}
      >
        <Sparkles /> CampusIQ
      </Button>
      {search && (
        <Modal title="Search campus" onClose={() => setSearch(false)}>
          <input
            autoFocus
            className="campus-input"
            aria-label="Campus search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try events, announcements, or campus care"
          />
          <div className="grid gap-1">
            {nav
              .filter((s) => matches(titles[s]))
              .slice(0, 6)
              .map((s) => (
                <Button key={s} variant="ghost" className="justify-start" onClick={() => goTo(s)}>
                  {titles[s]}
                </Button>
              ))}
            {query.trim() &&
              state.events
                .filter((e) => matches(e.title))
                .map((e) => (
                  <Button
                    key={e.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => openEvent(e)}
                  >
                    {e.title}
                  </Button>
                ))}
            {query.trim() &&
              state.announcements
                .filter((a) => matches(a.title))
                .map((a) => (
                  <Button
                    key={a.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => openNotice(a)}
                  >
                    {a.title}
                  </Button>
                ))}
          </div>
        </Modal>
      )}
      {selected && <EventModal {...scope} event={selected} close={() => setSelected(null)} />}
      {notice && (
        <Modal
          title={notice.title}
          description={dateText(notice.created_at)}
          onClose={() => setNotice(null)}
        >
          {notice.urgent && <Badge shade="amber">Important</Badge>}
          <p className="whitespace-pre-wrap text-sm leading-6">{notice.body}</p>
        </Modal>
      )}
    </div>
  );
}
