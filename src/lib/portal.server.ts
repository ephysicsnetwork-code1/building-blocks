import { createHmac, timingSafeEqual } from "crypto";

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
    support_handle: map["support_handle"] ?? "@Spaceanduniverse13",
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
