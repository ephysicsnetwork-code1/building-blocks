import { describe, expect, it } from "vitest";
import { deliveryStatus, genderSchema, matchesAdminSearch } from "@/lib/admin-record-rules";

describe("admin record rules", () => {
  it("searches Telegram usernames with or without @ and ignores case", () => {
    expect(matchesAdminSearch("@EXAMPLE", "Person", "@example_user")).toBe(true);
    expect(matchesAdminSearch("different", "Person", "@example_user")).toBe(false);
  });
  it("distinguishes blocked bot deliveries from other failures", () => {
    expect(deliveryStatus(false, "Forbidden: bot was blocked by the user")).toBe("blocked");
    expect(deliveryStatus(false, "Forbidden: user is deactivated")).toBe("failed");
    expect(deliveryStatus(true)).toBe("delivered");
  });
  it("accepts explicit gender values and rejects guessed or invalid values", () => {
    expect(genderSchema.parse("female")).toBe("female");
    expect(genderSchema.safeParse("unknown").success).toBe(false);
  });
});