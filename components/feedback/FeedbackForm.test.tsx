// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import FeedbackForm from "./FeedbackForm";
import {
  FEEDBACK_HONEYPOT_FIELD,
  type FeedbackActionState,
} from "@/lib/feedback-action";
import {
  FEEDBACK_EYEBROW,
  FEEDBACK_FORM_HEADING,
  FEEDBACK_INVITE_PARENT,
  FEEDBACK_LOADING_LABEL,
  FEEDBACK_MAILTO_LEAD,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_MESSAGE_LABEL,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_REVIEW_LEAD,
  FEEDBACK_STARTERS,
  FEEDBACK_SUBMIT_DISABLED_HINT,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_SUCCESS,
} from "@/lib/feedback-copy";
import { feedbackMailtoHref } from "@/lib/contact";

vi.stubGlobal("React", React);

const { submitFeedback } = vi.hoisted(() => ({
  submitFeedback: vi.fn(async (): Promise<FeedbackActionState> => ({
    status: "success",
    message: FEEDBACK_SUCCESS,
  })),
}));

vi.mock("@/app/feedback/actions", () => ({
  submitFeedback,
}));

afterEach(() => {
  cleanup();
  submitFeedback.mockReset();
  submitFeedback.mockResolvedValue({
    status: "success",
    message: FEEDBACK_SUCCESS,
  });
});

describe("FeedbackForm", () => {
  test("available 時立刻有欄位，沒有載入中", () => {
    render(<FeedbackForm available />);
    expect(screen.queryByText(FEEDBACK_LOADING_LABEL)).toBeNull();
    expect(screen.getByRole("heading", { name: FEEDBACK_FORM_HEADING, level: 2 })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeTruthy();
    expect(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeTruthy();
    expect(screen.queryByRole("link", { name: FEEDBACK_MAILTO_LINK })).toBeNull();
  });

  test("起頭 chip 寫進留言欄，可改", () => {
    render(<FeedbackForm available />);
    const starter = FEEDBACK_STARTERS[0];
    fireEvent.click(screen.getByRole("button", { name: starter.label }));
    expect(
      (screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }) as HTMLTextAreaElement)
        .value,
    ).toBe(starter.text);
    expect(
      screen.getByRole("button", { name: starter.label }).getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: FEEDBACK_STARTERS[1].label }));
    expect(
      (screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }) as HTMLTextAreaElement)
        .value,
    ).toBe(FEEDBACK_STARTERS[1].text);
  });

  test("unavailable 時仍畫欄位，mailto 只當備援", () => {
    render(<FeedbackForm available={false} />);
    expect(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeTruthy();
    expect(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeTruthy();
    const link = screen.getByRole("link", { name: FEEDBACK_MAILTO_LINK });
    expect(link.getAttribute("href")).toBe(feedbackMailtoHref());
    expect(screen.getByText(FEEDBACK_MAILTO_LEAD)).toBeTruthy();
    expect(screen.getByText(FEEDBACK_EYEBROW)).toBeTruthy();
    expect(screen.getByText(FEEDBACK_INVITE_PARENT, { exact: false })).toBeTruthy();
    expect(screen.getByText(FEEDBACK_REVIEW_LEAD, { exact: false })).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }), {
      target: { value: "小車" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }), {
      target: { value: "想聽挖土機" },
    });
    expect(link.getAttribute("href")).toBe(
      feedbackMailtoHref({ nickname: "小車", message: "想聽挖土機" }),
    );
  });

  test("蜜罐在 DOM 但不進可及樹", () => {
    render(<FeedbackForm available />);
    const honey = document.querySelector(`input[name="${FEEDBACK_HONEYPOT_FIELD}"]`);
    expect(honey).toBeTruthy();
    expect(honey?.closest("[aria-hidden='true']")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "網站" })).toBeNull();
  });

  test("hydration 後未勾兩項同意時送出鈕 disabled 並顯示提示", async () => {
    render(<FeedbackForm available />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL }).hasAttribute("disabled"),
      ).toBe(true);
    });
    expect(screen.getByText(FEEDBACK_SUBMIT_DISABLED_HINT)).toBeTruthy();
  });

  test("Action 回 unavailable 時表單仍在，mailto 帶入草稿", async () => {
    submitFeedback.mockResolvedValue({
      status: "unavailable",
      message: "送出失敗，請再試一次。",
    });
    render(<FeedbackForm available />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL }).hasAttribute("disabled"),
      ).toBe(true);
    });

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
    expect(link.getAttribute("href")).toBe(
      feedbackMailtoHref({ nickname: "Bonbon", message: "謝謝馬米" }),
    );
    expect(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeTruthy();
  });

  test("成功後表單仍在、欄位清空、status 讀成功句", async () => {
    render(<FeedbackForm available />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL }).hasAttribute("disabled"),
      ).toBe(true);
    });

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
      expect(submitFeedback).toHaveBeenCalled();
    });

    expect((await screen.findByRole("status")).textContent).toBe(FEEDBACK_SUCCESS);
    await waitFor(() => {
      expect(
        (screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }) as HTMLInputElement)
          .value,
      ).toBe("");
    });
    expect(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeTruthy();
  });
});
