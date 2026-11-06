import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { HANDLE_RE, normalizeHandle, normalizeName, MAX_FAILED_ATTEMPTS } from "./school-constants";
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
  loadRoster,
  addToRoster,
  removeFromRoster,
  messageByHandle,
} from "./portal.server";
import { getRequestHeader } from "@tanstack/react-start/server";
import { hasApprovedParent, PARENT_GROUP_LINK } from "./parent-rules";
import { genderSchema } from "./admin-record-rules";

async function rosterSections() {
  const { students } = await loadRoster();
  const out: Record<string, string[]> = {};
  for (const s of students) {
    out[s.grade] ??= [];
    const sections = out[s.grade];
    if (sections && !sections.includes(s.section)) sections.push(s.section);
  }
  for (const g of Object.keys(out)) out[g]?.sort();
  return out;
}

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
  const db = await getDb();
  const { data: vis } = await db.from("app_settings").select("value").eq("key", "exam_test_visible").maybeSingle();
  return { support_handle: s.support_handle, sections: await rosterSections(), exam_test_visible: vis?.value !== "0" };
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
        gender: genderSchema.nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (await isBanned(data.name)) return { ok: false as const, reason: "banned" as const };
    const roster = await loadRoster();
    const n0 = normalizeName(data.name);
    const name = roster.students.find((x) => x.grade === data.grade && x.section === data.section && normalizeName(x.name) === n0)?.name ?? null;
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
      gender: data.gender ?? null,
    });
    if (error) {
      if (error.code === "23505") return { ok: false as const, reason: "already_joined" as const };
      console.error(error);
      throw new Error("Verification failed");
    }
    await clearFailures(data.name);
    const s = await getSettings();
    await messageByHandle(data.handle, "You have successfully joined the Burka Harbu student network!").catch(() => false);
    void notify(`✅ Student joined: ${name} (G${data.grade}${data.section}) ${data.handle}`);
    return { ok: true as const, link: s.telegram_link, name, handle: data.handle };
  });

export const verifyTeacher = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().min(2).max(120), handle, gender: genderSchema.nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { teachers } = await loadRoster();
    const tn = normalizeName(data.name);
    const name = teachers.find((t) => normalizeName(t.name) === tn)?.name ?? null;
    if (!name) return { ok: false as const, reason: "not_found" as const };
    const db = await getDb();
    const { error } = await db.from("teacher_access").insert({ full_name: name, telegram_handle: data.handle, gender: data.gender ?? null });
    if (error) throw new Error("Could not save teacher registration");
    const s = await getSettings();
    void notify(`👨‍🏫 Teacher verified: ${name} ${data.handle}`);
    return { ok: true as const, link: s.telegram_link, name, handle: data.handle };
  });

export const getParentStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ handle }).parse(d))
  .handler(async ({ data }) => {
    try {
      const db = await getDb();
      const { data: rows } = await db
        .from("parent_requests")
        .select("status")
        .ilike("telegram_handle", data.handle)
        .order("created_at", { ascending: false });
      const statuses = (rows ?? []).map((r) => r.status);
      const status = statuses.includes("approved") ? "approved" : statuses.includes("pending") ? "pending" : statuses[0] ?? "none";
      if (status === "approved") {
        return { status, link: PARENT_GROUP_LINK };
      }
      return { status, link: null };
    } catch (e) {
      // Never break the parent page on a status check — fall back to the form.
      console.error("getParentStatus failed", e);
      return { status: "none", link: null };
    }
  });

