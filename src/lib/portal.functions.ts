import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  findStudent,
  findTeacher,
  findStudentAnywhere,
  sectionsByGrade,
  allStudents,
  HANDLE_RE,
  normalizeHandle,
  SCHOOL_DATABASE,
} from "./school-data";
import {
  assertAdmin,
  checkAdminCredentials,
  getDb,
  getSettings,
  issueAdminToken,
  telegramCall,
  isBanned,
  recordFailure,
  clearFailures,
} from "./portal.server";

const handle = z.string().trim().regex(HANDLE_RE, "Invalid Telegram handle").transform(normalizeHandle);
const tokenSchema = z.object({ token: z.string().min(10).max(500) });

async function notify(text: string) {
  try {
    const db = await getDb();
    const { data } = await db.from("app_settings").select("value").eq("key", "notify_chat_id").maybeSingle();
    if (data?.value) await telegramCall("sendMessage", { chat_id: data.value, text });
  } catch (e) {
    console.error("notify failed", e);
  }
}

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const s = await getSettings();
  return { support_handle: s.support_handle, sections: sectionsByGrade() };
});

export const verifyStudent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        grade: z.enum(["9", "10", "11", "12"]),
        stream: z.enum(["Natural", "Social"]).nullable(),
        section: z.string().max(2),
        name: z.string().trim().min(2).max(120),
        handle,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (await isBanned(data.name)) return { ok: false as const, reason: "banned" as const };
    const name = findStudent(data.grade, data.section, data.name);
    if (!name) {
      const f = await recordFailure(data.name, `student G${data.grade}${data.section}`);
      if (f.banned) {
        void notify(`🚫 Locked after ${f.count} failed attempts: "${data.name}" (G${data.grade}${data.section})`);
        return { ok: false as const, reason: "banned" as const };
      }
      return { ok: false as const, reason: "not_found" as const, remaining: f.remaining };
    }
    if (await isBanned(name)) return { ok: false as const, reason: "banned" as const };
    const db = await getDb();
    const { error } = await db.from("student_joins").insert({
      full_name: name,
      grade: data.grade,
      section: data.section,
      stream: data.stream,
      telegram_handle: data.handle,
    });
    if (error) {
      if (error.code === "23505") return { ok: false as const, reason: "already_joined" as const };
      console.error(error);
      throw new Error("Verification failed");
    }
    await clearFailures(data.name);
    const s = await getSettings();
    void notify(`✅ Student joined: ${name} (G${data.grade}${data.section}) ${data.handle}`);
    return { ok: true as const, link: s.telegram_link, name, handle: data.handle };
  });

export const verifyTeacher = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().min(2).max(120), handle }).parse(d))
  .handler(async ({ data }) => {
    const name = findTeacher(data.name);
    if (!name) return { ok: false as const, reason: "not_found" as const };
    const db = await getDb();
    await db.from("teacher_access").insert({ full_name: name, telegram_handle: data.handle });
    const s = await getSettings();
    void notify(`👨‍🏫 Teacher verified: ${name} ${data.handle}`);
    return { ok: true as const, link: s.telegram_link, name, handle: data.handle };
  });

export const getParentStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ handle }).parse(d))
  .handler(async ({ data }) => {
    const db = await getDb();
    const { data: rows } = await db
      .from("parent_requests")
      .select("status")
      .ilike("telegram_handle", data.handle)
      .order("created_at", { ascending: false });
    const statuses = (rows ?? []).map((r) => r.status);
    const status = statuses.includes("approved") ? "approved" : statuses.includes("pending") ? "pending" : statuses[0] ?? "none";
    if (status === "approved") {
      const s = await getSettings();
      return { status, link: s.telegram_link };
    }
    return { status, link: null };
  });

