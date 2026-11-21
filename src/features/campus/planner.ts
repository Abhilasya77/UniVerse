import { clampScore, eventCategories } from "./data";
import type { Tables } from "@/integrations/supabase/types";

export type Exam = {
  id: string;
  subject: string;
  date: string;
  time: string;
  venue: string;
  readiness: number;
  covered: number;
  total: number;
  hours: number;
};
export type Draft = {
  eventId: string;
  title: string;
  text: string;
  status: "pending" | "posted" | "discarded";
};
export type StudentPlan = {
  completed: boolean;
  graduation: string;
  careers: string[];
  companies: string;
  timeline: string;
  projects: string;
  internships: string;
  certificates: string;
  cgpa: string;
  eventTypes: string[];
  linkedin: boolean;
  headline: string;
  emailProvider: "" | "Google" | "Microsoft";
  automation: { events: boolean; certificates: boolean; weekly: boolean };
  exams: Exam[];
  drafts: Draft[];
  attended: string[];
  inbox: Record<string, "engaged" | "ignored">;
};
export const emptyPlan: StudentPlan = {
  completed: false,
  graduation: "",
  careers: [],
  companies: "",
  timeline: "",
  projects: "",
  internships: "",
  certificates: "",
  cgpa: "",
  eventTypes: [],
  linkedin: false,
  headline: "",
  emailProvider: "",
  automation: { events: true, certificates: false, weekly: false },
  exams: [],
  drafts: [],
  attended: [],
  inbox: {},
};
export const careers = [
  "Data / AI",
  "Software Engineering",
  "Design",
  "Business",
  "Finance",
  "Cybersecurity",
  "Research",
  "Entrepreneurship",
];
export const interests = [...eventCategories, "Recruiter talks"];
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function relativeDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dayKey(d);
}
export function blankExam(id: string): Exam {
  return {
    id,
    subject: "",
    date: relativeDay(0),
    time: "09:00",
    venue: "",
    readiness: 0,
    covered: 0,
    total: 0,
    hours: 0,
  };
}
export function sampleExams(): Exam[] {
  return [
    ["Data Structures", 4, "09:00", "Exam Hall B", 35, 4, 12, 3],
    ["Database Systems", 9, "13:00", "Block C · Room 104", 60, 6, 10, 5],
    ["Applied Statistics", 15, "10:30", "Main Auditorium", 75, 9, 12, 7],
  ].map(([subject, day, time, venue, readiness, covered, total, hours], i) => ({
    id: `sample-exam-${i}`,
    subject: String(subject),
    date: relativeDay(Number(day)),
    time: String(time),
    venue: String(venue),
    readiness: Number(readiness),
    covered: Number(covered),
    total: Number(total),
    hours: Number(hours),
  }));
}
export function daysTo(date: string, today = dayKey(new Date())) {
  return Math.round((Date.parse(date) - Date.parse(today)) / 86400000);
}
export function upcoming(exams: Exam[], today = dayKey(new Date())) {
  return exams
    .filter((e) => daysTo(e.date, today) >= 0)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}
export const readinessLevel = (n: number) => (n >= 70 ? "ready" : n >= 40 ? "building" : "low");
export const countdownLevel = (days: number) =>
  days < 3 ? "urgent" : days < 7 ? "soon" : "normal";
