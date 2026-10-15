import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  findStudent,
  findTeacher,
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
  return { support_handle: s.support_handle };
});

export const verifyStudent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        grade: z.enum(["9", "10", "11", "12"]),
        stream: z.enum(["Natural", "Social"]).nullable(),
        section: z.string().max(2),
        name: z.string().min(2).max(120),
        handle,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const name = findStudent(data.grade, data.section, data.name);
    if (!name) return { ok: false as const, reason: "not_found" as const };
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
    const s = await getSettings();
    void notify(`✅ Student verified: ${name} (G${data.grade}${data.section}) ${data.handle}`);
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

export const submitParentRequest = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        parentName: z.string().trim().min(3).max(120),
        handle,
        studentName: z.string().min(2).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!allStudents().some((s) => s.name === data.studentName))
      return { ok: false as const, reason: "student_not_found" as const };
    const db = await getDb();
    const { error } = await db.from("parent_requests").insert({
      parent_name: data.parentName,
      telegram_handle: data.handle,
      student_name: data.studentName,
    });
    if (error) throw new Error("Could not submit request");
    void notify(`👪 New parent request: ${data.parentName} ${data.handle} for ${data.studentName}`);
    return { ok: true as const };
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
    const [joins, teachers, parents, settingsRows] = await Promise.all([
      db.from("student_joins").select("*").order("joined_at", { ascending: false }),
      db.from("teacher_access").select("*").order("accessed_at", { ascending: false }).limit(200),
      db.from("parent_requests").select("*").order("created_at", { ascending: false }),
      db.from("app_settings").select("key,value"),
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
