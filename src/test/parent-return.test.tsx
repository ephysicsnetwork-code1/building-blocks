import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PARENT_RETURN_HOURS } from "@/lib/parent-telegram";

const mocks = vi.hoisted(() => ({ status: vi.fn(), submit: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/portal.functions", () => ({ getParentStatus: mocks.status, submitParentRequest: mocks.submit }));
import { ParentFlow } from "@/components/portal/ParentFlow";

describe("returning parent requests", () => {
  beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); localStorage.setItem("bh_parent_handle", "@parent123"); });
  afterEach(cleanup);
  it("uses the requested 18-hour return reminder without delaying approval access", () => {
    expect(PARENT_RETURN_HOURS).toBe(18);
  });
  it("restores the saved request identity and receipt instead of requiring another submission", async () => {
    localStorage.setItem("bh_parent_receipt", "signed-receipt");
    mocks.status.mockResolvedValue({ status: "approved", link: "https://t.me/+za9uD7CLuG5mOWM0" });
    render(<ParentFlow support="@bhsss_admin" supportUrl="https://t.me/bhsss_admin" />);
    await waitFor(() => expect(mocks.status).toHaveBeenCalledWith({ data: { handle: "@parent123", receipt: "signed-receipt" } }));
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("preserves request identity after a failed status lookup", async () => {
    mocks.status.mockRejectedValue(new Error("Offline"));
    render(<ParentFlow support="@bhsss_admin" supportUrl="https://t.me/bhsss_admin" />);
    await waitFor(() => expect(mocks.status).toHaveBeenCalled());
    expect(localStorage.getItem("bh_parent_handle")).toBe("@parent123");
    expect(mocks.submit).not.toHaveBeenCalled();
  });
});