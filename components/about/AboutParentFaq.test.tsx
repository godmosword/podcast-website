// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStories } from "@/data/content";
import { parentLandingFacts, parentLandingFaqs } from "@/lib/for-parents";
import AboutParentFaq from "./AboutParentFaq";

vi.stubGlobal("React", React);
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} />
  ),
}));

afterEach(cleanup);

describe("AboutParentFaq", () => {
  it("原本親子指南的事實、常見問題與起手集數都在關於頁", () => {
    render(<AboutParentFaq />);
    const section = screen.getByRole("region", { name: "給家長的常見問題" });

    expect(within(section).getByText(`${getStories().length} 集`)).toBeTruthy();
    expect(within(section).getByText("約 3–7 歲")).toBeTruthy();

    const questions = within(section)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    for (const faq of parentLandingFaqs(parentLandingFacts())) {
      expect(questions).toContain(faq.question);
    }
    expect(questions).toContain("可以先從哪幾集開始？");

    const storyLinks = within(section)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(storyLinks.length).toBeGreaterThanOrEqual(3);
    expect(storyLinks.every((href) => href?.startsWith("/story/"))).toBe(true);
  });

  it("不再說共讀內容集中在親子指南", () => {
    const { container } = render(<AboutParentFaq />);
    expect(container.textContent).not.toContain("親子指南");
    expect(container.textContent).toContain("給爸媽");
  });

  it("舊的 /for-parents#co-listen 轉過來會落在「如何陪孩子一起聽」（有 #co-listen 錨點）", () => {
    const { container } = render(<AboutParentFaq />);
    const anchor = container.querySelector("#co-listen");
    expect(anchor?.querySelector("h3")?.textContent).toBe("如何陪孩子一起聽？");
  });

  it("不誇大：小活動只有部分集數有；起手列先放剛上架的故事", () => {
    const { container } = render(<AboutParentFaq />);
    expect(container.textContent).toContain("部分集數");
    expect(container.textContent).toContain("最前面是剛上架的故事");
    expect(container.textContent).not.toContain("可以先從最新集數");
  });
});
