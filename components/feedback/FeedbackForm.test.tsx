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
  FEEDBACK_EMAIL_LABEL,
  FEEDBACK_FORM_HEADING,
  FEEDBACK_LOADING_LABEL,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_MESSAGE_LABEL,
  FEEDBACK_NICKNAME_LABEL,
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

const REMOVED_COPY = [
  "這個當做蒐集資料，不會顯示在畫面上。",
  "你最想說的話",
  "先選一句試試看",
  "也歡迎寫下想聽的故事。",
  "給家長",
  "可以讓孩子說、爸媽幫忙打字。",
  "家長同意、馬米看過之後，才會貼上牆。",
  "請先勾選兩項同意，才能送出。",
  "馬米暫時用 email 收信。",
  "想聽挖土機",
  "最喜歡小紅賽車",
  "謝謝馬米說故事",
];

describe("FeedbackForm", () => {
  test("available 時立刻有欄位，沒有載入中", () => {
    render(<FeedbackForm available />);
    expect(screen.queryByText(FEEDBACK_LOADING_LABEL)).toBeNull();
    expect(screen.getByRole("heading", { name: FEEDBACK_FORM_HEADING, level: 2 })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: FEEDBACK_EMAIL_LABEL })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL })).toBeTruthy();
    expect(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeTruthy();
    expect(screen.queryByRole("link", { name: FEEDBACK_MAILTO_LINK })).toBeNull();
  });

  test("信箱選填、暱稱必填，且不畫已刪文案與起頭 chip", () => {
    render(<FeedbackForm available />);
    const nickname = screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL });
    const email = screen.getByRole("textbox", { name: FEEDBACK_EMAIL_LABEL });
    expect(nickname.getAttribute("required")).not.toBeNull();
    expect(email.getAttribute("required")).toBeNull();
    expect(email.getAttribute("name")).toBe("email");
    for (const copy of REMOVED_COPY) {
      expect(document.body.textContent).not.toContain(copy);
    }
    expect(screen.queryByRole("button", { name: "想聽挖土機" })).toBeNull();
  });

  test("unavailable 時仍畫欄位，mailto 只當備援", () => {
    render(<FeedbackForm available={false} />);
    expect(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeTruthy();
    expect(screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeTruthy();
    const link = screen.getByRole("link", { name: FEEDBACK_MAILTO_LINK });
    expect(link.getAttribute("href")).toBe(feedbackMailtoHref());
    expect(document.body.textContent).not.toContain("馬米暫時用 email 收信。");

    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }), {
      target: { value: "小車" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }), {
      target: { value: "想聽下一集" },
    });
    expect(link.getAttribute("href")).toBe(
      feedbackMailtoHref({ nickname: "小車", message: "想聽下一集" }),
    );
  });

  test("蜜罐在 DOM 但不進可及樹", () => {
    render(<FeedbackForm available />);
    const honey = document.querySelector(`input[name="${FEEDBACK_HONEYPOT_FIELD}"]`);
    expect(honey).toBeTruthy();
    expect(honey?.closest("[aria-hidden='true']")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "網站" })).toBeNull();
  });

  test("hydration 後未勾兩項同意時送出鈕 disabled", async () => {
    render(<FeedbackForm available />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL }).hasAttribute("disabled"),
      ).toBe(true);
    });
    expect(document.body.textContent).not.toContain("請先勾選兩項同意，才能送出。");
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
    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_EMAIL_LABEL }), {
      target: { value: "parent@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }), {
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
    fireEvent.change(screen.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }), {
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
