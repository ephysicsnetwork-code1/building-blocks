import { describe, it, expect } from "vitest";
import { MAX_FAILED_ATTEMPTS, normalizeName } from "@/lib/school-constants";

describe("verification rules", () => {
  it("locks a name after 3 consecutive failures", () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(3);
  });
  it("matches typed names regardless of case and extra spaces", () => {
    expect(normalizeName("  abebe   KEBEDE ")).toBe(normalizeName("Abebe Kebede"));
  });
});
