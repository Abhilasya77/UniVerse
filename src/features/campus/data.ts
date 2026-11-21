import type { Tables } from "@/integrations/supabase/types";

export const sections = [
  "overview",
  "events",
  "calendar",
  "linkedin",
  "intelligence",
  "profile",
  "care",
  "lost-found",
  "pulse",
  "messages",
  "notifications",
  "settings",
] as const;
export type Section = (typeof sections)[number];
export const titles: Record<Section, string> = {
  overview: "Overview",
  events: "Campus Connect",
  calendar: "Calendar",
  linkedin: "LinkedIn Queue",
  intelligence: "AI Intelligence",
  profile: "Student Hub",
  care: "Campus Care",
  "lost-found": "Lost & Found",
  pulse: "UniVerse",
  messages: "Messages",
  notifications: "Notifications",
  settings: "Settings",
};
export const eventCategories = [
  "Hackathon",
  "Workshop",
  "Guest Lecture",
  "Seminar",
  "Competition",
  "Internship",
  "Career Fair",
  "Club Activity",
  "Volunteering",
];
export const departments: Record<string, string> = {
  "Mess food quality": "Dining",
  "Food hygiene": "Dining",
  "Hostel maintenance": "Facilities",
  "Wi-Fi issues": "IT Services",
  "Classroom problems": "Facilities",
  "Transport issues": "Transport",
  "Cleaning problems": "Facilities",
  "Other campus services": "Student Services",
};
export const ticketStages = ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved"];
export const notifyKinds = {
  event: "New events",
  announcement: "Important announcements",
  deadline: "Registration deadlines",
  complaint: "Complaint updates",
  match: "Lost-and-found matches",
  opportunity: "Recommended opportunities",
  message: "New messages",
  career: "Career suggestions",
};
export const roleLabels: Record<string, string> = {
  student: "Student",
  educator: "Educator",
  admin: "University Administrator",
  organizer: "Club / Event Organizer",
  provider: "Campus Service Provider",
};
export const profileFields = {
  name: "Full name",
  university: "University",
  degree: "Degree",
  specialization: "Specialization",
  academic_year: "Academic year",
  skills: "Skills",
  interests: "Interests",
  goals: "Career goals",
  bio: "About",
  portfolio: "Projects, certifications, volunteering and achievements",
} as const;
export type ProfileKey = keyof typeof profileFields;
const fromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(14, 0, 0, 0);
  return d.toISOString();
};
export const demoProfile: Tables<"profiles"> = {
  id: "demo",
  name: "Alex Morgan",
  university: "Westbridge University",
  degree: "B.Sc. Computer Science",
  specialization: "Artificial Intelligence",
  academic_year: "Year 2",
  skills: "Python, UI Design, Public Speaking",
  interests: "AI, Design, Technology",
  goals: "Machine learning engineer",
  bio: "Curious builder and second-year computer science student.",
  portfolio: "Campus accessibility map • Python fundamentals certification",
  avatar: "",
  preferences: {},
};
export const demoEvents: Tables<"events">[] = [
  [
    "demo-ai",
    "AI & Innovation Hackathon",
    "Hackathon",
    "Innovation Lab",
    "Build a real-world AI solution with a team, get hands-on mentorship and pitch to industry judges.",
    9,
  ],
  [
    "demo-design",
    "Design Thinking Workshop",
    "Workshop",
    "Design Studio, Block B",
    "Learn to prototype, test, and pitch an idea using practical design methods.",
    12,
  ],
  [
    "demo-career",
    "Future Forward Career Fair",
    "Career Fair",
    "University Convention Hall",
    "Meet recruiters and alumni, explore internships, and get feedback on your CV.",
    16,
  ],
  [
    "demo-club",
    "Campus Green Week",
    "Volunteering",
    "Main Quad",
    "Join the sustainability club for a campus cleanup and student-led activities.",
    22,
  ],
].map(([id, title, category, venue, description, days]) => ({
  id: String(id),
  title: String(title),
  category: String(category),
  venue: String(venue),
  description: String(description),
  starts_at: fromNow(Number(days)),
  deadline: fromNow(Number(days) - 2),
  eligibility: "Open to all university students",
  visibility: "university",
  host_university: "Westbridge University",
  city: "Dubai",
  poster: "",
  registration_url: "",
  capacity: null,
  outcomes: "",
  paid: false,
  critical: false,
  owner: "demo-host",
  created_at: fromNow(-2),
}));
export const demoAnnouncements: Tables<"announcements">[] = [
  {
    id: "a1",
    owner: "demo-host",
    title: "Semester exam timetable released",
    body: "The end-semester exam timetable is now available. Check your department schedule before the registration deadline.",
    urgent: true,
    created_at: fromNow(0),
  },
  {
    id: "a2",
    owner: "demo-host",
    title: "Library hours extended",
    body: "The central library will stay open until 11 PM on weekdays during exam season.",
    urgent: false,
    created_at: fromNow(-1),
  },
  {
    id: "a3",
    owner: "demo-host",
    title: "Scholarship applications open",
    body: "Apply for the Student Excellence Scholarship through the Student Services office.",
    urgent: false,
    created_at: fromNow(-2),
  },
];
export const demoComplaints: Tables<"complaints">[] = [
  {
    id: "CC-1042",
    owner: "demo",
    category: "Wi-Fi issues",
    description: "Intermittent Wi-Fi in the second-floor study lounge.",
    location: "Cedar Hall",
    department: "IT Services",
    priority: "Normal",
    anonymous: false,
    photo: "",
    status: "In Progress",
    resolution: "IT Services is checking the access point.",
    created_at: fromNow(-2),
  },
];
export const demoItems: Tables<"items">[] = [
  {
    id: "item1",
    owner: "sample-user",
    title: "Black wireless earbuds",
    description: "Black earbuds in a matte charging case.",
    location: "Central Library",
    kind: "Found",
    item_date: fromNow(-1).slice(0, 10),
    photo: "",
    status: "Open",
    created_at: fromNow(-1),
  },
  {
    id: "item2",
    owner: "demo",
    title: "Blue insulated water bottle",
    description: "Blue bottle with a mountain sticker.",
    location: "Sports Complex",
    kind: "Lost",
    item_date: fromNow(-2).slice(0, 10),
    photo: "",
    status: "Open",
    created_at: fromNow(-2),
  },
];
export const demoNotices: Tables<"notifications">[] = [
  {
    id: "n1",
    user_id: "demo",
    kind: "event",
    title: "New opportunity for you",
    body: "AI & Innovation Hackathon is open for registration.",
    read: false,
    created_at: fromNow(0),
  },
  {
    id: "n2",
    user_id: "demo",
    kind: "complaint",
    title: "Campus Care update",
    body: "Your Wi-Fi report is now in progress.",
    read: false,
    created_at: fromNow(-1),
  },
  {
    id: "n3",
    user_id: "demo",
    kind: "announcement",
    title: "Exam timetable is live",
    body: "Check the new announcement from Academic Affairs.",
    read: false,
    created_at: fromNow(-1),
  },
];
export const scoreLabels = (score: number) =>
  score >= 75 ? "Highly Recommended" : score >= 45 ? "Worth Considering" : "Low Relevance";
export const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
export const dateText = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(date));
export function downloadFile(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function calendarEvent(
  event: Pick<Tables<"events">, "id" | "title" | "starts_at" | "venue">,
) {
  const stamp = (v: string) =>
    new Date(v)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const escape = (v: string) =>
    v
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/([;,])/g, "\\$1");
  downloadFile(
    "campus-event.ics",
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UniVerse//Campus Connect//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@campus360`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(event.starts_at)}`,
      `SUMMARY:${escape(event.title)}`,
      `LOCATION:${escape(event.venue)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"),
    "text/calendar",
  );
}
export function canPublish(roles: string[]) {
  return roles.some((r) => ["admin", "educator", "organizer"].includes(r));
}
export function canSeePulse(roles: string[]) {
  return roles.includes("admin");
}
