// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParentArticle } from "@/data/parent-articles";
import { parentArticlesLayout } from "@/lib/parent-articles";
import { ParentArticleList } from "./ParentArticleList";
import { ParentArticlesMasthead } from "./ParentArticlesMasthead";

vi.stubGlobal("React", React);

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} />
  ),
}));

function article(slug: string, publishedAt: string, excerpt = "第一行\n第二行"): ParentArticle {
  return {
    slug,
    title: `標題 ${slug}`,
    publishedAt,
    sourceUrl: `https://vocus.cc/post/${slug}`,
    excerpt,
    blocks: [{ type: "paragraph", text: excerpt }],
  };
}

afterEach(cleanup);

describe("ParentArticleList", () => {
  it("線上資料：最新一篇是封面故事，視力三篇照順序，沒有「更多文章」", () => {
    render(<ParentArticleList layout={parentArticlesLayout()} />);

    const feature = screen.getByRole("link", { name: /當孩子的情緒像小火山爆發時/ });
    expect(feature.getAttribute("href")).toBe(
      "/for-parents/articles/vocus-6ad06360fd89780001c70f77",
    );
    expect(within(feature).getByText("最新")).toBeTruthy();
    expect(within(feature).getByText("讀這篇")).toBeTruthy();
    expect(feature.textContent).toContain("約 1 分鐘");

    const series = screen.getByRole("region", { name: "注意孩子的視力" });
    const parts = within(series).getAllByRole("link");
    expect(parts.map((link) => link.getAttribute("href"))).toEqual([
      "/for-parents/articles/vision-care-1",
      "/for-parents/articles/vision-care-2",
      "/for-parents/articles/vision-care-3",
    ]);
    expect(within(series).getByText("3 篇 · 2026年9月12日 · 建議從第 1 篇讀起")).toBeTruthy();

    expect(screen.queryByRole("heading", { name: "更多文章" })).toBeNull();
  });

  it("封面故事最多放摘要前 3 行", () => {
    const layout = parentArticlesLayout(
      [article("long", "2026-05-01", "一\n二\n三\n四\n五")],
      [],
    );
    render(<ParentArticleList layout={layout} />);
    const feature = screen.getByRole("link", { name: /標題 long/ });
    expect(feature.textContent).toContain("三");
    expect(feature.textContent).not.toContain("四");
  });

  it("其他文章依月份列在「更多文章」，每篇只出現一次", () => {
    const layout = parentArticlesLayout(
      [
        article("jan", "2026-01-05"),
        article("feb", "2026-02-10"),
        article("newest", "2026-03-01"),
      ],
      [],
    );
    render(<ParentArticleList layout={layout} />);

    const more = screen.getByRole("region", { name: "更多文章" });
    expect(within(more).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "2026 年 2 月",
      "2026 年 1 月",
    ]);
    expect(within(more).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/for-parents/articles/feb",
      "/for-parents/articles/jan",
    ]);
    expect(screen.getAllByRole("link", { name: /標題 newest/ })).toHaveLength(1);
  });

  it("沒有文章時不渲染任何區塊", () => {
    const { container } = render(
      <ParentArticleList layout={parentArticlesLayout([], [])} />,
    );
    expect(container.textContent).toBe("");
  });
});

describe("ParentArticlesMasthead", () => {
  it("署名、篇數、最近更新與方格子連結", () => {
    render(
      <ParentArticlesMasthead
        title="育兒文章分享"
        count={4}
        latestPublishedAt="2026-10-15"
        longestMinutes={1}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "育兒文章分享" })).toBeTruthy();
    expect(screen.getByText("馬米寫給爸媽的育兒心得，每篇約一分鐘讀完。")).toBeTruthy();
    expect(screen.getByText(/4 篇 · 最近更新 2026年10月15日/)).toBeTruthy();
    const vocus = screen.getByRole("link", { name: "在方格子追蹤（另開視窗）" });
    expect(vocus.getAttribute("href")).toBe(
      "https://vocus.cc/user/6aa4a7adaa92714642f625a3",
    );
    expect(vocus.getAttribute("target")).toBe("_blank");
    expect(vocus.getAttribute("rel")).toContain("noopener");
  });

  it("有篇幅較長的文章時改說幾分鐘內讀完；沒有文章時不寫最近更新", () => {
    render(
      <ParentArticlesMasthead
        title="育兒文章分享"
        count={0}
        latestPublishedAt={null}
        longestMinutes={4}
      />,
    );
    expect(screen.getByText("馬米寫給爸媽的育兒心得，每篇 4 分鐘內讀完。")).toBeTruthy();
    expect(screen.queryByText(/最近更新/)).toBeNull();
  });
});
