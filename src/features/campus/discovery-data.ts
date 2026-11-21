import type { Tables } from "@/integrations/supabase/types";
import { eventFit, relativeDay, type StudentPlan } from "./planner";
import { clampScore } from "./data";

type Event = Tables<"events">;
export const eventExtras = {
  visibility: "all",
  host_university: "",
  city: "",
  poster: "",
  registration_url: "",
  capacity: null,
  outcomes: "",
  paid: false,
  critical: false,
} satisfies Partial<Event>;
const dateAt = (offset: number, hour = "14:00") => `${relativeDay(offset)}T${hour}:00+04:00`;
function demoEvent(
  id: string,
  title: string,
  category: string,
  host: string,
  city: string,
  days: number,
  description: string,
  outcomes: string,
  paid = false,
): Event {
  return {
    ...eventExtras,
    id,
    title,
    category,
    description,
    host_university: host,
    city,
    venue: `${city} · ${host}`,
    starts_at: dateAt(days),
    deadline: dateAt(days - 1, "18:00"),
    eligibility: "Open to all university students",
    owner: "demo-host",
    created_at: dateAt(-1),
    outcomes,
    paid,
  };
}
export const openEvents: Event[] = [
  demoEvent(
    "open-1",
    "Dubai Data & AI Meetup",
    "Guest Lecture",
    "Dubai AI Campus",
    "Dubai",
    2,
    "Meet working machine learning engineers and see practical model evaluation demos.",
    "Recruiter Q&A and networking",
  ),
  demoEvent(
    "open-2",
    "Future Tech Hackathon",
    "Hackathon",
    "University of Dubai",
    "Dubai",
    8,
    "Build a software prototype for a local nonprofit.",
    "Certificates and mentoring",
  ),
  demoEvent(
    "open-3",
    "UX Portfolio Clinic",
    "Workshop",
    "Middlesex University Dubai",
    "Dubai",
    11,
    "Bring a design case study for a live review.",
    "Portfolio feedback",
    true,
  ),
  demoEvent(
    "open-4",
    "Internship Discovery Day",
    "Career Fair",
    "Dubai Internet City",
    "Dubai",
    13,
    "Meet employers offering summer internships in software and business.",
    "Internship interviews",
  ),
  demoEvent(
    "open-5",
    "Startup Pitch Night",
    "Competition",
    "in5 Tech",
    "Dubai",
    15,
    "Pitch ideas to founders from the UAE startup community.",
    "Founder mentoring",
  ),
  demoEvent(
    "open-6",
    "Financial Modelling Sprint",
    "Workshop",
    "Heriot-Watt University Dubai",
    "Dubai",
    17,
    "Practice investment modelling and valuation.",
    "Workshop certificate",
    true,
  ),
  demoEvent(
    "open-7",
    "Cyber Capture the Flag",
    "Competition",
    "Khalifa University",
    "Abu Dhabi",
    18,
    "Solve security puzzles in a supervised student competition.",
    "Certificates and team awards",
  ),
  demoEvent(
    "open-8",
    "Research & Robotics Forum",
    "Seminar",
    "American University of Sharjah",
    "Sharjah",
    20,
    "Visit robotics labs and hear student research presentations.",
    "Lab networking",
  ),
  demoEvent(
    "open-9",
    "Clean Energy Design Jam",
    "Hackathon",
    "Masdar City",
    "Abu Dhabi",
    23,
    "Prototype clean energy concepts in interdisciplinary teams.",
    "Mentorship and awards",
  ),
  demoEvent(
    "open-10",
    "Community Tech Volunteering",
    "Volunteering",
    "University of Sharjah",
    "Sharjah",
    25,
    "Help students build digital literacy lesson plans.",
    "Volunteer hours",
  ),
];
export type Mail = {
  event: Event;
  sender: string;
  importance: "Critical" | "Important" | "Optional" | "Ignore";
  deadline?: boolean;
};
function mail(
  n: number,
  title: string,
  sender: string,
  category: string,
  importance: Mail["importance"],
  days: number,
  description: string,
  outcomes = "",
  deadline = false,
): Mail {
  const event = demoEvent(
    `inbox-${n}`,
    title,
    category,
    "Westbridge University",
    "Dubai",
    days,
    description,
    outcomes,
  );
  return {
    event: {
      ...event,
      critical: importance === "Critical",
      visibility: "university",
      eligibility: "Westbridge University students",
    },
    sender,
    importance,
    deadline,
  };
}
export const sampleInbox: Mail[] = [
  mail(
    1,
    "Data & AI placement drive",
    "Career Services",
    "Career Fair",
    "Critical",
    2,
    "Apply for graduate data science roles, with on-campus recruiter interviews.",
    "Graduate interviews",
  ),
  mail(
    2,
    "Mandatory academic integrity seminar",
    "Academic Affairs",
    "Seminar",
    "Critical",
    4,
    "Attendance is required for second-year students.",
  ),
  mail(
    3,
    "Student activities social",
    "Students’ Union",
    "Club Activity",
    "Optional",
    3,
    "An evening of board games and refreshments.",
  ),
  mail(
    4,
    "Semester fee payment deadline",
    "Student Finance",
    "Seminar",
    "Critical",
    6,
    "Pay semester fees to avoid a late registration hold.",
    "",
    true,
  ),
  mail(
    5,
    "Guest lecture: applied machine learning",
    "School of Computing",
    "Guest Lecture",
    "Important",
    5,
    "An industry researcher shares how teams evaluate machine learning systems.",
    "Meet an AI research lead",
  ),
  mail(
    6,
    "Smart Campus Hackathon",
    "Innovation Club",
    "Hackathon",
    "Important",
    9,
    "Prototype a smart campus app with industry mentors.",
    "Certificates and mentorship",
  ),
  mail(
    7,
    "CV & LinkedIn clinic",
    "Career Services",
    "Workshop",
    "Important",
    12,
    "Get one-to-one recruiter feedback on your CV.",
    "Resume review",
  ),
  mail(
    8,
    "Campus bookstore offers",
    "Bookshop",
    "Club Activity",
    "Ignore",
    7,
    "This week’s promotional merchandise offers.",
  ),
  mail(
    9,
    "Alumni newsletter",
    "Alumni Office",
    "Club Activity",
    "Ignore",
    10,
    "General alumni news and photo highlights.",
  ),
  mail(
    10,
    "Dining hall monthly bulletin",
    "Campus Dining",
    "Club Activity",
    "Ignore",
    16,
    "A roundup of rotating menu items.",
  ),
];
export function rateMail(item: Mail, plan: StudentPlan, profile: Tables<"profiles"> | null) {
  const fit = eventFit(item.event, plan, profile);
  const days = Math.ceil((Date.parse(item.event.deadline) - Date.now()) / 86400000);
  const urgency = days >= 0 && days <= 3 ? 12 : 0;
  const necessity = clampScore(
    item.importance === "Critical"
      ? 84 + urgency + (fit.goal ? 4 : 0)
      : item.importance === "Important"
        ? 45 + fit.score * 0.32 + urgency
        : item.importance === "Optional"
          ? fit.score * 0.55
          : 8,
  );
  const reason =
    item.importance === "Critical"
      ? item.deadline
        ? "Payment is required to avoid a registration hold."
        : days === 1 && fit.goal
          ? `Placement registration closes tomorrow and matches your ${fit.goal} goal.`
          : item.event.outcomes
            ? `Time-sensitive recruiting opportunity${fit.goal ? ` for your ${fit.goal} goal` : ""}.`
            : "Attendance is mandatory, even during exam season."
      : item.importance === "Ignore"
        ? "General news or promotion; no student action needed."
        : fit.reason;
  return { ...fit, necessity, urgency, reason };
}
