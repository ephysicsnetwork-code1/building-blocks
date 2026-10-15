// Client-safe constants. Never import the roster (school-data.ts) from browser components.
export const GRADES = ["9", "10", "11", "12"] as const;
export const STREAM_GRADES = ["11", "12"];

export function normalizeName(s: string) {
  return s.toLowerCase().replace(/['’`]/g, "").replace(/\s+/g, " ").trim();
}

export const HANDLE_RE = /^@?[A-Za-z0-9_]{5,32}$/;
export function normalizeHandle(h: string) {
  const t = h.trim();
  return t.startsWith("@") ? t : `@${t}`;
}

export const MAX_FAILED_ATTEMPTS = 3;
