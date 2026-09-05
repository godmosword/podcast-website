// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import FeedbackWall from "./FeedbackWall";
import {
  FEEDBACK_DEMO_MESSAGE,
  FEEDBACK_DEMO_NICKNAME,
  FEEDBACK_EMPTY_CTA,
  FEEDBACK_WALL_HEADING,
} from "@/lib/feedback-copy";

vi.stubGlobal("React", React);

const FIXTURE_EMAIL = "secret@example.com";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FeedbackWall", () => {
  test("示範卡不在 role=list 內", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true, messages: [] }),
      }),
    );
    render(<FeedbackWall />);
    await screen.findByText(FEEDBACK_DEMO_NICKNAME);

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByLabelText("示範留言").textContent).toContain(
      FEEDBACK_DEMO_MESSAGE,
    );
  });

  test("API 不可用時不渲染空牆 CTA（避免點了沒有 textarea）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: false, messages: [] }),
      }),
    );
    render(<FeedbackWall />);
    await screen.findByText(FEEDBACK_DEMO_NICKNAME);
    expect(screen.queryByRole("button", { name: FEEDBACK_EMPTY_CTA })).toBeNull();
  });

  test("已核准留言列出暱稱與正文", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          available: true,
          messages: [
            {
              id: 1,
              nickname: "小車",
              message: "很喜歡垃圾車那集",
              createdAt: "2026-09-05T02:00:00.000Z",
            },
          ],
        }),
      }),
    );
    render(<FeedbackWall />);

    await waitFor(() => {
      expect(screen.getByRole("list")).toBeTruthy();
    });
    expect(screen.getByText("小車")).toBeTruthy();
    expect(screen.getByText("很喜歡垃圾車那集")).toBeTruthy();
    expect(screen.getByText(FEEDBACK_WALL_HEADING)).toBeTruthy();
  });

  test("不得渲染 email（即使 API 夾帶多餘欄位）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          available: true,
          messages: [
            {
              id: 2,
              nickname: "Bonbon",
              message: "哈囉",
              createdAt: "2026-09-05T02:00:00.000Z",
              email: FIXTURE_EMAIL,
            },
          ],
        }),
      }),
    );
    render(<FeedbackWall />);

    await waitFor(() => {
      expect(screen.getByText("Bonbon")).toBeTruthy();
    });
    expect(screen.queryByText(FIXTURE_EMAIL)).toBeNull();
    expect(document.body.textContent).not.toContain(FIXTURE_EMAIL);
  });
});
