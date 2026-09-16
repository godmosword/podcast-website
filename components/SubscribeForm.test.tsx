// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import SubscribeForm from "./SubscribeForm";
import {
  SUBSCRIBE_EMAIL_LABEL,
  SUBSCRIBE_LOADING_LABEL,
  SUBSCRIBE_PRIVACY_NOTE,
  SUBSCRIBE_SUBMIT_LABEL,
  SUBSCRIBE_SUCCESS,
  SUBSCRIBE_UNAVAILABLE_NOTE,
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
    const spotify = await screen.findByRole("link", { name: "在 Spotify 收聽" });
    expect(spotify.getAttribute("href")).toContain("open.spotify.com");
    expect(spotify.getAttribute("href")).toContain("utm_medium=subscribe_cta");
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(SUBSCRIBE_UNAVAILABLE_NOTE)).toBeTruthy();
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
    fireEvent.change(await screen.findByRole("textbox", { name: SUBSCRIBE_EMAIL_LABEL }), {
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
