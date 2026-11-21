import { describe, expect, it } from "vitest";
import {
  blankExam,
  countdownLevel,
  emptyPlan,
  eventFit,
  markAttended,
  readinessLevel,
  reviewDraft,
  timingFactor,
} from "@/features/campus/planner";
import { openEvents, sampleInbox } from "@/features/campus/discovery-data";

describe("Campus planner rules", () => {
  const exam = {
    ...blankExam("exam"),
    subject: "Data Structures",
    date: "2027-02-05",
    readiness: 35,
  };
  it("marks 70 and above green, 40–69 amber, and below 40 red", () => {
    expect([39, 40, 69, 70].map(readinessLevel)).toEqual(["low", "building", "building", "ready"]);
  });
  it("turns the countdown amber below seven days and red below three", () => {
    expect([7, 6, 3, 2].map(countdownLevel)).toEqual(["normal", "soon", "soon", "urgent"]);
  });
  it("sharply penalizes low readiness with an exam in four days and explains the drop", () => {
    const event = openEvents[0];
    if (!event) throw new Error("Missing open event");
    const plan = { ...emptyPlan, careers: ["Data / AI"], exams: [exam] };
    const low = eventFit(event, plan, null, "2027-02-01");
    const high = eventFit(
      event,
      { ...plan, exams: [{ ...exam, readiness: 80 }] },
      null,
      "2027-02-01",
    );
    const after = eventFit(event, plan, null, "2027-02-06");
    expect(low.reason).toBe("Skip: Data Structures in 4 days and you’re 35% prepared.");
    expect(high.score - low.score).toBeGreaterThanOrEqual(20);
    expect(after.score - high.score).toBeLessThanOrEqual(5);
    expect(timingFactor(exam, "2027-02-06")).toBe(100);
  });
  it("queues attendance once and requires a nonempty explicit approval", () => {
    const event = { id: "e1", title: "Data meetup", category: "Workshop" };
    const plan = markAttended(markAttended(emptyPlan, event), event);
    expect(plan.drafts.map((d) => d.status)).toEqual(["pending"]);
    expect(reviewDraft(plan, "e1", "posted", " ").drafts[0]?.status).toBe("pending");
    expect(reviewDraft(plan, "e1", "posted", "Approved draft").drafts[0]).toMatchObject({
      status: "posted",
      text: "Approved draft",
    });
  });
  it("does not generate posts if the student turns off attendance drafts", () => {
    const plan = markAttended(
      { ...emptyPlan, automation: { ...emptyPlan.automation, events: false } },
      { id: "event", title: "Workshop", category: "Workshop" },
    );
    expect(plan.attended).toEqual(["event"]);
    expect(plan.drafts).toEqual([]);
  });
  it("provides ten sample emails and ten open events", () => {
    expect(sampleInbox).toHaveLength(10);
    expect(openEvents.filter((e) => e.visibility === "all")).toHaveLength(10);
  });
});
