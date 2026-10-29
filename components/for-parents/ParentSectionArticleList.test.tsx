// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParentArticleView } from "./ParentArticleView";
import { ParentSectionArticleList } from "./ParentSectionArticleList";
import { ParentSectionPage } from "./ParentSectionPage";
import {
  getTravelAbroadArticle,
  listTravelAbroadArticlesByRecency,
  travelAbroadArticlePath,
  travelAbroadIndexPath,
} from "@/lib/parent-travel-abroad";

vi.stubGlobal("React", React);

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} />
  ),
}));

afterEach(cleanup);

describe("親子出國列表", () => {
  it("範例文在列表上，標記沒有畫出來", () => {
    render(
      <ParentSectionArticleList
        articles={listTravelAbroadArticlesByRecency()}
        hrefFor={travelAbroadArticlePath}
      />,
    );
    const link = screen.getByRole("link", { name: /親子出國專欄範例/ });
    expect(link.getAttribute("href")).toBe("/for-parents/travel-abroad/travel-abroad-sample");
    expect(screen.getByText("2026年10月29日")).toBeTruthy();
    expect(screen.queryByText("同步更新至親子出國專欄")).toBeNull();
  });

  it("內頁回到親子出國，內文沒有標記", () => {
    const article = getTravelAbroadArticle("travel-abroad-sample");
    expect(article).toBeDefined();
    if (!article) return;
    render(
      <ParentArticleView
        article={article}
        previous={null}
        next={null}
        indexHref={travelAbroadIndexPath()}
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
});
