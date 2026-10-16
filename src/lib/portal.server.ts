import { createHmac, timingSafeEqual } from "crypto";
import { MAX_FAILED_ATTEMPTS, normalizeName } from "./school-constants";

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkAdminCredentials(username: string, password: string) {
  const u = process.env["ADMIN_USERNAME"];
  const p = process.env["ADMIN_PASSWORD"];
  if (!u || !p) throw new Error("Admin credentials are not configured");
  const okU = safeEqual(username, u);
  const okP = safeEqual(password, p);
  return okU && okP;
}

function sign(payload: string) {
  const secret = process.env["ADMIN_SESSION_SECRET"];
  if (!secret) throw new Error("Session secret missing");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueAdminToken() {
  const payload = `admin.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function assertAdmin(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Unauthorized");
  const payload = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2] ?? "", sign(payload))) throw new Error("Unauthorized");
  if (Number(parts[1]) < Date.now()) throw new Error("Session expired");
}

export async function getDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function getSettings() {
  const db = await getDb();
  const { data } = await db.from("app_settings").select("key,value");
  const map: Record<string, string> = {};
  for (const r of data ?? []) map[r.key] = r.value;
  return {
    telegram_link: map["telegram_link"] ?? "",
    support_handle: map["support_handle"] ?? "@bhsss_admin",
  };
}

export async function telegramCall(method: string, body: Record<string, unknown> = {}) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("Telegram bot is not configured");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { ok: boolean; result?: any; description?: string };
}


/** Returns true when this name is banned on the public side. */
export async function isBanned(name: string) {
  const db = await getDb();
  const { data } = await db.from("verification_attempts").select("banned").eq("subject", normalizeName(name)).maybeSingle();
  return !!data?.banned;
}

/** Records a failed attempt; bans and raises an admin alert on the 3rd consecutive failure. */
export async function recordFailure(name: string, context: string) {
  const db = await getDb();
  const subject = normalizeName(name);
  const { data } = await db.from("verification_attempts").select("failed_count,banned").eq("subject", subject).maybeSingle();
  const count = (data?.failed_count ?? 0) + 1;
  const ban = count >= MAX_FAILED_ATTEMPTS;
  await db.from("verification_attempts").upsert({
    subject,
    display_name: name.trim().slice(0, 120),
    failed_count: count,
    banned: ban || !!data?.banned,
    banned_at: ban ? new Date().toISOString() : null,
    last_attempt_at: new Date().toISOString(),
  });
  if (ban && !data?.banned) {
    await db.from("admin_alerts").insert({
      kind: "ban",
      subject,
      message: `"${name.trim().slice(0, 120)}" failed verification ${count} times in a row (${context}) and was locked.`,
    });
  }
  return { count, banned: ban, remaining: Math.max(0, MAX_FAILED_ATTEMPTS - count) };
}

export async function clearFailures(name: string) {
  const db = await getDb();
  await db.from("verification_attempts").delete().eq("subject", normalizeName(name));
}

// ---------- Editable roster: embedded list + admin additions − admin removals ----------
export type RosterStudent = { name: string; grade: string; section: string; stream?: string | null; id?: string };
export type RosterTeacher = { name: string; id?: string };

export async function loadRoster() {
  const { SCHOOL_DATABASE, allStudents } = await import("./school-data");
  const db = await getDb();
  const [{ data: added }, { data: removed }] = await Promise.all([
    db.from("roster_entries").select("*").order("created_at"),
    db.from("roster_removals").select("kind,name_norm"),
  ]);
  const gone = new Set((removed ?? []).map((r) => `${r.kind}:${r.name_norm}`));
  const students: RosterStudent[] = allStudents().filter((s) => !gone.has(`student:${normalizeName(s.name)}`));
  const teachers: RosterTeacher[] = SCHOOL_DATABASE.teachers
    .filter((t) => !gone.has(`teacher:${normalizeName(t)}`))
    .map((name) => ({ name }));
  for (const r of added ?? []) {
    if (r.kind === "student") students.push({ id: r.id, name: r.name, grade: r.grade ?? "", section: r.section ?? "", stream: r.stream });
    else teachers.push({ id: r.id, name: r.name });
  }
  return { students, teachers };
}

export async function removeFromRoster(kind: "student" | "teacher", name: string) {
  const db = await getDb();
  await db.from("roster_entries").delete().eq("kind", kind).eq("name", name);
  await db.from("roster_removals").upsert({ kind, name_norm: normalizeName(name) });
}

export async function addToRoster(kind: "student" | "teacher", e: { name: string; grade?: string; section?: string; stream?: string | null }) {
  const db = await getDb();
  await db.from("roster_removals").delete().eq("kind", kind).eq("name_norm", normalizeName(e.name));
  const { error } = await db.from("roster_entries").insert({ kind, name: e.name.trim(), grade: e.grade ?? null, section: e.section ?? null, stream: e.stream ?? null });
  if (error) throw new Error("Could not add");
}

/** Sends a direct bot message to someone who has pressed /start, matched by Telegram username. */
export async function messageByHandle(handle: string, text: string) {
  const db = await getDb();
  const { data } = await db.from("telegram_users").select("chat_id").ilike("username", handle.replace(/^@/, "")).maybeSingle();
  if (!data) return false;
  const r = await telegramCall("sendMessage", { chat_id: data.chat_id, text });
  return r.ok;
}