export const dayLabel = (n: number) => (n === 0 ? "today" : `in ${n} ${n === 1 ? "day" : "days"}`);
export function timingFactor(exam: Exam | undefined, today?: string) {
  if (!exam) return 100;
  const days = daysTo(exam.date, today);
  if (days < 0 || days > 14) return 100;
  const pressure = days <= 7 ? ((8 - days) / 8) * 0.32 + 0.68 : (15 - days) / 32;
  return clampScore(100 - pressure * (exam.readiness < 40 ? 98 : exam.readiness < 70 ? 55 : 14));
}
const careerKeywords: Record<string, string> = {
  "Data / AI": "data|ai|machine learning|analytics|statistics",
  "Software Engineering": "software|coding|developer|engineering|hackathon|web",
  Design: "design|ux|prototype",
  Business: "business|consulting|strategy|recruit",
  Finance: "finance|banking|investment|fintech",
  Cybersecurity: "cyber|security|ctf",
  Research: "research|science|lab",
  Entrepreneurship: "startup|founder|pitch|venture",
};
export function eventFit(
  event: Tables<"events">,
  plan: StudentPlan,
  profile: Tables<"profiles"> | null,
  today?: string,
) {
  const text =
    `${event.title} ${event.category} ${event.description} ${event.outcomes}`.toLowerCase();
  const goal = plan.careers.find(
    (c) => careerKeywords[c] && new RegExp(`\\b(?:${careerKeywords[c]})\\b`, "i").test(text),
  );
  const terms = (value: string) =>
    value
      .toLowerCase()
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
  const match = (value: string) => terms(value).some((term) => text.includes(term));
  const exam = upcoming(plan.exams, today)[0];
  const timing = timingFactor(exam, today);
  const factors = [
    ["Career alignment", goal || match(profile?.goals ?? "") || match(plan.companies) ? 100 : 58],
    ["Skills match", match(profile?.skills ?? "") ? 95 : 65],
    [
      "Interest match",
      plan.eventTypes.includes(event.category) || match(profile?.interests ?? "") ? 100 : 68,
    ],
    [
      "Career value",
      event.outcomes
        ? 96
        : ["Career Fair", "Internship", "Hackathon", "Workshop"].includes(event.category)
          ? 85
          : 60,
    ],
    ["Exam timing", timing],
  ] as const;
  const weights = [0.24, 0.13, 0.13, 0.14, 0.36];
  const score = clampScore(factors.reduce((sum, [, n], i) => sum + n * (weights[i] ?? 0), 0));
  const reason =
    exam && timing < 65
      ? `${timing < 35 ? "Skip" : "Consider later"}: ${exam.subject} ${dayLabel(daysTo(exam.date, today))} and you’re ${exam.readiness}% prepared.`
      : exam && timing < 100
        ? `${exam.subject} ${dayLabel(daysTo(exam.date, today))}; you’re ${exam.readiness}% prepared.`
        : goal
          ? `Matches your ${goal} goal.`
          : "No upcoming exam timing penalty.";
  return { score, factors, reason, goal, timing };
}
export function markAttended(
  plan: StudentPlan,
  event: Pick<Tables<"events">, "id" | "title" | "category">,
): StudentPlan {
  if (plan.attended.includes(event.id)) return plan;
  return {
    ...plan,
    attended: [...plan.attended, event.id],
    drafts: plan.automation.events
      ? [
          ...plan.drafts,
          {
            eventId: event.id,
            title: event.title,
            text: `I attended ${event.title}! I’m looking forward to applying what I learned and sharing it with my campus community.\n\n#UniVerse #StudentLife`,
            status: "pending",
          },
        ]
      : plan.drafts,
  };
}
export function reviewDraft(
  plan: StudentPlan,
  id: string,
  status: "posted" | "discarded",
  text?: string,
): StudentPlan {
  if (status === "posted" && !text?.trim()) return plan;
  return {
    ...plan,
    drafts: plan.drafts.map((d) =>
      d.eventId === id && d.status === "pending"
        ? { ...d, status, text: text?.trim() || d.text }
        : d,
    ),
  };
}
export function completeness(plan: StudentPlan, p: Tables<"profiles"> | null) {
  const fields = [
    p?.name,
    p?.university,
    p?.degree,
    p?.academic_year,
    plan.graduation,
    plan.careers.length,
    plan.companies,
    plan.timeline,
    p?.skills,
    plan.projects || plan.internships || plan.certificates,
    plan.eventTypes.length,
  ];
  return clampScore((100 * fields.filter(Boolean).length) / fields.length);
}
