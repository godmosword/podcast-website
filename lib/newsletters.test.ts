import { describe, expect, it, vi } from "vitest";
import { NEWSLETTERS } from "@/data/newsletters";
import { newsletterVisibleText } from "@/lib/newsletter-markdown";
import sitemap from "@/app/sitemap";
import {
  getNewsletter,
  newsletterPath,
  newsletterReadingMinutes,
  newslettersIndexPath,
  newslettersLayout,
} from "./newsletters";

const SOURCE_LINKS = [
  "https://resou.osaka-u.ac.jp/ja/research/2026/20260715_1",
  "https://doi.org/10.1093/chidev/aacag125",
  "https://news.mit.edu/2017/babies-try-harder-seeing-adults-0921",
  "https://www.science.org/doi/10.1126/science.aan2317",
] as const;

/** 拿掉標記後的原文，跟渲染結果對字，不走同一支 parser。 */
function manuscriptChars(markdown: string): string {
  return markdown
    .replace(/<callout[^>]*>/g, "")
    .replace(/<\/callout>/g, "")
    .replace(/<br\s*\/?>/g, "")
    .replace(/<\/?b>/g, "")
    .replace(/^#{1,6} /gm, "")
    .replace(/^\d+\. /gm, "")
    .replace(/^- /gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s/g, "");
}

describe("newsletters", () => {
  it("第一期標題、日期、主旨與路徑", () => {
    const issue = NEWSLETTERS[0];
    expect(issue?.slug).toBe("2026-10-28");
    expect(issue?.publishedAt).toBe("2026-10-28");
    expect(issue?.title).toBe(
      "⏱️ 「你已經試了 20 秒囉」：陪在旁邊說出孩子努力多久，他更願意再撐一下",
    );
    expect(issue?.description).toBe(
      "孩子卡關就喊「我不會」？今晚 5 分鐘「計時小幫手」遊戲，陪他多撐一下",
    );
    expect(getNewsletter("2026-10-28")?.slug).toBe("2026-10-28");
    expect(newslettersIndexPath()).toBe("/newsletter");
    expect(newsletterPath("2026-10-28")).toBe("/newsletter/2026-10-28");
  });

  it("原稿標記拿掉之後，看得見的字一個都沒少", () => {
    const issue = NEWSLETTERS[0];
    expect(issue).toBeTruthy();
    expect(newsletterVisibleText(issue!.body).replace(/\s/g, "")).toBe(
      manuscriptChars(issue!.body),
    );
  });

  it("來源四個連結都在原稿裡，主題是審過的精簡稿", () => {
    const body = NEWSLETTERS[0]?.body ?? "";
    for (const href of SOURCE_LINKS) {
      expect(body).toContain(href);
    }
    expect(body).toContain(
      "孩子卡關喊「我不會啦！」時，先別急著幫忙，坐到他旁邊說「你已經試了 20 秒囉」。",
    );
    expect(body).not.toContain("五歲的小宇");
    expect(body).not.toContain("今年七月");
  });

  it("列表只把這一期放在封面，沒有系列也沒有更多文章", () => {
    const layout = newslettersLayout();
    expect(layout.latest?.slug).toBe("2026-10-28");
    expect(layout.latest?.excerpt).toBe(NEWSLETTERS[0]?.description);
    expect(layout.latest?.minutes).toBeGreaterThanOrEqual(1);
    expect(layout.series).toEqual([]);
    expect(layout.months).toEqual([]);
    expect(newsletterReadingMinutes(NEWSLETTERS[0]!)).toBe(layout.latest?.minutes);
  });

  it("sitemap 有列表與這一期", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://example.com/newsletter");
    expect(urls).toContain("https://example.com/newsletter/2026-10-28");
    const issue = sitemap().find(
      (entry) => entry.url === "https://example.com/newsletter/2026-10-28",
    );
    expect(issue?.lastModified).toBe("2026-10-28");
    vi.unstubAllEnvs();
  });
});
