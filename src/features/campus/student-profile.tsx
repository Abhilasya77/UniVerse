import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge, Empty, Field, Heading, Panel } from "./ui";
import { careers, completeness, interests, reviewDraft, type StudentPlan } from "./planner";
import { TimetableEditor } from "./study";
import { errorText, guard, type ModuleProps } from "./services";
import { toast } from "sonner";
import { FocusText, successSignal } from "./universe-motion";

type Basics = Pick<
  Tables<"profiles">,
  "name" | "university" | "degree" | "academic_year" | "skills"
>;
const stepNames = [
  "Basics",
  "Goals",
  "Skills & experience",
  "Interests",
  "Connect LinkedIn",
  "University email",
  "Exam timetable",
];
const toggleItems = [
  ["events", "Draft a post after events I attend"],
  ["certificates", "Suggest profile updates when I earn a certificate"],
  ["weekly", "Weekly achievement summary"],
] as const;
function Automation({
  plan,
  change,
}: {
  plan: StudentPlan;
  change: (plan: Partial<StudentPlan>) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/35 p-4">
      <Heading title="Automation settings" />
      {toggleItems.map(([key, title]) => (
        <label key={key} className="flex items-center justify-between gap-4 text-sm">
          <span>{title}</span>
          <Switch
            checked={plan.automation[key]}
            onCheckedChange={(v) => change({ automation: { ...plan.automation, [key]: v } })}
          />
        </label>
      ))}
    </div>
  );
}
export function EmailConnect({
  plan,
  demo,
  change,
}: {
  plan: StudentPlan;
  demo: boolean;
  change: (patch: Partial<StudentPlan>) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Read-only. We only analyze event-related emails. Disconnect anytime.
      </p>
      {!demo ? (
        <p className="text-xs font-medium text-muted-foreground">
          University email isn’t available for live accounts yet.
        </p>
      ) : plan.emailProvider ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge shade="mint">{plan.emailProvider} connected · demo</Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setChoosing(false);
              change({ emailProvider: "" });
            }}
          >
            Disconnect
          </Button>
        </div>
      ) : choosing ? (
        <div className="flex flex-wrap gap-2">
          {(["Google", "Microsoft"] as const).map((provider) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              onClick={() => {
                change({ emailProvider: provider });
                setChoosing(false);
              }}
            >
              Continue with {provider}
            </Button>
          ))}
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setChoosing(true)}>
          <Mail />
          Connect university email
        </Button>
      )}
    </div>
  );
}
function LinkedInConnect({
  plan,
  demo,
  change,
  importSkills,
}: {
  plan: StudentPlan;
  demo: boolean;
  change: (p: Partial<StudentPlan>) => void;
  importSkills: (skills: string) => void;
}) {
  const [consent, setConsent] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Import your headline, skills, and experience. Each draft needs your approval before it can
        be posted. <strong>We never post without your tap.</strong>
      </p>
      {!demo ? (
        <p className="text-xs font-medium text-muted-foreground">
          Live LinkedIn connection isn’t available yet.
        </p>
      ) : plan.linkedin ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge shade="mint">LinkedIn connected · demo</Badge>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => change({ linkedin: false })}
          >
            Disconnect
          </Button>
        </div>
      ) : consent ? (
        <div className="rounded-md border p-3 text-sm">
          <p className="mb-2">Simulated LinkedIn consent · Alex Morgan</p>
          <Button
            type="button"
            onClick={() => {
              change({
                linkedin: true,
                headline: "Computer Science Student | Data & AI",
                internships: plan.internships || "Data analytics intern · Brightline Labs",
              });
              importSkills("SQL, Data Analysis, Python");
              setConsent(false);
            }}
          >
            Allow demo import
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setConsent(true)}>
          <Linkedin />
          Connect LinkedIn
        </Button>
      )}
      {plan.linkedin && (
        <>
          <Field label="LinkedIn headline">
            <input
              maxLength={250}
              value={plan.headline}
              onChange={(e) => change({ headline: e.target.value })}
            />
          </Field>
          <Automation plan={plan} change={change} />
        </>
      )}
    </div>
  );
}
function Choices({
  label,
  options,
  values,
  change,
}: {
  label: string;
  options: string[];
  values: string[];
  change: (values: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((x) => (
          <Button
            type="button"
            key={x}
            size="sm"
            variant={values.includes(x) ? "secondary" : "outline"}
            aria-pressed={values.includes(x)}
            onClick={() =>
              change(values.includes(x) ? values.filter((v) => v !== x) : [...values, x])
            }
          >
            {values.includes(x) && <Check />}
            {x}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
function CareerFields({
  plan,
  change,
}: {
  plan: StudentPlan;
  change: (patch: Partial<StudentPlan>) => void;
}) {
  return (
    <>
      <Choices
        label="Target careers"
        options={careers}
        values={plan.careers}
        change={(careers) => change({ careers })}
      />
      <Field label="Target companies or industries">
        <input
          maxLength={400}
          value={plan.companies}
          onChange={(e) => change({ companies: e.target.value })}
        />
      </Field>
      <Field label="Placement timeline">
        <input
          maxLength={150}
          placeholder="e.g. Summer internship, June 2027"
          value={plan.timeline}
          onChange={(e) => change({ timeline: e.target.value })}
        />
      </Field>
    </>
  );
}
function ExperienceFields({
  plan,
  change,
}: {
  plan: StudentPlan;
  change: (patch: Partial<StudentPlan>) => void;
}) {
  return (
    <>
      {(["projects", "internships", "certificates"] as const).map((key, i) => (
        <Field key={key} label={["Projects", "Internships", "Certifications"][i] ?? key}>
          <textarea
            rows={2}
            maxLength={2000}
            value={plan[key]}
            onChange={(e) => change({ [key]: e.target.value })}
          />
        </Field>
      ))}
      <Field label="CGPA (optional)">
        <input
          type="number"
          min="0"
          max="10"
          step="0.01"
          value={plan.cgpa}
          onChange={(e) => change({ cgpa: e.target.value })}
        />
      </Field>
    </>
  );
}
function mergeSkills(current: string, from: string) {
  return [
    ...new Set([...current.split(","), ...from.split(",")].map((s) => s.trim()).filter(Boolean)),
  ].join(", ");
}
function SkillTags({ value, change }: { value: string; change: (value: string) => void }) {
  const [tag, setTag] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                change(
                  value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s !== t)
                    .join(", "),
                )
              }
              aria-label={`Remove ${t}`}
            >
              {t} ×
            </Button>
          ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Add a skill">
            <input
              value={tag}
              maxLength={100}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  change(mergeSkills(value, tag));
                  setTag("");
                }
              }}
            />
          </Field>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!tag.trim()}
          onClick={() => {
            change(mergeSkills(value, tag));
            setTag("");
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
export function Onboarding({ workspace, id, onDone }: ModuleProps & { onDone: () => void }) {
  const p = workspace.state.profile;
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(workspace.state.plan);
  const [basics, setBasics] = useState<Basics>({
    name: p?.name ?? "",
    university: p?.university ?? "",
    degree: p?.degree ?? "",
    academic_year: p?.academic_year ?? "",
    skills: p?.skills ?? "",
  });
  const [saving, setSaving] = useState(false),
    [status, setStatus] = useState("");
  const change = (patch: Partial<StudentPlan>) => setPlan((v) => ({ ...v, ...patch }));
  async function finish() {
    setSaving(true);
    setStatus("");
    try {
      const fields = {
        ...basics,
        ...(plan.careers.length ? { goals: plan.careers.join(", ") } : {}),
        ...(plan.eventTypes.length ? { interests: plan.eventTypes.join(", ") } : {}),
      };
      if (id) guard((await supabase.from("profiles").upsert({ id, ...fields })).error);
      else
        workspace.update((s) => ({
          ...s,
          profile: s.profile ? { ...s.profile, ...fields } : s.profile,
        }));
      if (await workspace.savePlan(() => ({ ...plan, completed: true }), false)) {
        await workspace.refresh();
        onDone();
      } else setStatus("Couldn’t save onboarding. Please try again.");
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="campus-onboarding mx-auto max-w-3xl space-y-5">
      <div className="campus-onboarding-header">
        <Badge>STUDENT SETUP</Badge>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          <FocusText text="Set up your campus profile" accent />
        </h1>
        <p className="campus-mono mt-2 text-xs text-muted-foreground">
          Step {step + 1} of {stepNames.length} · {stepNames[step]}
        </p>
        <Progress
          value={((step + 1) / stepNames.length) * 100}
          aria-label="Onboarding progress"
          className="mt-4 h-1"
        />
      </div>
      <Panel key={step} className="campus-onboarding-step space-y-4 p-4 sm:p-7">
        <h2 className="text-3xl leading-tight sm:text-4xl">
          <FocusText text={stepNames[step] ?? ""} />
        </h2>
        <ol className="sr-only">
          {stepNames.map((n, i) => (
            <li
              key={n}
              className={`rounded px-2 py-1 ${i === step ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
              aria-current={i === step ? "step" : undefined}
            >
              {i + 1}. {n}
            </li>
          ))}
        </ol>
        {step === 6 ? (
          <div className="space-y-3">
            <TimetableEditor
              exams={plan.exams}
              demo={!id}
              onSave={(exams) => {
                change({ exams });
                return true;
              }}
            />
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(5)}>
                <ArrowLeft /> Back
              </Button>
              <Button disabled={saving} onClick={() => void finish()}>
                {saving ? "Saving…" : "Finish onboarding"} <Check />
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep((s) => s + 1);
            }}
          >
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Full name"],
                    ["university", "University"],
                    ["degree", "Course"],
                    ["academic_year", "Year"],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      required
                      maxLength={250}
                      value={basics[key]}
                      onChange={(e) => setBasics({ ...basics, [key]: e.target.value })}
                    />
                  </Field>
                ))}
                <Field label="Graduation date">
                  <input
                    type="date"
                    required
                    value={plan.graduation}
                    onChange={(e) => change({ graduation: e.target.value })}
                  />
                </Field>
              </div>
            )}
            {step === 1 && <CareerFields plan={plan} change={change} />}
            {step === 2 && (
              <>
                <SkillTags
                  value={basics.skills}
                  change={(skills) => setBasics({ ...basics, skills })}
                />
                <ExperienceFields plan={plan} change={change} />
              </>
            )}
            {step === 3 && (
              <Choices
                label="Event types you like"
                options={interests}
                values={plan.eventTypes}
                change={(eventTypes) => change({ eventTypes })}
              />
            )}
            {step === 4 && (
              <LinkedInConnect
                plan={plan}
                demo={!id}
                change={change}
                importSkills={(skills) =>
                  setBasics({ ...basics, skills: mergeSkills(basics.skills, skills) })
                }
              />
            )}
            {step === 5 && <EmailConnect plan={plan} demo={!id} change={change} />}
            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!step}
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft /> Back
              </Button>
              <Button type="submit">
                Continue <ArrowRight />
              </Button>
            </div>
          </form>
        )}
        {status && (
          <p role="alert" className="text-sm text-destructive">
            {status}
          </p>
        )}
      </Panel>
    </div>
  );
}
export function ProfilePlan({ workspace, id, start }: ModuleProps & { start: () => void }) {
  const saved = workspace.state.plan;
  const [patch, setPatch] = useState<Partial<StudentPlan>>({});
  const [imported, setImported] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const plan = { ...saved, ...patch };
  const change = (next: Partial<StudentPlan>) => setPatch((p) => ({ ...p, ...next }));
  const complete = completeness(saved, workspace.state.profile);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      if (imported && !id)
        workspace.update((s) => ({
          ...s,
          profile: s.profile
            ? { ...s.profile, skills: mergeSkills(s.profile.skills, imported) }
            : s.profile,
        }));
      if (await workspace.savePlan((p) => ({ ...p, ...patch }))) {
        setPatch({});
        setImported("");
        setStatus("Student plan saved.");
        successSignal("Student plan saved.");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading title="Student plan" />
        {!id && !saved.completed && (
          <Button variant="outline" size="sm" onClick={start}>
            Try student onboarding
          </Button>
        )}
      </div>
      <p className="text-sm font-bold">Profile completeness: {complete}%</p>
      <Progress value={complete} aria-label="Profile completeness" />
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Graduation date">
            <input
              type="date"
              value={plan.graduation}
              onChange={(e) => change({ graduation: e.target.value })}
            />
          </Field>
          <CareerFields plan={plan} change={change} />
          <Choices
            label="Event interests"
            options={interests}
            values={plan.eventTypes}
            change={(eventTypes) => change({ eventTypes })}
          />
        </div>
        <div className="space-y-3">
          <ExperienceFields plan={plan} change={change} />
          <LinkedInConnect plan={plan} demo={!id} change={change} importSkills={setImported} />
          <EmailConnect plan={plan} demo={!id} change={change} />
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button type="submit" disabled={busy}>
            Save student plan
          </Button>
          {status && (
            <p role="status" className="text-sm">
              {status}
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
export function LinkedInQueue({ workspace, id }: ModuleProps) {
  const [edit, setEdit] = useState<Record<string, string>>({});
  const endEdit = (id: string) =>
    setEdit((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
  const [busy, setBusy] = useState("");
  const plan = workspace.state.plan;
  const pending = plan.drafts.filter((d) => d.status === "pending");
  const history = plan.drafts.filter((d) => d.status !== "pending");
  async function resolve(eventId: string, status: "posted" | "discarded", text: string) {
    setBusy(eventId);
    try {
      if (await workspace.savePlan((p) => reviewDraft(p, eventId, status, text))) {
        if (status === "posted")
          successSignal("Approved and posted in the demo. Nothing was sent to LinkedIn.");
        else toast.success("Draft discarded.");
      }
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold">
          <FocusText text="Review & Approve" accent />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We never post without your tap.{" "}
          {id ? "Live publishing isn’t available." : "Posting is simulated in the demo."}
        </p>
      </div>
      {!pending.length && <Empty>No posts waiting for approval.</Empty>}
      {pending.map((d) => {
        const text = edit[d.eventId] ?? d.text;
        return (
          <Panel className="space-y-3 p-4 sm:p-5" key={d.eventId}>
            <div className="flex flex-wrap items-center gap-2">
              <Heading title={d.title} />
              <Badge shade="amber">Pending approval</Badge>
            </div>
            {edit[d.eventId] !== undefined ? (
              <Field label="Draft text">
                <textarea
                  rows={5}
                  maxLength={3000}
                  value={text}
                  onChange={(e) => setEdit({ ...edit, [d.eventId]: e.target.value })}
                />
              </Field>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{d.text}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {edit[d.eventId] === undefined ? (
                <Button variant="outline" onClick={() => setEdit({ ...edit, [d.eventId]: text })}>
                  Edit
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={!text.trim() || busy === d.eventId}
                  onClick={() => {
                    setBusy(d.eventId);
                    void workspace
                      .savePlan((p) => ({
                        ...p,
                        drafts: p.drafts.map((row) =>
                          row.eventId === d.eventId && row.status === "pending"
                            ? { ...row, text: text.trim() }
                            : row,
                        ),
                      }))
                      .then((ok) => {
                        if (ok) endEdit(d.eventId);
                      })
                      .finally(() => setBusy(""));
                  }}
                >
                  Save edit
                </Button>
              )}
              {!id && (
                <Button
                  disabled={!text.trim() || busy === d.eventId}
                  onClick={() => void resolve(d.eventId, "posted", text)}
                >
                  Approve &amp; Post
                </Button>
              )}
              <Button
                variant="ghost"
                disabled={busy === d.eventId}
                onClick={() => void resolve(d.eventId, "discarded", text)}
              >
                Discard
              </Button>
            </div>
          </Panel>
        );
      })}
      {history.length > 0 && (
        <div className="space-y-2">
          <Heading title="History" />
          {history.map((d) => (
            <Panel
              className="flex flex-wrap items-center justify-between gap-2 p-3"
              key={d.eventId}
            >
              <span className="text-sm font-semibold">{d.title}</span>
              <Badge shade={d.status === "posted" ? "mint" : "sky"}>
                {d.status === "posted" ? "Posted · demo" : "Discarded"}
              </Badge>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
