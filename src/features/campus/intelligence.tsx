import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Bell,
  Bookmark,
  CalendarDays,
  CheckCheck,
  FileText,
  Megaphone,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FocusText } from "./universe-motion";
import { campusAI } from "./ai.functions";
import { sampleInbox } from "./discovery-data";
import { calendarEvent, dateText, scoreLabels, type Section } from "./data";
import { Badge, Empty, Field, Heading, IconTile, Modal, Panel } from "./ui";
import { errorText, guard, iso, val, type ModuleProps } from "./services";

type Analysis = {
  title: string;
  summary: string;
  reasoning: string;
  score: number;
  details: string[];
};
const sampleText =
  "AI & Innovation Hackathon is open to university students. Join a team at the Innovation Lab to prototype an AI solution, get mentor feedback, and pitch to industry judges. Attendance is optional. Register through Campus Connect.";
const example: Analysis = {
  title: "AI & Innovation Hackathon",
  summary: "A hands-on team event at the Innovation Lab with mentoring and industry feedback.",
  reasoning:
    "Strong fit for the sample profile’s AI interests and machine learning goals. It offers practical experience and networking; confirm the time commitment before registering.",
  score: 96,
  details: [
    "Optional attendance",
    "Eligible: university students",
    "Skills: AI prototyping, teamwork, and pitching",
    "Next action: check the event deadline and register through Campus Connect",
  ],
};
const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () =>
      typeof r.result === "string"
        ? resolve(r.result)
        : reject(new Error("Could not read the attachment."));
    r.onerror = () => reject(new Error("Could not read the attachment."));
    r.readAsDataURL(file);
  });