export const submitParentRequest = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        parentName: z.string().trim().min(3).max(120),
        handle,
        gender: genderSchema.nullable().optional(),
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
      return { ok: true as const, status: "approved" as const, link: PARENT_GROUP_LINK };
    }
    if ((existing ?? []).some((r) => r.status === "pending"))
      return { ok: true as const, status: "pending" as const, link: null };
    const { data: asStudent } = await db.from("student_joins").select("full_name").ilike("telegram_handle", data.handle).limit(1);
    if ((asStudent ?? []).length > 0) return { ok: false as const, reason: "handle_is_student" as const };
    const sn = normalizeName(data.studentName);
    const student = (await loadRoster()).students.find((x) => normalizeName(x.name) === sn);
    if (!student) return { ok: false as const, reason: "student_not_found" as const };
    const { data: approved, error: approvedError } = await db.from("parent_requests")
      .select("student_name,status").eq("status", "approved");
    if (approvedError) throw new Error("Could not check parent requests");
    if (hasApprovedParent(approved ?? [], student.name)) {
      return { ok: false as const, reason: "child_already_used" as const };
    }
    const { error } = await db.from("parent_requests").insert({
      parent_name: data.parentName,
      telegram_handle: data.handle,
      gender: data.gender ?? null,
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
    const ip = (getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for") || "unknown").split(",")[0]?.trim() ?? "unknown";
    const subject = `admin-login:${ip}`;
    const db = await getDb();
    const { data: prev } = await db.from("verification_attempts").select("failed_count,banned").eq("subject", subject).maybeSingle();
    if (prev?.banned) return { ok: false as const, blocked: true as const, remaining: 0 };
    if (!checkAdminCredentials(data.username, data.password)) {
      const count = (prev?.failed_count ?? 0) + 1;
      const ban = count >= MAX_FAILED_ATTEMPTS;
      await db.from("verification_attempts").upsert({
        subject, display_name: `Admin login from ${ip}`, failed_count: count, banned: ban,
        banned_at: ban ? new Date().toISOString() : null, last_attempt_at: new Date().toISOString(),
      });
      if (ban) {
        const msg = `🚨 Admin login blocked: ${count} wrong attempts from ${ip} (last username tried: "${data.username.slice(0, 40)}").`;
        await db.from("admin_alerts").insert({ kind: "admin_login", subject, message: msg });
        void notify(msg);
        return { ok: false as const, blocked: true as const, remaining: 0 };
      }
      return { ok: false as const, blocked: false as const, remaining: MAX_FAILED_ATTEMPTS - count };
    }
    await db.from("verification_attempts").delete().eq("subject", subject);
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
      ...(await loadRoster()),
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
    if (data.status === "approved") {
      const { data: req, error: requestError } = await db.from("parent_requests")
        .select("student_name").eq("id", data.id).maybeSingle();
      if (requestError || !req) throw new Error("Could not find parent request");
      const { data: approved, error: approvedError } = await db.from("parent_requests")
        .select("id,student_name,status").eq("status", "approved");
      if (approvedError) throw new Error("Could not check parent requests");
      if (hasApprovedParent(approved ?? [], req.student_name, data.id)) {
        throw new Error("This child's name has already been used for an approved parent request.");
      }
    }
    const { error } = await db
      .from("parent_requests")
      .update({ status: data.status, decided_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error("Update failed");
    let messaged = false;
    if (data.status === "approved") {
      const { data: req } = await db.from("parent_requests").select("telegram_handle,parent_name").eq("id", data.id).maybeSingle();
      if (req) {
        messaged = await messageByHandle(req.telegram_handle, `Hello ${req.parent_name}, your Burka Harbu parent request was approved ✅\n\nJoin the parents-only group here: ${PARENT_GROUP_LINK}`).catch(() => false);
      }
    }
    return { ok: true, messaged };
  });

export const adminDeleteParent = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db.from("parent_requests").delete().eq("id", data.id);
    if (error) throw new Error("Delete failed");
    return { ok: true };
  });

const personSchema = z.object({
  kind: z.enum(["student", "teacher"]),
  name: z.string().trim().min(3).max(120),
  grade: z.enum(["9", "10", "11", "12"]).optional(),
  section: z.string().trim().toUpperCase().regex(/^[A-Z]{1,2}$/).optional(),
  stream: z.enum(["Natural", "Social"]).nullable().optional(),
});

export const adminAddPerson = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ person: personSchema }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const p = data.person;
    if (p.kind === "student" && (!p.grade || !p.section)) throw new Error("Grade and section are required");
    await addToRoster(p.kind, p);
    return { ok: true };
  });

export const adminEditPerson = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ oldName: z.string().min(2).max(120), person: personSchema }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const p = data.person;
    if (p.kind === "student" && (!p.grade || !p.section)) throw new Error("Grade and section are required");
    await removeFromRoster(p.kind, data.oldName);
    await addToRoster(p.kind, p);
    if (p.kind === "student" && p.grade && p.section && data.oldName !== p.name) {
      const db = await getDb();
      await db.from("student_joins").update({ full_name: p.name, grade: p.grade, section: p.section }).eq("full_name", data.oldName);
    }
    return { ok: true };
  });

