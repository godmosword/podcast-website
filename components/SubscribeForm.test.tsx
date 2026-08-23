// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import SubscribeForm from "./SubscribeForm";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SubscribeForm", () => {
  test("載入中以 status 告知，不只顯示省略號", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    render(<SubscribeForm />);
    expect(screen.getByRole("status").textContent).toContain(
      "正在準備訂閱表單",
    );
  });

  test("未勾選同意時送出鈕 disabled，且不標 busy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      }),
    );
    render(<SubscribeForm />);
    const submit = await screen.findByRole("button", { name: "訂閱新集通知" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    expect(submit.hasAttribute("aria-busy")).toBe(false);
  });
});
