// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import FeedbackForm from "./FeedbackForm";
import {
  FEEDBACK_LOADING_LABEL,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_SUBMIT_DISABLED_HINT,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_SUCCESS,
} from "@/lib/feedback-copy";
import { feedbackMailtoHref } from "@/lib/contact";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FeedbackForm", () => {
  test("載入中以 status 告知", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    render(<FeedbackForm />);
    expect(screen.getByRole("status").textContent).toContain(
      FEEDBACK_LOADING_LABEL,
    );
  });

  test("未勾兩項同意時送出鈕 disabled 並顯示提示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      }),
    );
    render(<FeedbackForm />);
    const submit = await screen.findByRole("button", {
      name: FEEDBACK_SUBMIT_LABEL,
    });
    expect(submit.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(FEEDBACK_SUBMIT_DISABLED_HINT)).toBeTruthy();
  });

  test("503 時改顯示 mailto 降級", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (method === "GET") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ available: true }),
          });
        }
        return Promise.resolve({ ok: false, status: 503 });
      }),
    );
    render(<FeedbackForm />);
    await screen.findByRole("button", { name: FEEDBACK_SUBMIT_LABEL });

    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }), {
      target: { value: "Bonbon" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /信箱/i }), {
      target: { value: "parent@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /你最想說的話/i }), {
      target: { value: "謝謝馬米" },
    });
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL }));

    const link = await screen.findByRole("link", { name: FEEDBACK_MAILTO_LINK });
    expect(link.getAttribute("href")).toBe(feedbackMailtoHref());
  });

  test("成功 POST 含兩項 consent 並顯示慶祝態", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ available: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ ok: true }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackForm />);
    await screen.findByRole("button", { name: FEEDBACK_SUBMIT_LABEL });

    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }), {
      target: { value: "Bonbon" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /信箱/i }), {
      target: { value: "parent@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /你最想說的話/i }), {
      target: { value: "謝謝馬米" },
    });
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            nickname: "Bonbon",
            email: "parent@example.com",
            message: "謝謝馬米",
            parentConsent: true,
            publishConsent: true,
          }),
        }),
      );
    });

    expect((await screen.findByRole("status")).textContent).toBe(FEEDBACK_SUCCESS);
  });
});
