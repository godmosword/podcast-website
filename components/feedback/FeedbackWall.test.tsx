// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import FeedbackWallView from "./FeedbackWallView";
import {
  FEEDBACK_DEMO_MESSAGE,
  FEEDBACK_DEMO_NICKNAME,
  FEEDBACK_EMPTY_CTA,
  FEEDBACK_MESSAGE_FIELD_ID,
  FEEDBACK_WALL_HEADING,
} from "@/lib/feedback-copy";

const FIXTURE_EMAIL = "secret@example.com";

afterEach(() => {
  cleanup();
});

function published(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nickname: index === 0 ? "小車" : `孩子${index + 1}`,
    message: index === 0 ? "很喜歡垃圾車那集" : `留言 ${index + 1}`,
    createdAt: "2026-09-05T02:00:00.000Z",
  }));
}

describe("FeedbackWallView", () => {
  test("示範卡不在 role=list 內，也不寫還沒有公開留言", () => {
    render(<FeedbackWallView messages={[]} available />);

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByLabelText("示範留言").textContent).toContain(FEEDBACK_DEMO_MESSAGE);
    expect(screen.getByText(FEEDBACK_DEMO_NICKNAME)).toBeTruthy();
    expect(document.body.textContent).not.toContain("還沒有公開留言");
    expect(document.body.textContent).not.toContain("共 0 則");
  });

  test("1–2 則核准仍只示範、不列真留言", () => {
    render(<FeedbackWallView messages={published(2)} available />);

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByText("小車")).toBeNull();
    expect(screen.getByLabelText("示範留言")).toBeTruthy();
    expect(document.body.textContent).not.toContain("共 2 則");
  });

  test("不可用時不渲染空牆 CTA", () => {
    render(<FeedbackWallView messages={[]} available={false} />);
    expect(screen.queryByRole("link", { name: FEEDBACK_EMPTY_CTA })).toBeNull();
  });

  test("可用時空牆 CTA 用 hash 對準表單", () => {
    render(<FeedbackWallView messages={[]} available />);
    const cta = screen.getByRole("link", { name: FEEDBACK_EMPTY_CTA });
    expect(cta.getAttribute("href")).toBe(`#${FEEDBACK_MESSAGE_FIELD_ID}`);
  });

  test("≥3 則列出暱稱與正文，不再顯示示範卡", () => {
    render(<FeedbackWallView messages={published(3)} available />);

    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getByText("小車")).toBeTruthy();
    expect(screen.getByText("很喜歡垃圾車那集")).toBeTruthy();
    expect(screen.getByText(FEEDBACK_WALL_HEADING)).toBeTruthy();
    expect(screen.getByText("共 3 則留言")).toBeTruthy();
    expect(screen.queryByLabelText("示範留言")).toBeNull();
  });

  test("不得渲染 email（即使 DTO 夾帶多餘欄位）", () => {
    render(
      <FeedbackWallView
        available
        messages={[
          {
            id: 2,
            nickname: "Bonbon",
            message: "哈囉",
            createdAt: "2026-09-05T02:00:00.000Z",
            email: FIXTURE_EMAIL,
          } as never,
          ...published(2).map((item, index) => ({ ...item, id: index + 10 })),
        ]}
      />,
    );

    expect(screen.getByText("Bonbon")).toBeTruthy();
    expect(screen.queryByText(FIXTURE_EMAIL)).toBeNull();
    expect(document.body.textContent).not.toContain(FIXTURE_EMAIL);
  });
});
