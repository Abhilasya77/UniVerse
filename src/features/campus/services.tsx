import { useState, type FormEvent } from "react";
import {
  Camera,
  CircleHelp,
  Download,
  MapPin,
  MessageSquare,
  PackageSearch,
  Plus,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { campusAI } from "./ai.functions";
import {
  dateText,
  departments,
  downloadFile,
  notifyKinds,
  profileFields,
  ticketStages,
  type ProfileKey,
} from "./data";
import { Badge, Empty, Field, Heading, IconTile, Modal, Panel } from "./ui";
import { successSignal } from "./universe-motion";
import { uploadPhoto, usePhoto, type useWorkspace } from "./workspace";
export type ModuleProps = {
  workspace: ReturnType<typeof useWorkspace>;
  id?: string | undefined;
  email?: string | undefined;
};
export const val = (data: FormData, field: string) => String(data.get(field) ?? "").trim();
export const guard = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
export const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "Could not complete the request.";
export const iso = () => new Date().toISOString();
export function Photo({
  path,
  alt,
  viewerId,
  avatar = false,
}: {
  path: string;
  alt: string;
  viewerId: string | undefined;
  avatar?: boolean;
}) {
  const url = usePhoto(path, viewerId);
  return url ? (
    <img
      src={url}
      alt={alt}
      className={
        avatar ? "size-12 rounded-full object-cover" : "mt-3 h-36 w-full rounded-md object-cover"
      }
    />
  ) : null;
}
export function Profile({ workspace, id, email }: ModuleProps) {
  const p = workspace.state.profile;
  const [status, setStatus] = useState("");
  const [career, setCareer] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const skills =
    p?.skills
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean) ?? [];
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fields = Object.fromEntries(
      Object.keys(profileFields).map((k) => [k, val(form, k)]),
    ) as Record<ProfileKey, string>;
    setStatus("");
    setBusy(true);
    try {
      if (id) {
        const file = form.get("photo");
        const avatar = await uploadPhoto(id, file instanceof File ? file : null);
        guard(
          (await supabase.from("profiles").upsert({ id, ...fields, ...(avatar ? { avatar } : {}) }))
            .error,
        );
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          profile: s.profile ? { ...s.profile, ...fields } : null,
        }));
      setSaved(true);
      setStatus("Profile saved.");
      successSignal("Profile saved.");
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function coach() {
    setBusy(true);
    setCareer("");
    try {
      setCareer(
        id
          ? (
              await campusAI({
                data: {
                  mode: "career",
                  text: `Use these real projects and achievements: ${p?.portfolio ?? ""}`,
                },
              })
            ).text
          : `Sample roadmap for ${p?.goals || "a career in technology"}\n\n1. Build a small project and publish a case study.\n2. Practice analytics and version control.\n3. Ask a mentor to review your portfolio.\n\nSample LinkedIn headline: University student | Campus projects & continuous learning.`,
      );
    } catch {
      setCareer("CampusIQ is temporarily unavailable. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <Panel className="p-5">
        <Heading
          title={id && !p?.university && !saved ? "Complete your profile" : "Edit profile"}
        />
        <div className="my-3">
          {p?.avatar && <Photo path={p.avatar} alt="Your profile photo" viewerId={id} avatar />}
        </div>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" key={p?.id ?? id}>
          {email && (
            <Field label="Account email">
              <input readOnly value={email} />
            </Field>
          )}
          {Object.entries(profileFields).map(([key, label]) => (
            <div key={key} className={["bio", "portfolio"].includes(key) ? "sm:col-span-2" : ""}>
              <Field label={label}>
                {["bio", "portfolio"].includes(key) ? (
                  <textarea
                    name={key}
                    defaultValue={p?.[key as ProfileKey] ?? ""}
                    rows={3}
                    maxLength={3000}
                  />
                ) : (
                  <input
                    name={key}
                    defaultValue={p?.[key as ProfileKey] ?? ""}
                    required={key === "name" || key === "university"}
                    maxLength={400}
                  />
                )}
              </Field>
            </div>
          ))}
          {id && (
            <Field label="Profile picture">
              <input type="file" name="photo" accept="image/png,image/jpeg,image/webp" />
            </Field>
          )}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              Save profile
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!p}
              onClick={() =>
                p &&
                downloadFile(
                  "universe-portfolio.md",
                  `# ${p.name}\n\n${p.degree} · ${p.university}\n\n${p.bio}\n\n## Skills\n${p.skills}\n\n## Career goals\n${p.goals}\n\n## Portfolio\n${p.portfolio}`,
                )
              }
            >
              <Download /> Export portfolio
            </Button>
          </div>
          {status && (
            <p role="status" className="text-sm text-muted-foreground sm:col-span-2">
              {status}
            </p>
          )}
        </form>
      </Panel>
      <div className="space-y-5">
        <Panel className="space-y-3 p-5">
          <Heading title="Skill progress" />
          {skills.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <Badge key={`${s}-${i}`}>{s}</Badge>
                ))}
              </div>
              <progress
                className="campus-progress"
                value={Math.min(skills.length, 5)}
                max={5}
                aria-label="Skills added toward five"
              />
              <p className="text-xs text-muted-foreground">{skills.length} skills added</p>
            </>
          ) : (
            <Empty>No skills added yet.</Empty>
          )}
        </Panel>
        <Panel className="space-y-3 p-5">
          <IconTile icon={Sparkles} />
          <Heading title="AI Career Assistant" />
          <Button disabled={busy} onClick={() => void coach()}>
            Generate career plan <Sparkles />
          </Button>
          {career && (
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{career}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function Care({ workspace, id }: ModuleProps) {
  const [open, setOpen] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const staff = Boolean(id) && workspace.state.roles.some((r) => r === "admin" || r === "provider");
  const queue = useQuery({
    queryKey: ["campus-service", id],
    enabled: staff,
    queryFn: async () => {
      const r = await supabase.rpc("campus_service_queue");
      guard(r.error);
      return r.data ?? [];
    },
  });
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const f = new FormData(e.currentTarget);
    try {
      const category = val(f, "category");
      const file = f.get("photo");
      const photo = id ? await uploadPhoto(id, file instanceof File ? file : null) : "";
      const row = {
        category,
        department: departments[category] ?? "Student Services",
        location: val(f, "location"),
        description: val(f, "description"),
        priority: val(f, "priority"),
        anonymous: f.has("anonymous"),
        photo,
      };
      if (id) {
        guard((await supabase.from("complaints").insert(row)).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          complaints: [
            {
              ...row,
              id: `CC-${crypto.randomUUID().slice(0, 8)}`,
              owner: "demo",
              status: "Submitted",
              resolution: "",
              created_at: iso(),
            },
            ...s.complaints,
          ],
        }));
      setOpen(false);
      setStatus("Campus request submitted.");
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function advance(ticket: string) {
    const note = notes[ticket]?.trim();
    if (!note) return;
    setBusy(true);
    try {
      guard((await supabase.rpc("campus_advance_ticket", { ticket, note })).error);
      await Promise.all([queue.refetch(), workspace.refresh()]);
      setNotes((current) => ({ ...current, [ticket]: "" }));
      setStatus("Status updated.");
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading title="My campus requests" />
        <Button
          onClick={() => {
            setStatus("");
            setOpen(true);
          }}
        >
          <Plus /> Report an issue
        </Button>
      </div>
      {status && !open && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
      {workspace.state.complaints.length === 0 && (
        <Empty>You haven’t reported a campus issue.</Empty>
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        {workspace.state.complaints.map((c) => (
          <Panel key={c.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-extrabold">{c.category}</h3>
              <Badge shade={c.status === "Resolved" ? "mint" : "amber"}>{c.status}</Badge>
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {c.id} · {dateText(c.created_at)}
            </p>
            <p className="mt-2 text-sm">{c.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.location} · {c.department} · {c.priority}
            </p>
            {c.photo && <Photo path={c.photo} alt="Campus request attachment" viewerId={id} />}
            <div className="mt-3 flex flex-wrap gap-1">
              {ticketStages.map((stage, i) => (
                <span
                  key={stage}
                  className={`rounded px-1.5 py-1 text-[10px] font-medium ${i <= ticketStages.indexOf(c.status) ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {stage}
                </span>
              ))}
            </div>
            {c.resolution && <p className="mt-3 border-t pt-2 text-sm">{c.resolution}</p>}
          </Panel>
        ))}
      </div>
      {staff && (
        <div className="space-y-3">
          <Heading title="Assigned service queue" />
          {queue.error && <Empty>Could not load the service queue.</Empty>}
          {queue.data?.length === 0 && <Empty>No assigned campus requests.</Empty>}
          {queue.data?.map((c) => (
            <Panel key={c.id} className="space-y-2 p-4">
              <h3 className="font-bold">
                {c.category} · {c.status}
              </h3>
              <p className="text-sm">{c.description}</p>
              <p className="text-xs text-muted-foreground">
                {c.location} · {c.priority} · {c.reporter}
              </p>
              {c.photo && <Photo path={c.photo} alt="Service request attachment" viewerId={id} />}
              {c.status !== "Resolved" && (
                <div className="flex flex-wrap gap-2">
                  <input
                    aria-label={`Resolution update for ${c.category}`}
                    className="campus-input flex-1"
                    value={notes[c.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                  />
                  <Button
                    disabled={busy || !notes[c.id]?.trim()}
                    onClick={() => void advance(c.id)}
                  >
                    Move to {ticketStages[ticketStages.indexOf(c.status) + 1]}
                  </Button>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Report a campus issue" onClose={() => setOpen(false)}>
          <form className="grid gap-3" onSubmit={submit}>
            <Field label="Category">
              <select name="category">
                {Object.keys(departments).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input name="location" required maxLength={150} />
            </Field>
            <Field label="Description">
              <textarea name="description" required rows={3} maxLength={3000} />
            </Field>
            <Field label="Priority">
              <select name="priority" defaultValue="Normal">
                {["Low", "Normal", "High", "Urgent"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            {id && (
              <Field label="Photo (optional)">
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" />
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="anonymous" /> Hide my name from service staff
            </label>
            {status && (
              <p role="alert" className="text-sm text-destructive">
                {status}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              Submit request
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function LostFound({ workspace, id }: ModuleProps) {
  const [open, setOpen] = useState(false),
    [q, setQ] = useState(""),
    [kind, setKind] = useState("All"),
    [state, setState] = useState(""),
    [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Tables<"items"> | null>(null);
  const [match, setMatch] = useState<{ title: string; text: string } | null>(null);
  const items = workspace.state.items.filter(
    (i) =>
      (kind === "All" || i.kind === kind) &&
      `${i.title} ${i.description} ${i.location}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setState("");
    const f = new FormData(e.currentTarget);
    try {
      const file = f.get("photo");
      const photo = id ? await uploadPhoto(id, file instanceof File ? file : null) : "";
      const row = {
        title: val(f, "title"),
        description: val(f, "description"),
        location: val(f, "location"),
        item_date: val(f, "date"),
        kind: val(f, "kind"),
        photo,
      };
      if (id) {
        guard((await supabase.from("items").insert(row)).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          items: [
            { ...row, id: crypto.randomUUID(), owner: "demo", status: "Open", created_at: iso() },
            ...s.items,
          ],
        }));
      setOpen(false);
      setState("Item report posted.");
    } catch (e) {
      setState(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function matching(item: Tables<"items">) {
    setMatch({ title: item.title, text: "Checking listings…" });
    try {
      const text = id
        ? (
            await campusAI({
              data: {
                mode: "matches",
                text: "Find potential matches for this listing.",
                matchId: item.id,
              },
            })
          ).text
        : workspace.state.items
            .filter(
              (i) =>
                i.kind !== item.kind &&
                i.status === "Open" &&
                i.title
                  .toLowerCase()
                  .split(/\W+/)
                  .some((w) => w.length > 3 && item.title.toLowerCase().includes(w)),
            )
            .map((i) => `${i.title} — ${i.location}`)
            .join("\n") || "No similar opposite-type sample listings.";
      setMatch((current) =>
        current?.title === item.title ? { title: item.title, text } : current,
      );
    } catch {
      setMatch((current) =>
        current?.title === item.title
          ? { title: item.title, text: "Matching is temporarily unavailable." }
          : current,
      );
    }
  }
  async function changeStatus(item: Tables<"items">, status: string) {
    try {
      if (id) {
        guard((await supabase.from("items").update({ status }).eq("id", item.id)).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === item.id ? { ...i, status } : i)),
        }));
    } catch (e) {
      setState(errorText(e));
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          className="campus-input flex-1"
          aria-label="Search lost and found"
          placeholder="Search items or locations…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="Listing type"
          className="campus-input !w-auto"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {["All", "Lost", "Found"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Button
          onClick={() => {
            setState("");
            setOpen(true);
          }}
        >
          <Plus /> Report an item
        </Button>
      </div>
      {state && !open && (
        <p role="status" className="text-sm text-muted-foreground">
          {state}
        </p>
      )}
      {!items.length && <Empty>No matching items.</Empty>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <Panel key={i.id} className="space-y-2.5 p-4">
            <div className="flex justify-between gap-2">
              <IconTile icon={PackageSearch} shade={i.kind === "Found" ? "mint" : "amber"} />
              <Badge shade={i.kind === "Found" ? "mint" : "amber"}>
                {i.kind} · {i.status}
              </Badge>
            </div>
            {i.photo && <Photo path={i.photo} alt={i.title} viewerId={id} />}
            <h3 className="font-extrabold">{i.title}</h3>
            <p className="text-sm text-muted-foreground">{i.description}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={13} />
              {i.location} · {dateText(i.item_date)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => void matching(i)}>
                <Sparkles /> Find matches
              </Button>
              {i.owner !== (id ?? "demo") && (
                <Button size="sm" variant="outline" onClick={() => setMessage(i)}>
                  <MessageSquare /> Message
                </Button>
              )}
            </div>
            {i.owner === (id ?? "demo") && (
              <Field label="Listing status">
                <select value={i.status} onChange={(e) => void changeStatus(i, e.target.value)}>
                  {["Open", "Potential Match", "Returned", "Closed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            )}
          </Panel>
        ))}
      </div>
      {open && (
        <Modal title="Report lost or found item" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="grid gap-3">
            <Field label="Type">
              <select name="kind">
                <option>Lost</option>
                <option>Found</option>
              </select>
            </Field>
            <Field label="Item name">
              <input name="title" required maxLength={120} />
            </Field>
            <Field label="Description">
              <textarea name="description" required rows={3} maxLength={2000} />
            </Field>
            <Field label="Location">
              <input name="location" required maxLength={120} />
            </Field>
            <Field label="Date">
              <input name="date" type="date" required defaultValue={iso().slice(0, 10)} />
            </Field>
            {id && (
              <Field label="Photo (optional)">
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" />
              </Field>
            )}
            {state && (
              <p role="alert" className="text-sm text-destructive">
                {state}
              </p>
            )}
            <Button disabled={busy} type="submit">
              Post item report
            </Button>
          </form>
        </Modal>
      )}
      {match && (
        <Modal
          title={`Potential matches: ${match.title}`}
          description={
            id ? "Matches are not verified." : "Demo matching uses sample listing descriptions."
          }
          onClose={() => setMatch(null)}
        >
          <p className="whitespace-pre-wrap text-sm leading-6">{match.text}</p>
        </Modal>
      )}
      {message && (
        <Modal title={`Message about ${message.title}`} onClose={() => setMessage(null)}>
          <MessageForm
            {...{ workspace, id }}
            itemId={message.id}
            recipient={message.owner}
            onSent={() => {
              setMessage(null);
              setState("Message sent.");
            }}
          />
        </Modal>
      )}
    </div>
  );
}
export function MessageForm({
  workspace,
  id,
  itemId,
  recipient,
  onSent,
}: ModuleProps & { itemId: string; recipient: string; onSent: () => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = val(new FormData(form), "body");
    if (!body) return;
    setBusy(true);
    try {
      if (id) {
        guard((await supabase.from("messages").insert({ item_id: itemId, recipient, body })).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          messages: [
            ...s.messages,
            {
              id: crypto.randomUUID(),
              item_id: itemId,
              sender: "demo",
              recipient,
              body,
              created_at: iso(),
            },
          ],
        }));
      form.reset();
      onSent();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="grid gap-2" onSubmit={send}>
      <Field label="Your message">
        <textarea name="body" rows={2} required maxLength={4000} />
      </Field>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <Button className="w-fit" disabled={busy}>
        Send message
      </Button>
    </form>
  );
}
export function Messages({ workspace, id }: ModuleProps) {
  const uid = id ?? "demo";
  const grouped = new Map<string, Tables<"messages">[]>();
  for (const m of workspace.state.messages) {
    const key = `${m.item_id}:${m.sender === uid ? m.recipient : m.sender}`;
    grouped.set(key, [...(grouped.get(key) ?? []), m]);
  }
  return (
    <div className="space-y-3">
      {!grouped.size && (
        <Empty>No conversations yet. Open a Lost & Found listing to start one.</Empty>
      )}
      {Array.from(grouped, ([key, messages]) => {
        const first = messages[0];
        if (!first) return null;
        return (
          <Panel key={key} className="space-y-3 p-4">
            <Heading
              title={
                workspace.state.items.find((i) => i.id === first.item_id)?.title ??
                "Lost & Found conversation"
              }
            />
            {messages.map((m) => (
              <div key={m.id} className="rounded-md bg-muted p-3 text-sm">
                <span className="block text-xs font-bold text-muted-foreground">
                  {m.sender === uid ? "You" : "Campus member"} · {dateText(m.created_at)}
                </span>
                <p className="mt-1 whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            ))}
            <MessageForm
              workspace={workspace}
              id={id}
              itemId={first.item_id}
              recipient={first.sender === uid ? first.recipient : first.sender}
              onSent={() => {}}
            />
          </Panel>
        );
      })}
    </div>
  );
}
export function Preferences({ workspace, id }: ModuleProps) {
  const [status, setStatus] = useState("");
  const preferences = workspace.state.profile?.preferences;
  const prefs =
    preferences && typeof preferences === "object" && !Array.isArray(preferences)
      ? preferences
      : {};
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = Object.fromEntries(Object.keys(notifyKinds).map((k) => [k, f.has(k)]));
    try {
      if (id) {
        guard((await supabase.from("profiles").update({ preferences: next }).eq("id", id)).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          profile: s.profile ? { ...s.profile, preferences: next } : null,
        }));
      setStatus("Preferences saved.");
      successSignal("Preferences saved.");
    } catch (e) {
      setStatus(errorText(e));
    }
  }
  return (
    <Panel className="max-w-2xl space-y-3 p-5">
      <Heading title="Notification preferences" />
      <form className="grid gap-2.5" onSubmit={save}>
        {Object.entries(notifyKinds).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 border-b py-2.5 text-sm"
          >
            <span>{label}</span>
            <input
              className="size-4 accent-primary"
              type="checkbox"
              name={key}
              defaultChecked={prefs[key] !== false}
            />
          </label>
        ))}
        <Button type="submit" className="mt-2 w-fit">
          Save preferences
        </Button>
        {status && (
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        )}
      </form>
    </Panel>
  );
}