export function Intelligence({
  workspace,
  id,
  go,
  openEvent,
  openNotice,
}: ModuleProps & {
  go: (s: Section) => void;
  openEvent: (e: Tables<"events">) => void;
  openNotice: (a: Tables<"announcements">) => void;
}) {
  const [text, setText] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [sample, setSample] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [announce, setAnnounce] = useState(false);
  const [saved, setSaved] = useState(false);
  const event = workspace.state.events.find(
    (e) => e.title.toLowerCase() === analysis?.title.trim().toLowerCase(),
  );
  const staff = workspace.state.roles.some((r) => r === "admin" || r === "educator");
  async function analyze(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setSaved(false);
    try {
      if (!id) {
        setSample(true);
        setAnalysis(example);
        return;
      }
      if (
        file &&
        (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 4_000_000)
      )
        throw new Error("Choose a PDF, PNG, JPG, or WebP under 4 MB.");
      const attachment = file ? { data: await readFile(file), name: file.name } : undefined;
      const result = await campusAI({ data: { mode: "announcement", text, attachment } });
      if (!result.analysis) throw new Error("No structured analysis was returned.");
      setSample(false);
      setAnalysis(result.analysis);
    } catch {
      setStatus(
        "The announcement couldn’t be analyzed. Check the attachment or try the sample analysis.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!analysis) return;
    try {
      const row = { title: analysis.title, result: JSON.stringify(analysis) };
      if (id) {
        guard((await supabase.from("analyses").insert(row)).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          analyses: [
            { ...row, id: crypto.randomUUID(), owner: "demo", created_at: iso() },
            ...s.analyses,
          ],
        }));
      setSaved(true);
      setStatus("Opportunity saved.");
    } catch (e) {
      setStatus(errorText(e));
    }
  }
  async function post(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setStatus("");
    try {
      guard(
        (
          await supabase
            .from("announcements")
            .insert({ title: val(f, "title"), body: val(f, "body"), urgent: f.has("urgent") })
        ).error,
      );
      await workspace.refresh();
      setAnnounce(false);
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Panel className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Sparkles} />
            <div>
              <Heading title="Announcement analyzer" />
              {!id && <Badge shade="amber">Demo mode · sample analyses</Badge>}
            </div>
          </div>
          <form className="grid gap-3" onSubmit={analyze}>
            <Field label="Announcement text">
              <textarea
                rows={6}
                maxLength={30000}
                placeholder="Paste a university email or announcement…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            {id && (
              <Field label="Upload a screenshot or PDF">
                <span className="flex items-center gap-2">
                  <UploadCloud size={16} />
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </span>
              </Field>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || (!text.trim() && !file)}>
                <Sparkles />
                {busy ? "Analyzing…" : "Analyze announcement"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setText(sampleText);
                  setSample(true);
                  setAnalysis(example);
                  setStatus("");
                  setSaved(false);
                }}
              >
                Try sample analysis
              </Button>
            </div>
          </form>
          {status && !announce && (
            <p className="text-sm text-muted-foreground" role="status">
              {status}
            </p>
          )}
        </Panel>
        {analysis && (
          <Panel className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge shade={analysis.score >= 75 ? "mint" : analysis.score >= 45 ? "amber" : "sky"}>
                {scoreLabels(analysis.score)}
              </Badge>
              {sample && <Badge shade="amber">Sample analysis</Badge>}
            </div>
            <h3 className="text-lg font-extrabold">{analysis.title}</h3>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Opportunity score</p>
              <p className="font-display text-3xl font-extrabold text-primary">
                {analysis.score}
                <span className="text-base text-muted-foreground"> / 100</span>
              </p>
            </div>
            <p className="text-sm">{analysis.summary}</p>
            <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {analysis.details.map((s, i) => (
                <li key={`${s}-${i}`}>{s}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={saved} onClick={() => void save()}>
                <Bookmark />
                {saved ? "Saved" : "Save opportunity"}
              </Button>
              {event && (
                <>
                  <Button size="sm" onClick={() => openEvent(event)}>
                    Register
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => calendarEvent(event)}>
                    <CalendarDays /> Add to calendar
                  </Button>
                </>
              )}
              <Button size="sm" variant="secondary" onClick={() => go("events")}>
                View similar events
              </Button>
            </div>
          </Panel>
        )}
      </div>
      <div className="space-y-4">
        <Panel className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Heading title="Important announcements" />
            {staff && (
              <Button
                size="sm"
                onClick={() => {
                  setStatus("");
                  setAnnounce(true);
                }}
              >
                Post notice
              </Button>
            )}
          </div>
          {!workspace.state.announcements.length && <Empty>No announcements published yet.</Empty>}
          {[...workspace.state.announcements]
            .sort((a, b) => Number(b.urgent) - Number(a.urgent))
            .map((n) => (
              <Button
                variant="ghost"
                className="h-auto w-full justify-start whitespace-normal border-b p-2 text-left"
                key={n.id}
                onClick={() => openNotice(n)}
              >
                <Megaphone className="text-primary" />
                <span>
                  <span className="block font-bold">{n.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {n.urgent ? "Important · " : ""}
                    {dateText(n.created_at)}
                  </span>
                </span>
              </Button>
            ))}
        </Panel>
        <Panel className="space-y-2 p-5">
          <Heading title="Saved opportunities" />
          {!workspace.state.analyses.length && <Empty>No saved analyses yet.</Empty>}
          {workspace.state.analyses.map((a) => (
            <Button
              key={a.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                try {
                  setAnalysis(JSON.parse(a.result));
                  setSample(!id);
                  setSaved(true);
                  setStatus("");
                } catch {
                  setStatus("This saved analysis is unavailable.");
                }
              }}
            >
              <FileText />
              {a.title}
            </Button>
          ))}
        </Panel>
      </div>
      {announce && (
        <Modal title="Post a campus announcement" onClose={() => setAnnounce(false)}>
          <form onSubmit={post} className="grid gap-3">
            <Field label="Title">
              <input name="title" required maxLength={150} />
            </Field>
            <Field label="Notice">
              <textarea name="body" required maxLength={5000} rows={5} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="urgent" /> Mark as important
            </label>
            {status && (
              <p role="alert" className="text-sm text-destructive">
                {status}
              </p>
            )}
            <Button disabled={busy}>Publish announcement</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function Notices({ workspace, id }: ModuleProps) {
  const [error, setError] = useState("");
  const p = workspace.state.profile?.preferences;
  const prefs = p && typeof p === "object" && !Array.isArray(p) ? p : {};
  const notices = workspace.state.notices.filter((n) => prefs[n.kind] !== false);
  async function mark(notice?: string) {
    try {
      if (id) {
        let req = supabase.from("notifications").update({ read: true }).eq("user_id", id);
        if (notice) req = req.eq("id", notice);
        guard((await req).error);
        await workspace.refresh();
      } else
        workspace.update((s) => ({
          ...s,
          notices: s.notices.map((n) => (!notice || n.id === notice ? { ...n, read: true } : n)),
        }));
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => void mark()}
          disabled={!notices.some((n) => !n.read)}
        >
          <CheckCheck /> Mark all read
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!notices.length && <Empty>You’re all caught up.</Empty>}
      {notices.map((n) => (
        <Panel key={n.id} className="flex items-start gap-3 p-4">
          <IconTile icon={Bell} shade={n.read ? "sky" : "violet"} />
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold">{n.title}</h3>
            <p className="text-sm text-muted-foreground">{n.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{dateText(n.created_at)}</p>
          </div>
          {!n.read && (
            <Button size="sm" variant="ghost" onClick={() => void mark(n.id)}>
              Mark read
            </Button>
          )}
        </Panel>
      ))}
    </div>
  );
}

export function CampusIQ({
  id,
  open,
  close,
  go,
  events,
}: {
  id?: string | undefined;
  open: boolean;
  close: () => void;
  go: (s: Section) => void;
  events: Tables<"events">[];
}) {
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [messages, setMessages] = useState<{ question: string; answer: string }[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy, open]);
  const prompts = [
    "What events are coming up?",
    "Help me plan my career",
    "How do I report a campus issue?",
  ];
  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setBusy(true);
    setText("");
    try {
      const history = messages
        .slice(-4)
        .map((m) => `Q: ${m.question}\nA: ${m.answer}`)
        .join("\n");
      const answer = id
        ? (await campusAI({ data: { mode: "chat", text: `${history}\nCurrent question: ${q}` } }))
            .text
        : /career|skill|cv/i.test(q)
          ? "Sample guidance: add your skills and career goals in Student Hub, then generate a career plan."
          : /report|issue|wifi/i.test(q)
            ? "Open Campus Care and choose Report an issue. You can see the status of your request there."
            : /announc|notice/i.test(q)
              ? "Open AI Intelligence to read announcements and try a sample analysis."
              : `Sample upcoming events:\n${events
                  .slice(0, 3)
                  .map((e) => `• ${e.title} — ${dateText(e.starts_at)}`)
                  .join("\n")}`;
      setMessages((old) => [...old, { question: q, answer }]);
    } catch {
      setMessages((old) => [
        ...old,
        { question: q, answer: "CampusIQ is temporarily unavailable. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }
  if (!open) return null;
  return (
    <div className="campus-card campus-iq-panel fixed right-3 z-40 flex max-h-[min(530px,75dvh)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden shadow-xl sm:right-6">
      <div className="flex items-center gap-3 bg-night p-4 text-night-text">
        <IconTile icon={Sparkles} />
        <div className="flex-1">
          <h2 className="font-extrabold">
            <FocusText text="CampusIQ" />
          </h2>
          <p className="text-xs text-night-muted">
            {id ? "Your campus assistant" : "Demo assistant · sample answers"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="hover:text-foreground"
          aria-label="Close CampusIQ"
          onClick={close}
        >
          <X />
        </Button>
      </div>
      <div className="space-y-3 overflow-auto p-4" aria-live="polite">
        {!messages.length ? (
          <>
            <p className="text-sm">Hi! What would you like to know about campus?</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((p) => (
                <Button variant="secondary" size="sm" key={p} onClick={() => void ask(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </>
        ) : (
          messages.map((m, i) => (
            <div className="space-y-2 text-sm" key={i}>
              <p className="ml-4 rounded-md bg-secondary p-2.5 break-words">{m.question}</p>
              <p className="mr-4 rounded-md bg-muted p-2.5 whitespace-pre-wrap break-words">
                {m.answer}
              </p>
            </div>
          ))
        )}
        {busy && <p className="text-sm text-muted-foreground">CampusIQ is thinking…</p>}
        <div ref={bottom} />
      </div>
      <div className="flex gap-1 border-t px-3 pt-1">
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            go("events");
            close();
          }}
        >
          Campus Connect
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            go("care");
            close();
          }}
        >
          Campus Care
        </Button>
      </div>
      <form
        className="flex gap-2 p-3 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
      >
        <input
          className="campus-input"
          aria-label="Ask CampusIQ"
          placeholder="Ask CampusIQ…"
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          size="icon"
          className="shrink-0 self-center"
          aria-label="Send to CampusIQ"
          disabled={busy || !text.trim()}
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}

type Metrics = {
  events: number;
  registrations: number;
  complaints: number;
  resolved: number;
  categories: { name: string; total: number }[];
  event_counts: { name: string; total: number }[];
  engagement?: { name: string; total: number }[];
  interests?: { name: string; total: number }[];
  careers?: { name: string; total: number }[];
};
function EngagementPanels({ workspace, id }: ModuleProps) {
  const admin = Boolean(id) && workspace.state.roles.includes("admin");
  const query = useQuery({
    queryKey: ["campus-critical-rsvps", id],
    enabled: admin,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const r = await supabase.rpc("campus_critical_rsvps");
      guard(r.error);
      return r.data ?? [];
    },
  });
  const statuses = Object.values(workspace.state.plan.inbox);
  const engaged = statuses.filter((v) => v === "engaged").length;
  const ignored = statuses.filter((v) => v === "ignored").length;
  const demoCritical = [
    ...sampleInbox.filter((m) => m.importance === "Critical" && !m.deadline).map((m) => m.event),
    ...workspace.state.events.filter((e) => e.critical),
  ]
    .map((e) => ({
      ...e,
      rsvps: workspace.state.activity.filter((a) => a.event_id === e.id && a.kind === "registered")
        .length,
    }))
    .filter((e) => e.rsvps < 5 && Date.parse(e.starts_at) >= Date.now());
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3 p-4">
        <Heading title="Emails students engaged with vs ignored" />
        {!id ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-mint p-3 text-mint-ink">
                <p className="text-xs font-bold">Engaged</p>
                <p className="text-xl font-extrabold">{engaged}</p>
              </div>
              <div className="rounded bg-muted p-3">
                <p className="text-xs font-bold">Ignored</p>
                <p className="text-xl font-extrabold">{ignored}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sample inbox · {sampleInbox.length - engaged - ignored} not acted on
            </p>
          </>
        ) : (
          <Empty>No live email engagement data yet.</Empty>
        )}
      </Panel>
      <Panel className="space-y-3 p-4">
        <Heading title="Critical events with low RSVPs" />
        <p className="text-xs text-muted-foreground">
          Upcoming critical events with fewer than 5 RSVPs.
        </p>
        {query.error ? (
          <Empty>
            {query.error.message.includes("No verified university assignment")
              ? "Your administrator account needs a verified university assignment."
              : "Couldn’t load critical events."}
          </Empty>
        ) : id && query.isPending ? (
          <Empty>Loading critical events…</Empty>
        ) : (id ? (query.data ?? []) : demoCritical).length ? (
          <ul className="divide-y">
            {(id ? (query.data ?? []) : demoCritical).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {e.title}{" "}
                  <span className="text-xs text-muted-foreground">· {dateText(e.starts_at)}</span>
                </span>
                <Badge shade="red">{e.rsvps} RSVPs</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No critical events with low RSVPs.</Empty>
        )}
      </Panel>
    </div>
  );
}
export function Pulse({ workspace, id }: ModuleProps) {
  const admin = Boolean(id) && workspace.state.roles.includes("admin");
  const [insight, setInsight] = useState(""),
    [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["campus-pulse", id],
    enabled: admin,
    queryFn: async () => {
      const r = await supabase.rpc("campus_insights");
      guard(r.error);
      return r.data as unknown as Metrics;
    },
  });
  if (!id)
    return (
      <div className="space-y-4">
        <div>
          <Badge shade="violet">SAMPLE ADMIN VIEW</Badge>
          <h1 className="mt-2 font-display text-2xl font-extrabold">
            <FocusText text="University engagement" accent />
          </h1>
        </div>
        <EngagementPanels workspace={workspace} />
      </div>
    );
  if (!admin)
    return (
      <Empty>UniVerse reporting is available only to authorized university administrators.</Empty>
    );
  if (query.error) return <Empty>UniVerse reporting could not be loaded.</Empty>;
  const data = query.data;
  if (!data) return <Empty>Loading campus insights…</Empty>;
  const chart = (label: string, rows: { name: string; total: number }[]) => (
    <Panel className="min-w-0 space-y-3 p-4">
      <Heading title={label} />
      {rows.length ? (
        <div className="h-[235px] w-full">
          <ResponsiveContainer>
            <BarChart data={rows.slice(0, 8)} margin={{ left: -25, right: 10, top: 8, bottom: 10 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <Tooltip />
              <Bar
                isAnimationActive={false}
                dataKey="total"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty>No data available yet.</Empty>
      )}
    </Panel>
  );
  async function generate() {
    setBusy(true);
    try {
      setInsight(
        (
          await campusAI({
            data: { mode: "pulse", text: "Identify patterns and practical improvements." },
          })
        ).text,
      );
    } catch {
      setInsight("CampusIQ insights are temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Published events", data.events],
          ["Registrations", data.registrations],
          ["Campus requests", data.complaints],
          [
            "Resolution rate",
            `${data.complaints ? Math.round((data.resolved / data.complaints) * 100) : 0}%`,
          ],
        ].map(([label, value]) => (
          <Panel className="p-4" key={label}>
            <p className="text-xs font-bold text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-extrabold">{value}</p>
          </Panel>
        ))}
      </div>
      <EngagementPanels workspace={workspace} id={id} />
      <div className="grid gap-4 lg:grid-cols-2">
        {chart("Event registrations", data.event_counts)}
        {chart("Common campus requests", data.categories)}
        {chart("Student engagement", data.engagement ?? [])}
        {chart("Student skill interests", data.interests ?? [])}
        {chart("Career interests", data.careers ?? [])}
      </div>
      <Panel className="space-y-3 p-5">
        <Heading title="CampusIQ insights" />
        <Button disabled={busy} onClick={() => void generate()}>
          <Sparkles />
          {busy ? "Generating…" : "Generate insights"}
        </Button>
        {insight && <p className="whitespace-pre-wrap text-sm leading-6">{insight}</p>}
      </Panel>
    </div>
  );
}
