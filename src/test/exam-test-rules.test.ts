import { describe, expect, it } from "vitest";
import { pickTesters, parseBenefits, selectionMessage, TESTER_BENEFITS } from "@/lib/exam-test-rules";

const mk = (section: string, n: number) => Array.from({ length: n }, (_, i) => ({ section, name: `${section}${i}` }));

describe("pickTesters", () => {
  it("picks exactly 5 from each of A, B and C when more sign up", () => {
    const picked = pickTesters([...mk("A", 9), ...mk("B", 7), ...mk("C", 6)]);
    expect(picked.length).toBe(15);
    for (const s of ["A", "B", "C"]) expect(picked.filter((p) => p.section === s).length).toBe(5);
  });
  it("keeps everyone when a section has 5 or fewer", () => {
    const picked = pickTesters([...mk("A", 3), ...mk("B", 8), ...mk("C", 2)]);
    expect(picked.filter((p) => p.section === "A").length).toBe(3);
    expect(picked.filter((p) => p.section === "C").length).toBe(2);
    expect(picked.length).toBe(10);
  });
  it("ignores other sections", () => {
    expect(pickTesters(mk("D", 4)).length).toBe(0);
  });
});

describe("benefits", () => {
  it("uses admin-edited benefits in the selection message", () => {
    const b = parseBenefits("Free snacks\n\n Certificate ");
    expect(b).toEqual(["Free snacks", "Certificate"]);
    expect(selectionMessage("Abebe", b)).toContain("• Free snacks\n• Certificate");
  });
  it("falls back to defaults when nothing is saved", () => {
    expect(parseBenefits(null)).toEqual(TESTER_BENEFITS);
  });
});
