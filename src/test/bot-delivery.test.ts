import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ writes: [] as { table: string; operation: string; data: Record<string, unknown> }[] }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (table: string) => {
    const query = {
      upsert: (data: Record<string, unknown>) => { state.writes.push({ table, operation: "upsert", data }); return query; },
      insert: (data: Record<string, unknown>) => { state.writes.push({ table, operation: "insert", data }); return query; },
      update: (data: Record<string, unknown>) => { state.writes.push({ table, operation: "update", data }); return query; },
      select: () => query,
      eq: () => query,
      single: async () => ({ data: { id: `${table}-id` }, error: null }),
      maybeSingle: async () => ({ data: { username: "example_user", first_name: "Example" }, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
    };
    return query;
  } },
}));
import { telegramCall } from "@/lib/portal.server";

afterEach(() => { state.writes.length = 0; vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("persistent bot delivery tracking", () => {
  it.each([
    [{ ok: true, result: { message_id: 123 } }, "delivered", null],
    [{ ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" }, "blocked", 403],
    [{ ok: false, error_code: 400, description: "Bad Request: chat not found" }, "failed", 400],
  ])("records Telegram outcomes without losing the recipient", async (result, status, code) => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(result))));
    await telegramCall("sendMessage", { chat_id: 42, text: "Test notification" });
    expect(state.writes.find((w) => w.table === "bot_notifications")?.data["message"]).toBe("Test notification");
    expect(state.writes.find((w) => w.operation === "insert")?.data).toMatchObject({ chat_id: 42, telegram_handle: "@example_user", status: "sending" });
    expect(state.writes.find((w) => w.operation === "update")?.data).toMatchObject({ status, error_code: code });
  });
  it("records network failures instead of leaving deliveries in sending state", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(telegramCall("sendMessage", { chat_id: 42, text: "Test notification" })).rejects.toThrow("Telegram could not be reached");
    expect(state.writes.find((w) => w.operation === "update")?.data["status"]).toBe("failed");
  });
});