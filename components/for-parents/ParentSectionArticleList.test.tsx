// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParentArticle } from "@/data/parent-articles";
import ParentTravelAbroadPage from "@/app/for-parents/travel-abroad/page";
import { listTravelAbroadArticles, travelAbroadArticlePath } from "@/lib/parent-travel-abroad";
import { ParentArticleView } from "./ParentArticleView";
import { ParentSectionArticleList } from "./ParentSectionArticleList";
import { ParentSectionPage } from "./ParentSectionPage";

vi.stubGlobal("React", React);

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} />
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

describe("親子出國列表", () => {
  it("測試文章出現在列表上", () => {
    render(
      <ParentSectionArticleList articles={[fixture]} hrefFor={travelAbroadArticlePath} />,
    );
    const link = screen.getByRole("link", { name: /測試用出國文章/ });
    expect(link.getAttribute("href")).toBe("/for-parents/travel-abroad/fixture-trip");
    expect(screen.getByText("2026年10月29日")).toBeTruthy();
    expect(screen.getByText("這篇只存在測試裡。")).toBeTruthy();
  });

  it("內頁回到親子出國", () => {
    render(
      <ParentArticleView
        article={fixture}
        previous={null}
        next={null}
        indexHref="/for-parents/travel-abroad"
        indexLabel="回到親子出國"
        hrefFor={travelAbroadArticlePath}
      />,
    );
    expect(screen.getByRole("link", { name: "回到親子出國" }).getAttribute("href")).toBe(
      "/for-parents/travel-abroad",
    );
    expect(screen.queryByText("同步更新至親子出國專欄")).toBeNull();
  });

  it("沒有文章時仍是整理中", () => {
    render(<ParentSectionPage title="國內旅遊" />);
    expect(screen.getByRole("heading", { name: "國內旅遊" })).toBeTruthy();
    expect(screen.getByText("這一區的內容還在整理。")).toBeTruthy();
  });

  it("正式資料是空的時，親子出國頁回到整理中", () => {
    expect(listTravelAbroadArticles()).toEqual([]);
    render(<ParentTravelAbroadPage />);
    expect(screen.getByRole("heading", { name: "親子出國" })).toBeTruthy();
    expect(screen.getByText("這一區的內容還在整理。")).toBeTruthy();
    expect(screen.queryByText("測試用出國文章")).toBeNull();
  });
});
