// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NEWSLETTERS } from "@/data/newsletters";
import { newslettersLayout } from "@/lib/newsletters";
import { ParentArticleList } from "@/components/for-parents/ParentArticleList";
import { ParentArticlesMasthead } from "@/components/for-parents/ParentArticlesMasthead";
import { newsletterPath } from "@/lib/newsletters";
import { NewsletterView } from "./NewsletterView";

vi.stubGlobal("React", React);

const SOURCE_LINKS = [
  ["大阪大學新聞稿：機器人的聲音能提高幼兒的堅持", "https://resou.osaka-u.ac.jp/ja/research/2026/20260715_1"],
  ["Child Development", "https://doi.org/10.1093/chidev/aacag125"],
  ["MIT 新聞：寶寶看大人努力後，自己也會更努力", "https://news.mit.edu/2017/babies-try-harder-seeing-adults-0921"],
  ["Science 2017", "https://www.science.org/doi/10.1126/science.aan2317"],
] as const;

const TITLE = "⏱️ 「你已經試了 20 秒囉」：陪在旁邊說出孩子努力多久，他更願意再撐一下";

afterEach(cleanup);

describe("電子報列表", () => {
  it("顯示這一期的標題、主旨與讀這篇", () => {
    const layout = newslettersLayout();
    render(
      <>
        <ParentArticlesMasthead
          title="電子報"
          count={1}
          latestPublishedAt="2026-10-28"
          longestMinutes={layout.latest?.minutes ?? 1}
          variant="newsletter"
        />
        <ParentArticleList layout={layout} hrefFor={newsletterPath} />
      </>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "電子報" })).toBeTruthy();
    expect(screen.getByText(/1 期 · 最近更新 2026年10月28日/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "在方格子追蹤（另開視窗）" })).toBeNull();

    const feature = screen.getByRole("link", { name: /你已經試了 20 秒囉/ });
    expect(feature.getAttribute("href")).toBe("/newsletter/2026-10-28");
    expect(feature.textContent).toContain("孩子卡關就喊「我不會」？今晚 5 分鐘「計時小幫手」遊戲，陪他多撐一下");
    expect(feature.textContent).toContain("讀這篇");
  });
});

describe("電子報單篇", () => {
  it("標題、今晚就能試的步驟，以及來源連結開新分頁", () => {
    const issue = NEWSLETTERS[0];
    expect(issue).toBeTruthy();
    render(<NewsletterView issue={issue!} />);

    expect(screen.getByRole("heading", { level: 1, name: TITLE })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "今晚就能試" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "來源" })).toBeTruthy();

    const steps = screen.getAllByRole("list").find((list) => list.tagName === "OL");
    expect(steps).toBeTruthy();
    const items = steps!.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toContain("坐在孩子旁邊，先不急著出手幫忙。");
    expect(items[2]?.textContent).toContain("家長可照唸：");
    expect(items[2]?.querySelector("br")).toBeTruthy();
    expect(screen.getByText("3–4 歲").tagName).toBe("STRONG");
    expect(screen.getByText("活動名：").tagName).toBe("STRONG");

    for (const [name, href] of SOURCE_LINKS) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });
});