export const adminRemovePerson = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ kind: z.enum(["student", "teacher"]), name: z.string().min(2).max(120) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    await removeFromRoster(data.kind, data.name);
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

export const adminUpdateStudentHandle = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ name: z.string().min(2).max(120), handle }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db.from("student_joins").update({ telegram_handle: data.handle }).eq("full_name", data.name);
    if (error) throw new Error("Could not update username");
    await db.from("portal_registrations").update({ telegram_handle: data.handle }).eq("kind", "student").eq("source_key", data.name);
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
    const q = normalizeName(data.q);
    return (await loadRoster()).students
      .map((s) => ({ name: s.name, grade: s.grade, section: s.section }))
      .filter((s) => {
        const n = normalizeName(s.name);
        return n.startsWith(q) || n.split(" ").some((w) => w.startsWith(q));
      })
      .slice(0, 5);
  });

export const adminGetRegistrations = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ q: z.string().max(120).default(""), page: z.number().int().min(0).default(0) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    let query = db.from("portal_registrations").select("*", { count: "exact" });
    const q = data.q.trim().replace(/^@/, "").replace(/[^\p{L}\p{N}_ .-]/gu, "");
    if (q) query = query.or(`full_name.ilike.%${q}%,telegram_handle.ilike.%${q}%`);
    const { data: rows, count, error } = await query.order("registered_at", { ascending: false }).range(data.page * 50, data.page * 50 + 49);
    if (error) throw new Error("Could not load registrations");
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const adminUpdateGender = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ id: z.string().uuid(), gender: genderSchema.nullable() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { data: row, error } = await db.from("portal_registrations").select("kind,source_key").eq("id", data.id).single();
    if (error || !row) throw new Error("Registration not found");
    const source = row.kind === "student" ? db.from("student_joins").update({ gender: data.gender }).eq("full_name", row.source_key)
      : row.kind === "teacher" ? db.from("teacher_access").update({ gender: data.gender }).eq("id", row.source_key)
      : row.kind === "parent" ? db.from("parent_requests").update({ gender: data.gender }).eq("id", row.source_key) : null;
    if (source) { const { error: updateError } = await source; if (updateError) throw new Error("Could not update gender"); }
    const { error: saveError } = await db.from("portal_registrations").update({ gender: data.gender }).eq("id", data.id);
    if (saveError) throw new Error("Could not save profile");
    return { ok: true };
  });

export const adminGetNotificationHistory = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ page: z.number().int().min(0).default(0) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { data: rows, count, error } = await db.from("bot_notifications").select("*", { count: "exact" }).order("last_sent_at", { ascending: false }).range(data.page * 25, data.page * 25 + 24);
    if (error) throw new Error("Could not load notifications");
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const adminGetNotificationDeliveries = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ id: z.string().uuid(), q: z.string().max(120).default(""), status: z.enum(["all","delivered","blocked","failed","not_started","sending"]).default("all"), page: z.number().int().min(0).default(0) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const statuses = ["delivered", "blocked", "failed", "not_started", "sending"] as const;
    const totals = await Promise.all(statuses.map(async (status) => {
      const { count, error } = await db.from("bot_deliveries").select("id", { count: "exact", head: true }).eq("notification_id", data.id).eq("status", status);
      if (error) throw new Error("Could not load delivery totals");
      return { status, count: count ?? 0 };
    }));
    let query = db.from("bot_deliveries").select("*", { count: "exact" }).eq("notification_id", data.id);
    if (data.status !== "all") query = query.eq("status", data.status);
    const q = data.q.trim().replace(/^@/, "").replace(/[^\p{L}\p{N}_ .-]/gu, "");
    if (q) query = query.or(`telegram_handle.ilike.%${q}%,display_name.ilike.%${q}%`);
    const { data: rows, count, error } = await query.order("attempted_at", { ascending: false }).range(data.page * 50, data.page * 50 + 49);
    if (error) throw new Error("Could not load delivery history");
    return { rows: rows ?? [], count: count ?? 0, totals };
  });

