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
  FEEDBACK_LOADING_LABEL,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_NICKNAME_LABEL,
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
    expect(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeTruthy();
    expect(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeTruthy();
  });

  test("unavailable 時顯示 mailto 降級", () => {
    render(<FeedbackForm available={false} />);
    const link = screen.getByRole("link", { name: FEEDBACK_MAILTO_LINK });
    expect(link.getAttribute("href")).toBe(feedbackMailtoHref());
    expect(screen.queryByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeNull();
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

  test("Action 回 unavailable 時改顯示 mailto", async () => {
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
    expect(link.getAttribute("href")).toBe(feedbackMailtoHref());
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
