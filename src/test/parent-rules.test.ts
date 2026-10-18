import { describe, expect, it } from "vitest";
import { hasApprovedParent, PARENT_GROUP_LINK } from "@/lib/parent-rules";

describe("parent access rules", () => {
  it("blocks an approved child's name regardless of case or spacing", () => {
    expect(hasApprovedParent([{ id: "first", student_name: "Abebe Kebede", status: "approved" }], "  ABEBE   kebede ")).toBe(true);
  });

  it("allows a child with only pending or rejected requests", () => {
    expect(hasApprovedParent([
      { student_name: "Abebe Kebede", status: "pending" },
      { student_name: "Abebe Kebede", status: "rejected" },
    ], "Abebe Kebede")).toBe(false);
  });

  it("does not block another child's name", () => {
    expect(hasApprovedParent([{ student_name: "Abebe Kebede", status: "approved" }], "Other Child")).toBe(false);
  });

  it("excludes the request being approved again without excluding other approvals", () => {
    const rows = [{ id: "first", student_name: "Abebe Kebede", status: "approved" }];
    expect(hasApprovedParent(rows, "Abebe Kebede", "first")).toBe(false);
    expect(hasApprovedParent(rows, "Abebe Kebede", "second")).toBe(true);
  });

  it("uses exactly the parents-only invite supplied by the user", () => {
    expect(PARENT_GROUP_LINK).toBe("https://t.me/+ht5ChUF6CcdkZGY0");
  });
});