export const adminBotStats = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [{ count: total }, { count: today }, { data: latest }] = await Promise.all([
      db.from("telegram_users").select("chat_id", { count: "exact", head: true }),
      db.from("telegram_users").select("chat_id", { count: "exact", head: true }).gte("first_seen", since),
      db.from("telegram_users").select("first_name,username,first_seen").order("first_seen", { ascending: false }).limit(5),
    ]);
    return { total: total ?? 0, today: today ?? 0, latest: latest ?? [] };
  });

export const adminBroadcast = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    tokenSchema
      .extend({ text: z.string().trim().min(1).max(4000), withButton: z.boolean().default(true), handles: z.array(handle).max(200).optional() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { data: users, error } = await db.from("telegram_users").select("chat_id,username");
    if (error) throw new Error("Could not load bot users");
    let list = users ?? [];
    let notFound: string[] = [];
    if (data.handles?.length) {
      const wanted = new Map(data.handles.map((h) => [h.replace(/^@/, "").toLowerCase(), h]));
      list = list.filter((u) => u.username && wanted.delete(u.username.toLowerCase()));
      notFound = [...wanted.values()];
    }
    const reply_markup = data.withButton ? { inline_keyboard: [[{ text: "Open verification portal", web_app: { url: "https://bhsss-verifications.vercel.app/" } }]] } : undefined;
    let sent = 0, failed = 0;
    for (let i = 0; i < list.length; i += 10) {
      const results = await Promise.all(list.slice(i, i + 10).map((u) =>
        telegramCall("sendMessage", { chat_id: u.chat_id, text: data.text, ...(reply_markup ? { reply_markup } : {}) }).then((r) => r.ok).catch(() => false)));
      for (const ok of results) ok ? sent++ : failed++;
      await new Promise((r) => setTimeout(r, 400));
    }
    return { sent, failed, total: list.length, notFound };
  });

// ---------- Grade 12 exam portal testers ----------
async function examTestState() {
  const db = await getDb();
  const { data } = await db.from("app_settings").select("key,value").in("key", ["exam_test_deadline", "exam_test_picked_at", "exam_test_benefits", "exam_test_mode", "exam_test_visible"]);
  const { parseBenefits } = await import("./exam-test-rules");
  const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return { deadline: (m["exam_test_deadline"] as string | undefined) || null, pickedAt: (m["exam_test_picked_at"] as string | undefined) || null, benefits: parseBenefits(m["exam_test_benefits"] as string | undefined), mode: ((m["exam_test_mode"] as string | undefined) || "auto") as "auto" | "open" | "closed", visible: (m["exam_test_visible"] as string | undefined) !== "0" };
}

async function ensureExamPicked() {
  const st = await examTestState();
  if (st.mode !== "auto" || st.pickedAt || !st.deadline || Date.now() < new Date(st.deadline).getTime()) return st;
  const db = await getDb();
  const pickedAt = new Date().toISOString();
  // Claim the pick once; a concurrent caller hitting the conflict skips.
  const { error } = await db.from("app_settings").insert({ key: "exam_test_picked_at", value: pickedAt });
  if (error) return examTestState();
  const { pickTesters, selectionMessage } = await import("./exam-test-rules");
  const { data: all } = await db.from("exam_testers").select("telegram_handle,full_name,section");
  const picked = pickTesters(all ?? []);
  for (const p of picked) {
    await db.from("exam_testers").update({ selected: true }).eq("telegram_handle", p.telegram_handle);
    const ok = await messageByHandle(p.telegram_handle, selectionMessage(p.full_name, st.benefits)).catch(() => false);
    await db.from("exam_testers").update({ notified: ok }).eq("telegram_handle", p.telegram_handle);
  }
  return { ...st, pickedAt };
}

export const getExamTestStatus = createServerFn({ method: "GET" }).handler(async () => {
  const st = await ensureExamPicked();
  return { deadline: st.mode === "auto" ? st.deadline : null, closed: !!st.pickedAt || st.mode === "closed", open: st.mode === "open" || (st.mode === "auto" && !!st.deadline), benefits: st.benefits, visible: st.visible };
});