export const submitParentRequest = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        parentName: z.string().trim().min(3).max(120),
        handle,
        studentName: z.string().trim().min(2).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { data: existing } = await db
      .from("parent_requests")
      .select("status")
      .ilike("telegram_handle", data.handle);
    if ((existing ?? []).some((r) => r.status === "approved")) {
      const s = await getSettings();
      return { ok: true as const, status: "approved" as const, link: s.telegram_link };
    }
    if ((existing ?? []).some((r) => r.status === "pending"))
      return { ok: true as const, status: "pending" as const, link: null };
    const student = findStudentAnywhere(data.studentName);
    if (!student) return { ok: false as const, reason: "student_not_found" as const };
    const { error } = await db.from("parent_requests").insert({
      parent_name: data.parentName,
      telegram_handle: data.handle,
      student_name: student.name,
    });
    if (error) throw new Error("Could not submit request");
    void notify(`👪 New parent request: ${data.parentName} ${data.handle} for ${student.name}`);
    return { ok: true as const, status: "pending" as const, link: null };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ username: z.string().max(100), password: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    await new Promise((r) => setTimeout(r, 400));
    if (!checkAdminCredentials(data.username, data.password)) return { ok: false as const };
    return { ok: true as const, token: issueAdminToken() };
  });

export const adminGetData = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const [joins, teachers, parents, settingsRows, attempts, alerts] = await Promise.all([
      db.from("student_joins").select("*").order("joined_at", { ascending: false }),
      db.from("teacher_access").select("*").order("accessed_at", { ascending: false }).limit(200),
      db.from("parent_requests").select("*").order("created_at", { ascending: false }),
      db.from("app_settings").select("key,value"),
      db.from("verification_attempts").select("*").order("last_attempt_at", { ascending: false }),
      db.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const settings: Record<string, string> = {};
    for (const r of settingsRows.data ?? []) settings[r.key] = r.value;
    return {
      joins: joins.data ?? [],
      teacherAccess: teachers.data ?? [],
      parents: parents.data ?? [],
      settings: {
        telegram_link: settings["telegram_link"] ?? "",
        support_handle: settings["support_handle"] ?? "",
        notify_chat_id: settings["notify_chat_id"] ?? "",
      },
      attempts: attempts.data ?? [],
      alerts: alerts.data ?? [],
      teachers: SCHOOL_DATABASE.teachers,
      students: allStudents(),
    };
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    tokenSchema
      .extend({
        telegram_link: z.string().trim().url().max(300).refine((u) => u.startsWith("https://t.me/"), "Must be a t.me link"),
        support_handle: handle,
        notify_chat_id: z.string().trim().max(40).regex(/^(-?\d+)?$/, "Chat ID must be numeric"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const rows = [
      { key: "telegram_link", value: data.telegram_link },
      { key: "support_handle", value: data.support_handle },
      { key: "notify_chat_id", value: data.notify_chat_id },
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await db.from("app_settings").upsert(rows);
    if (error) throw new Error("Save failed");
    return { ok: true };
  });

export const adminDecideParent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    tokenSchema.extend({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db
      .from("parent_requests")
      .update({ status: data.status, decided_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error("Update failed");
    return { ok: true };
  });

export const adminResetStudent = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ name: z.string().min(2).max(120) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db.from("student_joins").delete().eq("full_name", data.name);
    if (error) throw new Error("Reset failed");
    return { ok: true };
  });

export const adminTestBot = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const r = await telegramCall("getMe");
    if (!r.ok) return { ok: false, message: r.description ?? "Bot check failed" };
    return { ok: true, message: `Connected as @${r.result.username}` };
  });

export const adminUnban = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ subject: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db.from("verification_attempts").delete().eq("subject", data.subject);
    if (error) throw new Error("Unban failed");
    await db.from("admin_alerts").update({ resolved: true }).eq("subject", data.subject);
    return { ok: true };
  });

export const adminResolveAlert = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db.from("admin_alerts").update({ resolved: true }).eq("id", data.id);
    if (error) throw new Error("Update failed");
    return { ok: true };
  });

export const searchStudents = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { normalizeName } = await import("./school-constants");
    const q = normalizeName(data.q);
    return allStudents()
      .filter((s) => {
        const n = normalizeName(s.name);
        return n.startsWith(q) || n.split(" ").some((w) => w.startsWith(q));
      })
      .slice(0, 5);
  });
