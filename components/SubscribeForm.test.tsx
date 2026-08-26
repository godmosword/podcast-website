// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import SubscribeForm from "./SubscribeForm";
import {
  SUBSCRIBE_LOADING_LABEL,
  SUBSCRIBE_PRIVACY_NOTE,
  SUBSCRIBE_SUBMIT_LABEL,
  SUBSCRIBE_SUCCESS,
  SUBSCRIBE_UNAVAILABLE_LINK,
} from "@/lib/subscribe-copy";

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
      SUBSCRIBE_LOADING_LABEL,
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
    const submit = await screen.findByRole("button", {
      name: SUBSCRIBE_SUBMIT_LABEL,
    });
    expect(submit.hasAttribute("disabled")).toBe(true);
    expect(submit.hasAttribute("aria-busy")).toBe(false);
    expect(
      screen.getByText(SUBSCRIBE_PRIVACY_NOTE, { exact: false }),
    ).toBeTruthy();
  });

  test("API 不可用時引導至收聽平台，不承諾寄新集", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: false }),
      }),
    );
    render(<SubscribeForm />);
    const link = await screen.findByRole("link", {
      name: SUBSCRIBE_UNAVAILABLE_LINK,
    });
    expect(link.getAttribute("href")).toBe("/#connect");
  });

  test("送出成功後說明確認信，且不承諾立刻寄新集", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ available: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 202,
          json: async () => ({ ok: true }),
        });
      }),
    );
    render(<SubscribeForm />);
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "parent@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    const submit = screen.getByRole("button", { name: SUBSCRIBE_SUBMIT_LABEL });
    expect(submit.hasAttribute("disabled")).toBe(false);
    fireEvent.click(submit);
    expect((await screen.findByRole("status")).textContent).toBe(
      SUBSCRIBE_SUCCESS,
    );
  });
});
