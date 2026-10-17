import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), verifiedTelegramHandle: vi.fn(), verifyParentReceipt: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: vi.fn() }));
vi.mock("@/lib/portal.server", async (importOriginal) => ({ ...await importOriginal<object>(), ...mocks }));
import { getParentStatus } from "@/lib/portal.functions";
const status = getParentStatus as unknown as (input: { data: { handle?: string; initData?: string; receipt?: string } }) => Promise<{ status: string; link: string | null }>;

describe("parent invite access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const query = { select: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ status: "approved" }] }) };
    mocks.getDb.mockResolvedValue({ from: () => query });
  });
  it("never reveals an invite to a caller who only types an approved handle", async () => {
    expect((await status({ data: { handle: "@parent123" } })).link).toBeNull();
  });
  it("restores approved access using a signed request-scoped receipt even with stale Telegram data", async () => {
    mocks.verifyParentReceipt.mockReturnValue({ id: "request-123", handle: "@parent123" });
    mocks.verifiedTelegramHandle.mockImplementation(() => { throw new Error("Expired"); });
    const eq = vi.fn().mockReturnThis();
    mocks.getDb.mockResolvedValue({ from: () => ({ select() { return this; }, ilike() { return this; }, eq, order: async () => ({ data: [{ status: "approved" }] }) }) });
    expect((await status({ data: { receipt: "signed-receipt", initData: "stale" } })).link).toBe("https://t.me/+za9uD7CLuG5mOWM0");
    expect(eq).toHaveBeenCalledWith("id", "request-123");
  });
  it("rejects forged receipts", async () => {
    mocks.verifyParentReceipt.mockImplementation(() => { throw new Error("Invalid request receipt"); });
    await expect(status({ data: { receipt: "forged" } })).rejects.toThrow("Invalid request receipt");
  });
  it("reveals the requested invite after checking signed Telegram identity and approval", async () => {
    mocks.verifiedTelegramHandle.mockReturnValue("@parent123");
    expect((await status({ data: { initData: "signed-data" } })).link).toBe("https://t.me/+za9uD7CLuG5mOWM0");
    expect(mocks.verifiedTelegramHandle).toHaveBeenCalledWith("signed-data");
  });
  it("does not release the invite for pending requests", async () => {
    mocks.verifiedTelegramHandle.mockReturnValue("@parent123");
    mocks.getDb.mockResolvedValue({ from: () => ({ select() { return this; }, ilike() { return this; }, order: async () => ({ data: [{ status: "pending" }] }) }) });
    expect((await status({ data: { initData: "signed-data" } })).link).toBeNull();
  });
});

describe("Telegram mini-app signatures", () => {
  it("accepts signed parent receipts and rejects changes to their request identity", async () => {
    const { issueParentReceipt, verifyParentReceipt } = await vi.importActual<typeof import("@/lib/portal.server")>("@/lib/portal.server");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-only-session-secret");
    try {
      const receipt = issueParentReceipt("request-123", "@parent123");
      expect(verifyParentReceipt(receipt)).toEqual({ id: "request-123", handle: "@parent123" });
      const forged = Buffer.from(JSON.stringify({ id: "another-request", handle: "@parent123" })).toString("base64url");
      expect(() => verifyParentReceipt(`${forged}.${receipt.split(".")[1]}`)).toThrow("Invalid request receipt");
    } finally { vi.unstubAllEnvs(); }
  });
  it("rejects altered or stale data even with a valid username", async () => {
    const { verifiedTelegramHandle } = await vi.importActual<typeof import("@/lib/portal.server")>("@/lib/portal.server");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-only-token");
    try {
      const makeData = (date: number) => {
        const params = new URLSearchParams({ auth_date: String(date), user: JSON.stringify({ id: 123, username: "parent123" }) });
        const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
        const key = createHmac("sha256", "WebAppData").update("test-only-token").digest();
        params.set("hash", createHmac("sha256", key).update(check).digest("hex"));
        return params;
      };
      const fresh = makeData(Math.floor(Date.now() / 1000));
      expect(verifiedTelegramHandle(fresh.toString())).toBe("@parent123");
      fresh.set("user", JSON.stringify({ username: "otherparent" }));
      expect(() => verifiedTelegramHandle(fresh.toString())).toThrow();
      expect(() => verifiedTelegramHandle(makeData(Math.floor(Date.now() / 1000) - 3601).toString())).toThrow();
    } finally { vi.unstubAllEnvs(); }
  });
});