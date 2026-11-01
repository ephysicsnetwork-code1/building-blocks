import { z } from "zod";

export const genderSchema = z.enum(["female", "male", "other", "prefer_not_to_say"]);
export type Gender = z.infer<typeof genderSchema>;
export const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function matchesAdminSearch(query: string, ...values: (string | null | undefined)[]) {
  const q = query.trim().replace(/^@/, "").toLowerCase();
  return values.some((v) => (v ?? "").toLowerCase().includes(q));
}

export function deliveryStatus(ok: boolean, description = "") {
  if (ok) return "delivered" as const;
  return /blocked by the user/i.test(description) ? "blocked" as const : "failed" as const;
}

export function genderLabel(value: string | null) {
  return GENDERS.find((g) => g.value === value)?.label ?? "Not provided";
}