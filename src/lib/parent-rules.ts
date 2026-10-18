import { normalizeName } from "./school-constants";

export const PARENT_GROUP_LINK = "https://t.me/+ht5ChUF6CcdkZGY0";

export function hasApprovedParent(
  requests: ReadonlyArray<{ id?: string; student_name: string; status: string }>,
  studentName: string,
  excludeId?: string,
) {
  return requests.some((request) =>
    request.status === "approved" &&
    (excludeId === undefined || request.id !== excludeId) &&
    normalizeName(request.student_name) === normalizeName(studentName),
  );
}