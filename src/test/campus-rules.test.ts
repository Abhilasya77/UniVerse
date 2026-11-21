import { describe, expect, it } from "vitest";
import {
  canPublish,
  canSeePulse,
  clampScore,
  scoreLabels,
  ticketStages,
} from "@/features/campus/data";
describe("campus rules", () => {
  it("shows Campus Pulse only to administrators", () => {
    expect(canSeePulse(["admin"])).toBe(true);
    for (const role of ["student", "educator", "organizer", "provider"])
      expect(canSeePulse([role])).toBe(false);
  });
  it("allows authorized organizers to publish without granting student publishing", () => {
    expect(canPublish(["organizer"])).toBe(true);
    expect(canPublish(["student"])).toBe(false);
  });
  it("keeps opportunity scores out of 100", () => {
    expect(clampScore(106)).toBe(100);
    expect(clampScore(-6)).toBe(0);
  });
  it("classifies opportunity scores into three levels", () => {
    expect([scoreLabels(88), scoreLabels(61), scoreLabels(22)]).toEqual([
      "Highly Recommended",
      "Worth Considering",
      "Low Relevance",
    ]);
  });
  it("keeps the campus request workflow ordered", () => {
    expect(ticketStages).toEqual([
      "Submitted",
      "Under Review",
      "Assigned",
      "In Progress",
      "Resolved",
    ]);
  });
});
