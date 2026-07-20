// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StoryProgressBadge from "./StoryProgressBadge";
import { useCompletedStories } from "@/hooks/useCompletedStories";

vi.mock("@/hooks/useCompletedStories", () => ({
  useCompletedStories: vi.fn(),
}));

const mockCompleted = vi.mocked(useCompletedStories);

describe("StoryProgressBadge", () => {
  beforeEach(() => {
    mockCompleted.mockReset();
  });

  it("未聽完不渲染任何節點", () => {
    mockCompleted.mockReturnValue(new Set());
    const { container } = render(<StoryProgressBadge slug="ep-1" />);
    expect(container.textContent).toBe("");
  });

  it("別集聽完不影響本集", () => {
    mockCompleted.mockReturnValue(new Set(["ep-2"]));
    const { container } = render(<StoryProgressBadge slug="ep-1" />);
    expect(container.textContent).toBe("");
  });

  it("已聽完顯示星章", () => {
    mockCompleted.mockReturnValue(new Set(["ep-1"]));
    render(<StoryProgressBadge slug="ep-1" />);
    expect(screen.getByRole("img", { name: "已聽完" }).textContent).toBe("⭐");
  });

  it("aria-label 與宇宙地圖星章一致（同一語彙）", () => {
    mockCompleted.mockReturnValue(new Set(["ep-1"]));
    const { container } = render(<StoryProgressBadge slug="ep-1" />);
    const badge = container.querySelector('[role="img"]');
    // ZoneSheet.tsx 的已聽完星章使用相同 aria-label；兩處若分歧即為語彙裂解
    expect(badge?.getAttribute("aria-label")).toBe("已聽完");
  });
});
