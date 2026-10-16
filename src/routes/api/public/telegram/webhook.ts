import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

const PORTAL_URL = "https://bhsss-verifications.vercel.app/";
const PORTAL_BUTTON = {
  inline_keyboard: [[{ text: "Open verification portal", web_app: { url: PORTAL_URL } }]],
};

function expectedSecret(token: string) {
  return createHash("sha256").update(`tg-webhook:${token}`).digest("base64url");
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["TELEGRAM_BOT_TOKEN"];
        if (!token) return new Response("Not configured", { status: 500 });
        const got = Buffer.from(request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "");
        const want = Buffer.from(expectedSecret(token));
        if (got.length !== want.length || !timingSafeEqual(got, want)) return new Response("Unauthorized", { status: 401 });

        const update = await request.json().catch(() => null);
        const msg = update?.message;
        if (!msg?.chat?.id || msg.chat.type !== "private") return Response.json({ ok: true });

        const { getDb, getSettings, telegramCall } = await import("@/lib/portal.server");
        const db = await getDb();
        const chatId = msg.chat.id as number;
        const username: string | null = msg.from?.username ?? null;
        await db.from("telegram_users").upsert({ chat_id: chatId, username, first_name: msg.from?.first_name ?? null });

        const text: string = (msg.text ?? "").trim();
        if (!text.startsWith("/start")) {
          await telegramCall("sendMessage", {
            chat_id: chatId,
            text: "Please verify on the official portal.",
            reply_markup: PORTAL_BUTTON,
          });
          return Response.json({ ok: true });
        }

        const name = msg.from?.first_name ?? "there";
        await telegramCall("sendMessage", {
          chat_id: chatId,
          text: `👋 Welcome ${name}, to the official Burka Harbu Special Secondary School bot.\n\nStudents, teachers and parents can verify using the button below.`,
          reply_markup: PORTAL_BUTTON,
        });

        if (username) {
          const h = `@${username}`;
          const [{ data: parent }, { data: student }] = await Promise.all([
            db.from("parent_requests").select("parent_name").ilike("telegram_handle", h).eq("status", "approved").limit(1),
            db.from("student_joins").select("full_name").ilike("telegram_handle", h).limit(1),
          ]);
          if (parent && parent.length > 0) {
            const s = await getSettings();
            await telegramCall("sendMessage", { chat_id: chatId, text: `✅ Your parent request is approved.\n\nJoin the private group: ${s.telegram_link}` });
          } else if (student && student.length > 0) {
            await telegramCall("sendMessage", { chat_id: chatId, text: "You have successfully joined the Burka Harbu student network!" });
          }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
