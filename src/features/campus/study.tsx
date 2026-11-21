import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileUp, Plus, Trash2 } from "lucide-react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { Badge, Empty, Field, Heading, Modal, Panel } from "./ui";
import {
  blankExam,
  countdownLevel,
  dayKey,
  dayLabel,
  daysTo,
  readinessLevel,
  sampleExams,
  upcoming,
  type Exam,
} from "./planner";
import type { ModuleProps } from "./services";
import { CountUp, FocusText, successSignal } from "./universe-motion";
import { sampleInbox } from "./discovery-data";

const readinessShade = { ready: "mint", building: "amber", low: "red" } as const;
export function Readiness({ value }: { value: number }) {
  return (
    <Badge shade={readinessShade[readinessLevel(value)]}>
      <CountUp value={value} />% ready
    </Badge>
  );
}
export function NextExam({ exam, open }: { exam: Exam; open: () => void }) {
  const days = daysTo(exam.date);
  const urgency = countdownLevel(days);
  const tone = {
    urgent: "bg-destructive/10 text-destructive",
    soon: "bg-amber-soft text-amber-ink",
    normal: "bg-secondary text-secondary-foreground",
  }[urgency];
  return (
    <Button
      variant="outline"
      className={`campus-exam-count campus-mono ${tone}`}
      data-urgency={urgency}
      onClick={open}
      aria-label={`Next exam: ${exam.subject} ${dayLabel(days)}. Open calendar`}
      title={`${exam.subject} ${dayLabel(days)}`}
    >
      <CalendarDays className="size-4 shrink-0" />
      <span className="campus-exam-name">{exam.subject}</span>
      <span className="shrink-0" aria-hidden="true">
        ·{" "}
        {String(days)
          .split("")
          .map((digit, i) => (
            <span className="universe-flip" key={`${i}-${digit}`}>
              {digit}
            </span>
          ))}
        D
      </span>
      <span className="sr-only">
        Next exam: {exam.subject} {dayLabel(days)}
      </span>
    </Button>
  );
}
function parseCSV(source: string): Exam[] {
  const rows = source
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  return rows.slice(1, 101).map((line, i) => {
    const fields = Array.from(line.matchAll(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g), ([, value = ""]) =>
      value.trim().replace(/^"|"$/g, "").replace(/""/g, '"'),
    );
    const [subject = "", date = "", time = "09:00", venue = ""] = fields;
    return { ...blankExam(`csv-${i}`), subject, date, time, venue };
  });
}
export function TimetableEditor({
  exams,
  onSave,
  demo,
  close,
}: {
  exams: Exam[];
  onSave: (exams: Exam[]) => Promise<boolean> | boolean;
  demo: boolean;
  close?: () => void;
}) {
  const [rows, setRows] = useState(exams);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);
  const patch = (id: string, fields: Partial<Exam>) =>
    setRows((prev) => prev.map((e) => (e.id === id ? { ...e, ...fields } : e)));
  const add = () => setRows((prev) => [...prev, blankExam(crypto.randomUUID())]);
  async function load(file?: File) {
    if (
      file &&
      !/\.(pdf|png|jpe?g|webp|gif|bmp|tiff?|csv)$/i.test(file.name) &&
      !file.type.startsWith("image/")
    ) {
      setStatus("Choose a PDF, image or CSV timetable.");
      return;
    }
    if (file && file.size > 10_000_000) {
      setStatus("Choose a timetable under 10 MB.");
      return;
    }
    setBusy(true);
    setReading(true);
    setStatus("");
    try {
      const [result] = await Promise.all([
        file?.name.toLowerCase().endsWith(".csv")
          ? file.text().then(parseCSV)
          : Promise.resolve(demo ? sampleExams() : []),
        new Promise((resolve) => setTimeout(resolve, 650)),
      ]);
      if (result.length) {
        setRows(result.map((e) => ({ ...e, id: crypto.randomUUID() })));
        setStatus(
          file?.name.toLowerCase().endsWith(".csv")
            ? "Check your imported rows before saving."
            : "Simulated extraction: review the sample exam details before saving.",
        );
      } else {
        if (!rows.length) add();
        setStatus(
          file?.name.toLowerCase().endsWith(".csv")
            ? "No CSV rows found. Use Subject, Date, Time, Venue as column headers."
            : "PDF and image extraction is simulated in the demo only. Enter your exam details below.",
        );
      }
    } catch {
      setStatus("Couldn’t read that timetable.");
    } finally {
      setBusy(false);
      setReading(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      rows.some(
        (r) =>
          !r.subject.trim() ||
          !r.venue.trim() ||
          !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
          !Number.isFinite(Date.parse(r.date)) ||
          !/^\d\d:\d\d$/.test(r.time),
      )
    ) {
      setStatus("Fill in the subject, date, time, and venue for each exam.");
      return;
    }
    setBusy(true);
    try {
      if (
        await onSave(rows.map((r) => ({ ...r, subject: r.subject.trim(), venue: r.venue.trim() })))
      ) {
        setStatus("Timetable saved.");
        successSignal("Timetable saved.");
        close?.();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-4 text-center text-sm font-bold">
        <FileUp className="text-primary" />
        Upload exam timetable{" "}
        <span className="text-xs font-normal text-muted-foreground">
          PDF, image or CSV · up to 10 MB
        </span>
        <input
          type="file"
          className="w-full max-w-64 text-xs"
          accept="application/pdf,image/*,.csv"
          disabled={busy}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (file) void load(file);
          }}
        />
      </label>
      {demo && (
        <Button
          variant="outline"
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void load()}
        >
          Use sample timetable
        </Button>
      )}
      {busy && (
        <p role="status" className="text-sm">
          {reading ? "Reading your timetable..." : "Saving timetable…"}
        </p>
      )}
      {status && (
        <p role="status" className="text-xs text-muted-foreground">
          {status}
        </p>
      )}
      <form onSubmit={save} className="space-y-3">
        {rows.length > 0 && (
          <div className="grid gap-2" role="table" aria-label="Confirm exams">
            <div
              role="row"
              className="hidden gap-2 px-2 text-xs font-bold text-muted-foreground sm:grid sm:grid-cols-[1.15fr_1fr_.83fr_1fr_2rem]"
            >
              {["Subject", "Date", "Time", "Venue", ""].map((v, i) => (
                <span key={i} role="columnheader">
                  {v}
                </span>
              ))}
            </div>
            {rows.map((r, i) => (
              <div
                key={r.id}
                role="row"
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-md border p-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,.83fr)_minmax(0,1fr)_2rem]"
              >
                <input
                  className="campus-input min-w-0"
                  required
                  aria-label={`Subject ${i + 1}`}
                  placeholder="Subject"
                  value={r.subject}
                  onChange={(e) => patch(r.id, { subject: e.target.value })}
                />
                <input
                  className="campus-input min-w-0"
                  required
                  aria-label={`Date ${i + 1}`}
                  type="date"
                  value={r.date}
                  onChange={(e) => patch(r.id, { date: e.target.value })}
                />
                <input
                  className="campus-input min-w-0"
                  required
                  aria-label={`Time ${i + 1}`}
                  type="time"
                  value={r.time}
                  onChange={(e) => patch(r.id, { time: e.target.value })}
                />
                <input
                  className="campus-input min-w-0"
                  required
                  aria-label={`Venue ${i + 1}`}
                  placeholder="Venue"
                  value={r.venue}
                  onChange={(e) => patch(r.id, { venue: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete exam ${i + 1}`}
                  title="Delete exam"
                  onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={add}>
            <Plus />
            Add exam
          </Button>
          <Button type="submit" disabled={busy}>
            Save timetable
          </Button>
        </div>
      </form>
    </div>
  );
}
export function ExamSlider({
  exam,
  onSave,
  label,
}: {
  exam: Exam;
  onSave: (value: number) => void;
  label: string;
}) {
  const [local, setLocal] = useState<number | null>(null);
  const value = local ?? exam.readiness;
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      <span>
        {label} <strong className="text-primary">{value}%</strong>
      </span>
      <input
        className="w-full accent-primary"
        aria-label={label}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          setLocal(n);
          onSave(n);
        }}
        onBlur={() => setLocal(null)}
      />
    </label>
  );
}
export function UpcomingExams({
  workspace,
  open,
}: {
  workspace: ModuleProps["workspace"];
  open: () => void;
}) {
  const exams = upcoming(workspace.state.plan.exams).slice(0, 3);
  const next = exams[0];
  return (
    <Panel className="space-y-3 p-4 sm:p-5">
      <Heading title="Upcoming exams" action="Open calendar" onAction={open} />
      {exams.length ? (
        <>
          <ul className="divide-y">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <strong>{e.subject}</strong>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {dayLabel(daysTo(e.date))}
                  </span>
                </span>
                <Readiness value={e.readiness} />
              </li>
            ))}
          </ul>
          {next && (
            <ExamSlider
              key={next.id}
              exam={next}
              label={`How prepared are you for ${next.subject}?`}
              onSave={(readiness) =>
                void workspace.savePlan((p) => ({
                  ...p,
                  exams: p.exams.map((e) => (e.id === next.id ? { ...e, readiness } : e)),
                }))
              }
            />
          )}
        </>
      ) : (
        <Empty>No upcoming exams. Add your timetable in Calendar.</Empty>
      )}
    </Panel>
  );
}
export function StudyCalendar({
  workspace,
  id,
  openEvent,
}: ModuleProps & { openEvent: (event: Tables<"events">) => void }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [chosenMode, setMode] = useState<"Month" | "Week" | null>(null);
  const [phone, setPhone] = useState(false);
  const mode = chosenMode ?? (phone ? "Week" : "Month");
  const [day, setDay] = useState<string | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [upload, setUpload] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const plan = workspace.state.plan;
  const exam = plan.exams.find((e) => e.id === picked);
  const first = startOfWeek(mode === "Month" ? startOfMonth(anchor) : anchor, { weekStartsOn: 1 });
  const last = endOfWeek(mode === "Month" ? endOfMonth(anchor) : anchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: first, end: last });
  const rsvps = new Set(
    workspace.state.activity
      .filter((a) => a.kind === "registered" && a.user_id === (id ?? "demo"))
      .map((a) => a.event_id),
  );
  const scheduled = [
    ...workspace.state.events,
    ...(!id ? sampleInbox.map((m) => m.event) : []),
  ].filter((e) => rsvps.has(e.id));
  const deadlines = [
    ...workspace.state.events.filter((e) => rsvps.has(e.id) || e.critical),
    ...(!id && plan.emailProvider
      ? sampleInbox.filter((m) => m.importance === "Critical").map((m) => m.event)
      : []),
  ];
  const dateOf = (v: string) => dayKey(new Date(v));
  const move = (n: number) =>
    setAnchor((a) => (mode === "Month" ? addMonths(a, n) : addDays(a, 7 * n)));
  useEffect(() => {
    if (phone && mode === "Week" && strip.current) strip.current.scrollLeft = 0;
  }, [anchor, mode, phone]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start justify-between gap-3 max-[450px]:grid-cols-1 sm:items-center">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold">
            <FocusText text="Academic calendar" accent />
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge shade="red">Exams</Badge>
            <Badge>RSVPs</Badge>
            <Badge shade="amber">Deadlines</Badge>
          </div>
        </div>
        <Button onClick={() => setUpload((v) => !v)}>
          <FileUp />
          {upload ? "Close timetable" : "Upload timetable"}
        </Button>
      </div>
      {upload && (
        <Panel className="p-4">
          <TimetableEditor
            exams={plan.exams}
            demo={!id}
            onSave={(exams) => workspace.savePlan((p) => ({ ...p, exams }))}
            close={() => setUpload(false)}
          />
        </Panel>
      )}
      <section className="space-y-3" aria-label="Calendar dates">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label={`Previous ${mode.toLowerCase()}`}
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Next ${mode.toLowerCase()}`}
              onClick={() => move(1)}
            >
              <ChevronRight />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAnchor(new Date())}>
              Today
            </Button>
            <h2 className="text-sm font-extrabold sm:text-base">
              {mode === "Month"
                ? format(anchor, "MMMM yyyy")
                : `${format(first, "MMM d")} – ${format(last, "MMM d")}`}
            </h2>
          </div>
          <div className="flex gap-1 rounded-md border bg-card p-1">
            {(["Month", "Week"] as const).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={mode === v ? "secondary" : "ghost"}
                aria-pressed={mode === v}
                onClick={() => setMode(v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>
        {phone && mode === "Week" && (
          <div className="campus-day-strip" ref={strip} aria-label="Days this week">
            {days.map((d) => {
              const key = dayKey(d);
              return (
                <Button
                  key={key}
                  variant={key === (day ?? dayKey(anchor)) ? "secondary" : "outline"}
                  aria-pressed={key === (day ?? dayKey(anchor))}
                  onClick={() => setDay(key)}
                >
                  <span>{format(d, "EEE")}</span>
                  <strong>{d.getDate()}</strong>
                  {plan.exams.some((e) => e.date === key) && (
                    <span className="campus-day-exam-dot" aria-label="Exam" />
                  )}
                </Button>
              );
            })}
          </div>
        )}
        <div
          className={`campus-calendar-grid grid grid-cols-7 overflow-hidden rounded-lg border bg-card ${mode === "Week" ? "campus-calendar-week" : ""}`}
        >
          <div className="contents">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span
                key={d}
                className="min-w-0 border-b bg-muted py-2 text-center text-[10px] font-bold sm:text-xs"
              >
                {d}
              </span>
            ))}
          </div>
          {days
            .filter(
              (d) =>
                !phone ||
                mode !== "Week" ||
                (days.some((item) => dayKey(item) === day)
                  ? dayKey(d) === day
                  : dayKey(d) === dayKey(anchor)),
            )
            .map((d) => {
              const key = dayKey(d);
              return (
                <div
                  key={key}
                  className={`min-h-24 min-w-0 border-r border-b px-0.5 py-1 sm:min-h-28 sm:px-1.5 ${mode === "Month" && d.getMonth() !== anchor.getMonth() ? "bg-muted/55" : ""}`}
                >
                  <div
                    className={`px-1 text-xs ${key === dayKey(new Date()) ? "font-extrabold text-primary" : "text-muted-foreground"}`}
                  >
                    {d.getDate()}
                  </div>
                  {plan.exams
                    .filter((e) => e.date === key)
                    .map((e) => (
                      <Button
                        key={e.id}
                        variant="ghost"
                        className="universe-exam-marker mt-1 flex h-auto w-full min-w-0 flex-col items-start gap-0.5 whitespace-normal rounded px-0.5 py-1 text-left text-[9px] leading-tight font-extrabold [overflow-wrap:anywhere] bg-destructive/10 text-destructive hover:bg-destructive/15 sm:px-1 sm:text-xs"
                        onClick={() => setPicked(e.id)}
                      >
                        <span>{e.subject}</span>
                        <span
                          className={`rounded px-0.5 text-[8px] sm:text-[10px] ${e.readiness >= 70 ? "bg-mint text-mint-ink" : e.readiness >= 40 ? "bg-amber-soft text-amber-ink" : "bg-card text-destructive"}`}
                        >
                          {e.readiness}%
                        </span>
                      </Button>
                    ))}
                  {scheduled
                    .filter((e) => dateOf(e.starts_at) === key)
                    .map((e) => (
                      <Button
                        key={e.id}
                        variant="secondary"
                        className="mt-1 h-auto w-full justify-start whitespace-normal rounded px-1 py-1 text-left text-[9px] leading-tight [overflow-wrap:anywhere] sm:text-xs"
                        onClick={() => openEvent(e)}
                      >
                        {e.title}
                      </Button>
                    ))}
                  {deadlines
                    .filter((e) => dateOf(e.deadline) === key)
                    .map((e) => (
                      <Button
                        key={e.id}
                        variant="ghost"
                        className="mt-1 h-auto w-full justify-start whitespace-normal rounded bg-amber-soft px-1 py-1 text-left text-[9px] leading-tight [overflow-wrap:anywhere] text-amber-ink sm:text-xs"
                        onClick={() => openEvent(e)}
                      >
                        {e.title}
                      </Button>
                    ))}
                </div>
              );
            })}
        </div>
      </section>
      {exam && (
        <Modal
          title={exam.subject}
          description={`${exam.date} · ${exam.time} · ${exam.venue}`}
          onClose={() => setPicked(null)}
        >
          <Readiness value={exam.readiness} />
          <ExamSlider
            key={exam.id}
            exam={exam}
            label="Preparedness"
            onSave={(readiness) =>
              void workspace.savePlan((p) => ({
                ...p,
                exams: p.exams.map((e) => (e.id === exam.id ? { ...e, readiness } : e)),
              }))
            }
          />
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const total = Number(f.get("total"));
              const covered = Math.min(total, Number(f.get("covered")));
              const hours = Number(f.get("hours"));
              void workspace
                .savePlan((p) => ({
                  ...p,
                  exams: p.exams.map((x) =>
                    x.id === exam.id ? { ...x, total, covered, hours } : x,
                  ),
                }))
                .then((ok) => {
                  if (ok) setPicked(null);
                });
            }}
          >
            <Field label="Topics covered">
              <input type="number" name="covered" min="0" defaultValue={exam.covered} required />
            </Field>
            <Field label="Total topics">
              <input type="number" name="total" min="0" defaultValue={exam.total} required />
            </Field>
            <Field label="Hours this week">
              <input
                type="number"
                name="hours"
                min="0"
                max="168"
                step="0.5"
                defaultValue={exam.hours}
                required
              />
            </Field>
            <Button type="submit" className="sm:col-span-3">
              Save preparedness
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
