// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParentArticle } from "@/data/parent-articles";
import ParentTravelAbroadPage from "@/app/for-parents/overseas-travel/page";
import { getTravelAbroadArticle, travelAbroadArticlePath } from "@/lib/parent-travel-abroad";
import { pinnedVocusExcerpt } from "../../scripts/lib/vocus-article-excerpts";
import { ParentArticleView } from "./ParentArticleView";
import { ParentSectionArticleList } from "./ParentSectionArticleList";
import { ParentSectionPage } from "./ParentSectionPage";

vi.stubGlobal("React", React);

vi.mock("next/image", () => ({
  default: ({
    alt,
    width,
    height,
  }: {
    alt: string;
    width?: number;
    height?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} width={width} height={height} />
  ),
}));

afterEach(cleanup);

const fixture: ParentArticle = {
  slug: "fixture-trip",
  title: "測試用出國文章",
  publishedAt: "2026-10-29",
  sourceUrl: "https://vocus.cc/post/fixturetripfixturetrip01",
  excerpt: "這篇只存在測試裡。",
  blocks: [{ type: "paragraph", text: "這篇只存在測試裡。" }],
};

describe("國外旅遊列表", () => {
  it("測試文章出現在列表上", () => {
    render(
      <ParentSectionArticleList articles={[fixture]} hrefFor={travelAbroadArticlePath} />,
    );
    const link = screen.getByRole("link", { name: /測試用出國文章/ });
    expect(link.getAttribute("href")).toBe("/for-parents/overseas-travel/fixture-trip");
    expect(screen.getByText("2026年10月29日")).toBeTruthy();
    expect(screen.getByText("這篇只存在測試裡。")).toBeTruthy();
  });

  it("即使有封面，列表卡片也不顯示首圖", () => {
    render(
      <ParentSectionArticleList
        articles={[
          {
            ...fixture,
            coverImage: "/parent-articles/vocus-6ae34027fd897800012f3e51-cover.webp",
            coverAlt: "小松 PC4000 大型怪手前，大人與小孩的背影",
            coverWidth: 1600,
            coverHeight: 2133,
          },
        ]}
        hrefFor={travelAbroadArticlePath}
      />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByAltText("小松 PC4000 大型怪手前，大人與小孩的背影")).toBeNull();
    expect(screen.getByRole("link", { name: /測試用出國文章/ }).getAttribute("href")).toBe(
      "/for-parents/overseas-travel/fixture-trip",
    );
    expect(screen.getByText("2026年10月29日")).toBeTruthy();
    expect(screen.getByText("這篇只存在測試裡。")).toBeTruthy();
  });

  it("內頁回到國外旅遊", () => {
    render(
      <ParentArticleView
        article={fixture}
        previous={null}
        next={null}
        indexHref="/for-parents/overseas-travel"
        indexLabel="回到國外旅遊"
        hrefFor={travelAbroadArticlePath}
      />,
    );
    expect(screen.getByRole("link", { name: "回到國外旅遊" }).getAttribute("href")).toBe(
      "/for-parents/overseas-travel",
    );
    expect(screen.queryByText("同步更新至親子出國專欄")).toBeNull();
  });

  it("有原圖寬高的封面完整顯示，沒有寬高的封面維持 16:9", () => {
    const { rerender } = render(
      <ParentArticleView
        article={{
          ...fixture,
          coverImage: "/parent-articles/full.webp",
          coverAlt: "完整照片",
          coverWidth: 1600,
          coverHeight: 2133,
        }}
        previous={null}
        next={null}
      />,
    );
    const natural = screen.getByRole("figure");
    expect(natural.className).toContain("heroNatural");
    const full = screen.getByAltText("完整照片");
    expect(full.getAttribute("width")).toBe("1600");
    expect(full.getAttribute("height")).toBe("2133");

    rerender(
      <ParentArticleView
        article={{
          ...fixture,
          coverImage: "/parent-articles/wide.webp",
          coverAlt: "橫式封面",
        }}
        previous={null}
        next={null}
      />,
    );
    const cropped = screen.getByRole("figure");
    expect(cropped.className).toContain("hero");
    expect(cropped.className).not.toContain("heroNatural");
    expect(screen.getByAltText("橫式封面").getAttribute("width")).toBeNull();
  });

  it("沒有文章時仍是整理中", () => {
    render(<ParentSectionPage title="國內旅遊" />);
    expect(screen.getByRole("heading", { name: "國內旅遊" })).toBeTruthy();
    expect(screen.getByText("這一區的內容還在整理。")).toBeTruthy();
  });

  it("小松那篇出現在親子出國列表，標記沒有留在頁面上", () => {
    render(<ParentTravelAbroadPage />);
    expect(screen.getByRole("heading", { name: "國外旅遊" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /小松之杜/ })).toBeTruthy();
    const komatsuExcerpt = pinnedVocusExcerpt("vocus-6ae34027fd897800012f3e51");
    expect(komatsuExcerpt).toBeTruthy();
    expect(screen.getByText(komatsuExcerpt ?? "")).toBeTruthy();
    expect(
      screen.queryByText("這次名古屋北陸之旅帶孩子到了小松，參觀了當地非常有名的小松之杜。"),
    ).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByAltText("小松 PC4000 大型怪手前，大人與小孩的背影")).toBeNull();
    expect(screen.queryByText("這一區的內容還在整理。")).toBeNull();
    expect(screen.queryByText("同步更新至親子出國專欄")).toBeNull();
  });

  it("小松內頁正文仍是原文，列表摘要不出現在內文", () => {
    const article = getTravelAbroadArticle("vocus-6ae34027fd897800012f3e51");
    expect(article).toBeDefined();
    if (!article) return;
    render(
      <ParentArticleView
        article={article}
        previous={null}
        next={null}
        indexHref="/for-parents/overseas-travel"
        indexLabel="回到國外旅遊"
        hrefFor={travelAbroadArticlePath}
      />,
    );
    expect(
      screen.getByText("這次名古屋北陸之旅帶孩子到了小松，參觀了當地非常有名的小松之杜。"),
    ).toBeTruthy();
    expect(screen.getByText("車車遊樂園又解鎖了一種特殊車子囉！")).toBeTruthy();
    expect(screen.queryByText(article.excerpt)).toBeNull();
  });
});