export const signupExamTester = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().trim().min(3).max(120), handle }).parse(d))
  .handler(async ({ data }) => {
    const st = await ensureExamPicked();
    if (st.pickedAt || st.mode === "closed") return { ok: false as const, reason: "closed" as const };
    if (st.mode === "auto" && !st.deadline) return { ok: false as const, reason: "not_open" as const };
    const db = await getDb();
    const { data: joins } = await db.from("student_joins").select("full_name,section,telegram_handle").eq("grade", "12").ilike("telegram_handle", data.handle);
    const { isTesterSection } = await import("./exam-test-rules");
    const j = (joins ?? []).find((x) => normalizeName(x.full_name) === normalizeName(data.name));
    if (!j) return { ok: false as const, reason: "not_registered" as const };
    if (!isTesterSection(j.section)) return { ok: false as const, reason: "wrong_section" as const };
    const { error } = await db.from("exam_testers").insert({ telegram_handle: j.telegram_handle, full_name: j.full_name, section: j.section });
    if (error) return { ok: false as const, reason: "already" as const };
    return { ok: true as const, name: j.full_name };
  });

export const adminExamTesters = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const st = await ensureExamPicked();
    const db = await getDb();
    const { data: rows } = await db.from("exam_testers").select("*").order("signed_up_at");
    return { ...st, rows: rows ?? [] };
  });

export const adminSetExamDeadline = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ deadline: z.string().datetime() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    await db.from("app_settings").upsert({ key: "exam_test_deadline", value: data.deadline });
    return { ok: true };
  });

export const adminSetExamBenefits = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ benefits: z.array(z.string().trim().min(1).max(200)).min(1).max(10) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const { error } = await db.from("app_settings").upsert({ key: "exam_test_benefits", value: data.benefits.join("\n") });
    if (error) throw new Error("Could not save benefits");
    return { ok: true };
  });

export const adminSetExamMode = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ mode: z.enum(["auto", "open", "closed"]) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    await db.from("app_settings").upsert({ key: "exam_test_mode", value: data.mode });
    return { ok: true };
  });

export const adminSetExamVisible = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ visible: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    await db.from("app_settings").upsert({ key: "exam_test_visible", value: data.visible ? "1" : "0" });
    return { ok: true };
  });

/** Manually picks the given sign-ups and sends each one the selection message. */
export const adminPickExamTesters = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ handles: z.array(z.string().trim().min(2).max(40)).min(1).max(50) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    const st = await examTestState();
    if (st.pickedAt) throw new Error("Students were already picked. Reset the pick first.");
    // Claim the pick once; a concurrent caller hitting the conflict skips.
    const { error } = await db.from("app_settings").insert({ key: "exam_test_picked_at", value: new Date().toISOString() });
    if (error) throw new Error("Students were already picked. Reset the pick first.");
    const wanted = new Set(data.handles.map((h) => normalizeHandle(h).toLowerCase()));
    const { data: all } = await db.from("exam_testers").select("telegram_handle,full_name");
    const picked = (all ?? []).filter((r) => wanted.has(r.telegram_handle.toLowerCase()));
    const { selectionMessage } = await import("./exam-test-rules");
    let sent = 0, failed = 0;
    for (const p of picked) {
      await db.from("exam_testers").update({ selected: true }).eq("telegram_handle", p.telegram_handle);
      const ok = await messageByHandle(p.telegram_handle, selectionMessage(p.full_name, st.benefits)).catch(() => false);
      await db.from("exam_testers").update({ notified: ok }).eq("telegram_handle", p.telegram_handle);
      ok ? sent++ : failed++;
    }
    return { ok: true as const, picked: picked.length, sent, failed };
  });

export const adminRemoveExamTester = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ handle: z.string().min(2).max(40) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    await db.from("exam_testers").delete().eq("telegram_handle", data.handle);
    return { ok: true };
  });

/** Clears the previous pick so a new deadline can pick again; sign-ups are kept. */
export const adminResetExamPick = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const db = await getDb();
    await db.from("exam_testers").update({ selected: false, notified: null }).eq("selected", true);
    await db.from("app_settings").delete().eq("key", "exam_test_picked_at");
    return { ok: true };
  });
