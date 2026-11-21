import { useRef, useState } from "react";
import { Globe2, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { dateText, eventCategories } from "./data";
import { rateMail, sampleInbox } from "./discovery-data";
import { eventFit } from "./planner";
import { Badge, Empty, Field, Heading, Panel } from "./ui";
import type { ModuleProps } from "./services";
import { EmailConnect } from "./student-profile";
import { EventRing, WorthDial, type RatedEvent } from "./event-ring";

type Event = Tables<"events">;
export function FitDetails({ fit }: { fit: ReturnType<typeof eventFit> }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer font-semibold text-primary">Why this rating?</summary>
      <dl className="mt-2 divide-y rounded border px-2">
        {fit.factors.map(([name, score]) => (
          <div key={name} className="flex justify-between gap-2 py-1.5">
            <dt>{name}</dt>
            <dd className="font-semibold tabular-nums">{score}%</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
export function Discovery({
  workspace,
  id,
  openEvent,
  onRsvp,
  busy,
}: ModuleProps & {
  openEvent: (e: Event) => void;
  onRsvp: (event: Event) => Promise<void>;
  busy: string;
}) {
  const [mobile, setMobile] = useState<"university" | "open">("university");
  const [ring, setRing] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [hide, setHide] = useState(false);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [high, setHigh] = useState(false);
  const [search, setSearch] = useState("");
  const { state } = workspace;
  const plan = state.plan;
  const university = state.profile?.university?.trim().toLowerCase();
  const own = (e: Event) => Boolean(university && university === e.host_university.toLowerCase());
  const local = state.events
    .filter((e) => own(e) || e.visibility === "university")
    .map((event) => ({ event, fit: eventFit(event, plan, state.profile) }))
    .sort(
      (a, b) => Number(b.event.critical) - Number(a.event.critical) || b.fit.score - a.fit.score,
    );
  const inbox =
    !id && plan.emailProvider
      ? sampleInbox
          .filter((m) => !hide || m.importance !== "Ignore")
          .map((item) => ({ item, rating: rateMail(item, plan, state.profile) }))
          .sort(
            (a, b) =>
              Number(b.item.importance === "Critical") - Number(a.item.importance === "Critical") ||
              b.rating.necessity - a.rating.necessity,
          )
      : [];
  const open = state.events.filter((e) => e.visibility === "all");
  const cities = [...new Set(open.map((e) => e.city).filter(Boolean))].sort();
  const visible = open
    .map((event) => ({ event, fit: eventFit(event, plan, state.profile) }))
    .filter(
      ({ event: e, fit }) =>
        (!city || e.city === city) &&
        (!category || e.category === category) &&
        (!date || e.starts_at.slice(0, 10) === date) &&
        (!cost || e.paid === (cost === "paid")) &&
        (!high || fit.score >= 70) &&
        `${e.title} ${e.host_university} ${e.city}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    );
  const registered = (event: Event) =>
    state.activity.some(
      (a) => a.user_id === (id ?? "demo") && a.event_id === event.id && a.kind === "registered",
    );
  const fitBadge = (fit: ReturnType<typeof eventFit>) => (
    <Badge shade={fit.score >= 75 ? "mint" : fit.score >= 50 ? "amber" : "red"}>
      {fit.score}% Worth it for you
    </Badge>
  );
  const changeInbox = (key: string, status: "engaged" | "ignored") =>
    void workspace.savePlan((p) => ({ ...p, inbox: { ...p.inbox, [key]: status } }));
  const renderOpen = ({ event, fit }: RatedEvent, inRing = false) => (
    <Panel className="space-y-2 p-4" key={event.id}>
      <div className="flex flex-wrap gap-1.5">
        <Badge>Open to all universities</Badge>
        {!own(event) && <Badge shade="sky">Not announced by your university</Badge>}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">
          {event.host_university || "Campus organizer"}
        </p>
        <h3 className="text-sm font-extrabold">{event.title}</h3>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        {event.city || event.venue} · {dateText(event.starts_at)} · {event.paid ? "Paid" : "Free"}
      </p>
      {!inRing && (
        <div className="flex items-center gap-3">
          <WorthDial score={fit.score} />
          <span className="campus-mono text-xs text-muted-foreground">Worth it for you</span>
        </div>
      )}
      <p className="text-xs font-medium">{fit.reason}</p>
      <FitDetails fit={fit} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={
            registered(event) || Date.parse(event.deadline) < Date.now() || busy === event.id
          }
          onClick={() => void onRsvp(event)}
        >
          {registered(event)
            ? "RSVP’d"
            : Date.parse(event.deadline) < Date.now()
              ? "RSVP closed"
              : "RSVP"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => openEvent(event)}>
          Details
        </Button>
      </div>
    </Panel>
  );
  return (
    <div className="space-y-4">
      <div
        className="campus-event-switch flex gap-1 rounded-lg border bg-card p-1 md:hidden"
        aria-label="Event sources"
      >
        {(
          [
            ["university", "My University"],
            ["open", "Around You"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            className="flex-1"
            variant={mobile === key ? "secondary" : "ghost"}
            aria-pressed={mobile === key}
            onClick={() => setMobile(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div
        className="grid items-start gap-5 md:grid-cols-2"
        onTouchStart={(e) => {
          if (
            e.target instanceof Element &&
            e.target.closest("input, select, button, textarea, .campus-ring")
          )
            return;
          const point = e.touches[0];
          if (point) touch.current = { x: point.clientX, y: point.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          const end = e.changedTouches[0];
          if (!start || !end || !window.matchMedia("(max-width: 767px)").matches) return;
          const dx = end.clientX - start.x;
          if (Math.abs(dx) > Math.max(65, 1.35 * Math.abs(end.clientY - start.y)))
            setMobile(dx < 0 ? "open" : "university");
        }}
      >
        <section
          className={`${mobile === "university" ? "" : "hidden md:block"} min-w-0 space-y-3`}
        >
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            <Heading title="My University" />
          </div>
          <Panel className="space-y-3 p-4">
            <EmailConnect
              plan={plan}
              demo={!id}
              change={(patch) => void workspace.savePlan((p) => ({ ...p, ...patch }))}
            />
            {plan.emailProvider && (
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={hide}
                  onChange={(e) => setHide(e.target.checked)}
                />
                Hide low-value emails
              </label>
            )}
          </Panel>
          {inbox.map(({ item, rating }) => {
            const { event, importance } = item;
            const state = plan.inbox[event.id];
            return (
              <Panel
                key={event.id}
                className={`space-y-3 p-4 ${importance === "Critical" ? "border-l-4 border-l-destructive" : ""}`}
              >
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    shade={
                      importance === "Critical"
                        ? "red"
                        : importance === "Important"
                          ? "amber"
                          : importance === "Optional"
                            ? "sky"
                            : "violet"
                    }
                  >
                    {importance}
                  </Badge>
                  {importance === "Critical" && <Badge shade="red">Don’t miss</Badge>}
                  <Badge shade="sky">Necessity {rating.necessity}/100</Badge>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {item.sender} · {dateText(event.starts_at)}
                  </p>
                  <h3 className="mt-0.5 text-sm font-extrabold">{event.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.deadline ? "Due" : "Location"}:{" "}
                    {item.deadline ? dateText(event.starts_at) : event.venue}
                  </p>
                </div>
                <p className="text-xs font-medium">{rating.reason}</p>
                {!item.deadline && fitBadge(rating)}
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold text-primary">
                    Why this rating?
                  </summary>
                  <p className="mt-2">
                    Importance: {importance} · Deadline urgency: {rating.urgency}/12
                  </p>
                  <dl className="mt-1 divide-y rounded border px-2">
                    {rating.factors.map(([name, score]) => (
                      <div key={name} className="flex justify-between py-1">
                        <dt>{name}</dt>
                        <dd>{score}%</dd>
                      </div>
                    ))}
                  </dl>
                </details>
                <div className="flex flex-wrap items-center gap-2">
                  {!item.deadline && importance !== "Ignore" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        changeInbox(event.id, "engaged");
                        openEvent(event);
                      }}
                    >
                      View event
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={state === "ignored"}
                    onClick={() => changeInbox(event.id, "ignored")}
                  >
                    {state === "ignored" ? "Ignored" : "Ignore email"}
                  </Button>
                  {state === "engaged" && <Badge shade="mint">Engaged</Badge>}
                </div>
              </Panel>
            );
          })}
          {local.map(({ event, fit }) => (
            <Panel key={event.id} className="space-y-2 p-4">
              <div className="flex flex-wrap gap-1.5">
                {event.critical && <Badge shade="red">Don’t miss</Badge>}
                <Badge>{event.category}</Badge>
                {fitBadge(fit)}
              </div>
              <h3 className="text-sm font-extrabold">{event.title}</h3>
              <p className="text-xs text-muted-foreground">
                {dateText(event.starts_at)} · {event.venue}
              </p>
              <p className="text-xs font-medium">{fit.reason}</p>
              <FitDetails fit={fit} />
              <Button variant="outline" size="sm" onClick={() => openEvent(event)}>
                View event
              </Button>
            </Panel>
          ))}
          {!local.length && !inbox.length && <Empty>No university events to show yet.</Empty>}
        </section>
        <section className={`${mobile === "open" ? "" : "hidden md:block"} min-w-0 space-y-3`}>
          <div className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" />
            <Heading title="Around You" />
            <div
              className="ml-auto flex gap-1 rounded-md border bg-card p-1"
              aria-label="Around You view"
            >
              <Button
                size="sm"
                variant={ring ? "ghost" : "secondary"}
                aria-pressed={!ring}
                onClick={() => setRing(false)}
              >
                Grid
              </Button>
              <Button
                size="sm"
                variant={ring ? "secondary" : "ghost"}
                aria-pressed={ring}
                onClick={() => setRing(true)}
              >
                Ring
              </Button>
            </div>
          </div>
          <Panel className="grid grid-cols-2 gap-2 p-3">
            <div className="col-span-2">
              <Field label="Search open events">
                <input
                  placeholder="Event or organizer"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
            </div>
            <Field label="City / Emirate">
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {eventCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Event date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Price">
              <select value={cost} onChange={(e) => setCost(e.target.value)}>
                <option value="">Any price</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                className="accent-primary"
                checked={high}
                onChange={(e) => setHigh(e.target.checked)}
              />
              Only 70%+
            </label>
          </Panel>
          {visible.length > 0 && (
            <svg
              className="universe-host-stars universe-scroll-section"
              viewBox="0 0 420 62"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <circle cx="29" cy="30" r="4" />
              {[...new Set(visible.map(({ event }) => event.host_university).filter(Boolean))]
                .slice(0, 8)
                .map((host, i) => {
                  const x = 113 + i * 38,
                    y = i % 2 ? 45 : 15;
                  return (
                    <g key={host}>
                      <path pathLength="1" d={`M29 30 Q${x / 2} ${i % 2 ? 63 : -6} ${x} ${y}`} />
                      <circle cx={x} cy={y} r="2.7" />
                    </g>
                  );
                })}
            </svg>
          )}
          {!visible.length && <Empty>No open events match these filters.</Empty>}
          {ring ? (
            <EventRing
              label="Around You"
              items={visible}
              open={openEvent}
              render={(item) => renderOpen(item, true)}
            />
          ) : (
            visible.map((item) => renderOpen(item))
          )}
        </section>
      </div>
    </div>
  );
}
