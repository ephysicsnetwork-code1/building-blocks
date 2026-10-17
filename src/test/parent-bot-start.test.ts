import { afterEach, describe, expect, it, vi } from "vitest";
import { openParentBot } from "@/lib/parent-telegram";

describe("parent bot start", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens the exact parent start link using Telegram's native action", () => {
    const openTelegramLink = vi.fn();
    vi.stubGlobal("window", { Telegram: { WebApp: { openTelegramLink } } });
    expect(openParentBot()).toBe(true);
    expect(openTelegramLink).toHaveBeenCalledWith("https://t.me/BHSSS_Verification_bot?start=parent_auth");
  });

  it("allows normal navigation outside Telegram", () => {
    vi.stubGlobal("window", {});
    expect(openParentBot()).toBe(false);
  });

  it("allows normal navigation if Telegram cannot open the chat", () => {
    vi.stubGlobal("window", { Telegram: { WebApp: { openTelegramLink: () => { throw new Error("Unavailable"); } } } });
    expect(openParentBot()).toBe(false);
  });
});