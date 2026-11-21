import { useState, type FormEvent } from "react";
import { Bookmark, CalendarDays, ListFilter, MapPin, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { calendarEvent, canPublish, dateText, eventCategories } from "./data";
import { EventLine } from "./overview";
import { Badge, Empty, Field, Heading, Modal, Panel } from "./ui";
import { errorText, guard, iso, Photo, val, type ModuleProps } from "./services";
import { Discovery, FitDetails } from "./event-discovery";
import { eventExtras, sampleInbox } from "./discovery-data";
import { WorthDial } from "./event-ring";
import { eventFit, markAttended } from "./planner";
import { uploadPhoto } from "./workspace";
import { toast } from "sonner";
import { successSignal } from "./universe-motion";

export function Events({
  workspace,
  id,
  openEvent,
}: ModuleProps & { openEvent: (e: Tables<"events">) => void }) {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("All categories"),
    [tab, setTab] = useState("Discover"),
    [editing, setEditing] = useState<Tables<"events"> | "new" | null>(null);
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const own = workspace.state.activity.filter((a) => a.user_id === (id ?? "demo"));
  const publisher = !id || canPublish(workspace.state.roles);
  const [rsvpBusy, setRsvpBusy] = useState("");
  const eventOwner = id ?? "demo-organizer";
  async function rsvp(event: Tables<"events">) {
    setRsvpBusy(event.id);
    try {
      if (id) {
        guard(
          (await supabase.from("event_activity").insert({ event_id: event.id, kind: "registered" }))
            .error,
        );
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          activity: [
            ...s.activity,
            { event_id: event.id, user_id: "demo", kind: "registered", created_at: iso() },
          ],
        }));
      successSignal("You're in the UniVerse");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setRsvpBusy("");
    }
  }
  const rows = [
    ...workspace.state.events,
    ...(!id && tab !== "Manage" ? sampleInbox.map((m) => m.event) : []),
  ].filter(
    (e) =>
      (category === "All categories" || e.category === category) &&
      `${e.title} ${e.venue} ${e.description}`.toLowerCase().includes(q.toLowerCase()) &&
      (tab === "Discover" ||
        (tab === "Manage" && e.owner === eventOwner) ||
        own.some(
          (a) => a.event_id === e.id && a.kind === (tab === "Saved" ? "saved" : "registered"),
        )),
  );
  async function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setStatus("");
    try {
      const file = f.get("poster");
      let poster = current?.poster ?? "";
      if (file instanceof File && file.size) {
        if (id) poster = await uploadPhoto(id, file);
        else {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 1_000_000
          )
            throw new Error("Choose a PNG, JPG, or WebP under 1 MB in the demo.");
          poster = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("Couldn’t read poster."));
            reader.onerror = () => reject(new Error("Couldn’t read poster."));
            reader.readAsDataURL(file);
          });
        }
      }
      const row = {
        title: val(f, "title"),
        visibility: val(f, "visibility") === "university" ? "university" : "all",
        city: val(f, "city"),
        poster,
        registration_url: val(f, "registration_url"),
        capacity: val(f, "capacity") ? Number(val(f, "capacity")) : null,
        outcomes: val(f, "outcomes"),
        paid: f.get("paid") === "on",
        critical: f.get("critical") === "on",
        category: val(f, "category"),
        description: val(f, "description"),
        venue: val(f, "venue"),
        eligibility: val(f, "eligibility"),
        starts_at: new Date(val(f, "starts")).toISOString(),
        deadline: new Date(val(f, "deadline")).toISOString(),
      };
      if (row.deadline > row.starts_at)
        throw new Error("Registration must close before the event starts.");
      if (row.registration_url && new URL(row.registration_url).protocol !== "https:")
        throw new Error("Use an HTTPS registration link.");
      if (id)
        guard(
          (
            await (editing && editing !== "new"
              ? supabase.from("events").update(row).eq("id", editing.id)
              : supabase.from("events").insert(row))
          ).error,
        );
      else {
        const event = {
          ...eventExtras,
          ...row,
          id: current?.id ?? crypto.randomUUID(),
          owner: eventOwner,
          host_university: workspace.state.profile?.university ?? "Westbridge University",
          created_at: current?.created_at ?? iso(),
        };
        workspace.update((s) => ({
          ...s,
          events: current
            ? s.events.map((e) => (e.id === current.id ? event : e))
            : [...s.events, event],
        }));
      }
      await workspace.refresh();
      setEditing(null);
      setTab("Manage");
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const current = editing && editing !== "new" ? editing : null;
  const local = (stamp?: string) =>
    stamp
      ? new Date(Date.parse(stamp) - new Date(stamp).getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
          {["Discover", "My Registered Events", "Saved", ...(publisher ? ["Manage"] : [])].map(
            (t) => (
              <Button
                key={t}
                size="sm"
                variant={t === tab ? "secondary" : "ghost"}
                aria-pressed={t === tab}
                onClick={() => setTab(t)}
              >
                {t}
              </Button>
            ),
          )}
        </div>
        {publisher && (
          <Button
            onClick={() => {
              setStatus("");
              setEditing("new");
            }}
          >
            <Plus /> Publish event
          </Button>
        )}
      </div>
      {tab === "Discover" ? (
        <Discovery
          workspace={workspace}
          id={id}
          openEvent={openEvent}
          onRsvp={rsvp}
          busy={rsvpBusy}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              className="campus-input flex-1"
              aria-label="Search events"
              placeholder="Search events, locations, or topics…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <label className="flex items-center gap-2">
              <ListFilter size={16} />
              <select
                className="campus-input"
                aria-label="Event category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {["All categories", ...eventCategories].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          {!rows.length && <Empty>No events match this view.</Empty>}
          <Panel className="divide-y overflow-hidden">
            {rows.map((event, index) => (
              <div key={event.id}>
                <EventLine event={event} index={index} onClick={() => openEvent(event)} />
                {tab === "Manage" && (
                  <div className="flex flex-wrap items-center gap-3 px-5 pb-3 text-xs text-muted-foreground">
                    <Users size={15} />
                    {
                      workspace.state.activity.filter(
                        (a) => a.kind === "registered" && a.event_id === event.id,
                      ).length
                    }{" "}
                    registrations{" "}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setStatus("");
                        setEditing(event);
                      }}
                    >
                      Edit event
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </Panel>
        </>
      )}
      {editing && (
        <Modal title={current ? "Edit event" : "Publish an event"} onClose={() => setEditing(null)}>
          <form onSubmit={publish} className="grid gap-3">
            <Field label="Title">
              <input name="title" defaultValue={current?.title} required maxLength={120} />
            </Field>
            <Field label="Category">
              <select name="category" defaultValue={current?.category}>
                {eventCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                defaultValue={current?.description}
                rows={3}
                required
                maxLength={3000}
              />
            </Field>
            <Field label="Location">
              <input name="venue" defaultValue={current?.venue} required maxLength={180} />
            </Field>
            <Field label="Event start">
              <input
                name="starts"
                type="datetime-local"
                defaultValue={local(current?.starts_at)}
                required
              />
            </Field>
            <Field label="Registration deadline">
              <input
                name="deadline"
                type="datetime-local"
                defaultValue={local(current?.deadline)}
                required
              />
            </Field>
            <Field label="Eligibility">
              <input
                name="eligibility"
                defaultValue={current?.eligibility}
                required
                maxLength={500}
              />
            </Field>
            <Field label="Visibility">
              <select name="visibility" defaultValue={current?.visibility ?? "university"}>
                <option value="university">My university only</option>
                <option value="all">All universities</option>
              </select>
            </Field>
            <Field label="City / Emirate">
              <input name="city" defaultValue={current?.city} required maxLength={100} />
            </Field>
            <Field label="Poster image (optional)">
              <input name="poster" type="file" accept="image/jpeg,image/png,image/webp" />
            </Field>
            <Field label="Registration link (optional)">
              <input
                name="registration_url"
                type="url"
                defaultValue={current?.registration_url}
                maxLength={1000}
              />
            </Field>
            <Field label="Capacity (optional)">
              <input
                name="capacity"
                type="number"
                min="1"
                max="1000000"
                defaultValue={current?.capacity ?? undefined}
              />
            </Field>
            <Field label="Expected outcomes">
              <textarea
                name="outcomes"
                defaultValue={current?.outcomes}
                maxLength={1200}
                rows={2}
                placeholder="e.g. Internship interviews or certificates"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="paid" defaultChecked={current?.paid} /> Paid event
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="critical" defaultChecked={current?.critical} /> Critical
              event
            </label>
            {status && (
              <p role="alert" className="text-sm text-destructive">
                {status}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {current ? "Save event" : "Publish event"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function EventModal({
  workspace,
  id,
  event,
  close,
}: ModuleProps & { event: Tables<"events">; close: () => void }) {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const uid = id ?? "demo";
  const own = workspace.state.activity.filter((a) => a.user_id === uid && a.event_id === event.id);
  const registered = own.some((a) => a.kind === "registered");
  const saved = own.some((a) => a.kind === "saved");
  const closed = Date.parse(event.deadline) < Date.now();
  const plan = workspace.state.plan;
  const attended = plan.attended.includes(event.id);
  const fit = eventFit(event, plan, workspace.state.profile);
  const student = !workspace.state.roles.some((r) => r !== "student");
  async function attend() {
    setBusy(true);
    try {
      if (await workspace.savePlan((p) => markAttended(p, event)))
        setStatus(
          plan.automation.events
            ? "Attendance recorded. A draft is waiting in LinkedIn Queue."
            : "Attendance recorded.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function change(kind: string, remove: boolean) {
    setBusy(true);
    setStatus("");
    try {
      if (id) {
        const r = remove
          ? await supabase
              .from("event_activity")
              .delete()
              .eq("user_id", id)
              .eq("event_id", event.id)
              .eq("kind", kind)
          : await supabase.from("event_activity").insert({ event_id: event.id, kind });
        guard(r.error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          activity: remove
            ? s.activity.filter((a) => a.event_id !== event.id || a.kind !== kind)
            : [...s.activity, { event_id: event.id, kind, user_id: uid, created_at: iso() }],
        }));
      if (!remove) successSignal(kind === "registered" ? "You're in the UniVerse" : "Event saved.");
      setStatus(
        remove
          ? kind === "registered"
            ? "Registration cancelled."
            : "Removed from saved events."
          : kind === "registered"
            ? "You’re registered!"
            : "Event saved.",
      );
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={event.title} description={event.category} onClose={close} placement="edge">
      <div className="space-y-3 text-sm">
        {event.poster &&
          (!id ? (
            <img
              src={event.poster}
              alt="Event poster"
              className="max-h-52 w-full rounded-md object-contain"
            />
          ) : (
            <Photo path={event.poster} alt="Event poster" viewerId={id} />
          ))}
        <p>{event.description}</p>
        {event.outcomes && (
          <p>
            <strong>Expected outcomes:</strong> {event.outcomes}
          </p>
        )}
        {event.capacity && (
          <p>
            <strong>Capacity:</strong> {event.capacity}
          </p>
        )}
        {event.registration_url.startsWith("https://") && (
          <Button variant="link" asChild>
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
              Organizer registration
            </a>
          </Button>
        )}
        {student && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <WorthDial score={fit.score} />
              <span className="campus-mono text-xs text-muted-foreground">Worth it for you</span>
            </div>
            <p className="text-xs">{fit.reason}</p>
            <FitDetails fit={fit} />
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays size={16} />
          {dateText(event.starts_at, {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={16} />
          {event.venue}
        </div>
        <p>
          <strong>Registration deadline:</strong>{" "}
          {dateText(event.deadline, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
        </p>
        <p>
          <strong>Eligibility:</strong> {event.eligibility}
        </p>
        {registered && <Badge shade="mint">Registered</Badge>}
        {attended && <Badge shade="mint">Attended</Badge>}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || (closed && !registered)}
            onClick={() => void change("registered", registered)}
          >
            {registered ? "Cancel registration" : closed ? "Registration closed" : "Register"}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void change("saved", saved)}>
            <Bookmark />
            {saved ? "Unsave event" : "Save event"}
          </Button>
          {student &&
            !attended &&
            (registered || Date.parse(event.starts_at) <= Date.now()) &&
            (!id || Date.parse(event.starts_at) <= Date.now()) && (
              <Button variant="secondary" disabled={busy} onClick={() => void attend()}>
                Mark as attended
              </Button>
            )}
          <Button variant="outline" onClick={() => calendarEvent(event)}>
            <CalendarDays /> Add to calendar
          </Button>
        </div>
        {status && (
          <p role="status" className="text-muted-foreground">
            {status}
          </p>
        )}
        {id && event.owner === id && (
          <div className="border-t pt-2">
            <Heading title="Registrations" />
            {workspace.state.activity
              .filter((a) => a.event_id === event.id && a.kind === "registered")
              .map((a) => (
                <p key={a.user_id} className="break-all text-xs text-muted-foreground">
                  {a.user_id} · {dateText(a.created_at)}
                </p>
              ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
