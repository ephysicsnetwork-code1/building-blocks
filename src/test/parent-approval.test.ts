import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(), getDb: vi.fn(), getSettings: vi.fn(), messageByHandle: vi.fn(), verifiedTelegramHandle: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ inputValidator() { return this; }, handler(fn: unknown) { return fn; } }),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: vi.fn() }));
vi.mock("@/lib/portal.server", () => ({
  ...mocks, checkAdminCredentials: vi.fn(), issueAdminToken: vi.fn(), telegramCall: vi.fn(),
  isBanned: vi.fn(), recordFailure: vi.fn(), clearFailures: vi.fn(), loadRoster: vi.fn(),
  addToRoster: vi.fn(), removeFromRoster: vi.fn(),
}));
import { adminDecideParent } from "@/lib/portal.functions";

const decide = adminDecideParent as unknown as (input: { data: { token: string; id: string; status: "approved" | "rejected" } }) => Promise<{ messaged: boolean; messageError: string | null }>;

describe("parent approval delivery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const query = {
      update: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then(resolve: (value: unknown) => unknown) { return Promise.resolve({ error: null }).then(resolve); },
      maybeSingle: vi.fn().mockResolvedValue({ data: { telegram_handle: "@parent123", parent_name: "Test Parent" } }),
    };
    mocks.getDb.mockResolvedValue({ from: () => query });
    mocks.getSettings.mockResolvedValue({ telegram_link: "https://t.me/+test-invite" });
  });
  it("sends approval immediately to an existing bot chat without another start", async () => {
    mocks.messageByHandle.mockResolvedValue(true);
    const result = await decide({ data: { token: "test-token", id: "request-id", status: "approved" } });
    expect(mocks.assertAdmin).toHaveBeenCalledWith("test-token");
    expect(mocks.messageByHandle).toHaveBeenCalledWith("@parent123", expect.stringContaining("APPROVED!"), {
      inline_keyboard: [[{ text: "📱 Open Portal", web_app: { url: "https://bhsss-verifications.vercel.app/" } }]],
    });
    expect(mocks.messageByHandle.mock.calls[0]?.[1]).not.toContain("https://t.me/");
    expect(result.messaged).toBe(true);
  });
  it("reports when Telegram cannot deliver rather than claiming it sent", async () => {
    mocks.messageByHandle.mockResolvedValue(false);
    const result = await decide({ data: { token: "test-token", id: "request-id", status: "approved" } });
    expect(result.messaged).toBe(false);
    expect(result.messageError).toBe("Approval saved! Please remind the parent to open @BHSSS_Verification_bot and tap /start to receive their approval notification.");
  });
  it("keeps approval saved and supplies the reminder when the bot is blocked", async () => {
    mocks.messageByHandle.mockRejectedValue(new Error("Telegram [403]: Forbidden: bot was blocked by user"));
    const result = await decide({ data: { token: "test-token", id: "request-id", status: "approved" } });
    expect(result.messaged).toBe(false);
    expect(result.messageError).toContain("Approval saved! Please remind the parent to open @BHSSS_Verification_bot");
  });
  it("does not send an approval message for rejected requests", async () => {
    await decide({ data: { token: "test-token", id: "request-id", status: "rejected" } });
    expect(mocks.messageByHandle).not.toHaveBeenCalled();
  });
});