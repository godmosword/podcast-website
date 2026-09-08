// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import FeedbackWallView from "./FeedbackWallView";
import {
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
  test("空牆沒有範例卡，也不寫還沒有公開留言", () => {
    render(<FeedbackWallView messages={[]} />);

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByLabelText("示範留言")).toBeNull();
    expect(document.body.textContent).not.toContain("範例");
    expect(document.body.textContent).not.toContain("還沒有公開留言");
    expect(document.body.textContent).not.toContain("共 0 則");
  });

  test("1 則核准就列真留言", () => {
    render(<FeedbackWallView messages={published(1)} />);

    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getByText("小車")).toBeTruthy();
    expect(screen.getByText("很喜歡垃圾車那集")).toBeTruthy();
    expect(screen.getByText("共 1 則留言")).toBeTruthy();
    expect(screen.queryByLabelText("示範留言")).toBeNull();
  });

  test("空牆 CTA 用 hash 對準表單", () => {
    render(<FeedbackWallView messages={[]} />);
    const cta = screen.getByRole("link", { name: FEEDBACK_EMPTY_CTA });
    expect(cta.getAttribute("href")).toBe(`#${FEEDBACK_MESSAGE_FIELD_ID}`);
  });

  test("多則列出暱稱與正文", () => {
    render(<FeedbackWallView messages={published(3)} />);

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
