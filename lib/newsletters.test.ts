import { describe, expect, it, vi } from "vitest";
import { NEWSLETTERS } from "@/data/newsletters";
import { newsletterVisibleText } from "@/lib/newsletter-markdown";
import sitemap from "@/app/sitemap";
import {
  getNewsletter,
  newsletterNeighbors,
  newsletterPath,
  newsletterReadingMinutes,
  newslettersIndexPath,
  newslettersLayout,
} from "./newsletters";

const SLUGS = [
  "2026-10-09",
  "2026-10-13",
  "2026-10-16",
  "2026-10-20",
  "2026-10-23",
  "2026-10-28",
  "2026-10-30",
  "2026-11-03",
  "2026-11-06",
] as const;

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
  it("九期依日期由舊到新排，路徑用期別日期", () => {
    expect(NEWSLETTERS.map((issue) => issue.slug)).toEqual([...SLUGS]);
    for (const issue of NEWSLETTERS) {
      expect(issue.publishedAt).toBe(issue.slug);
      expect(getNewsletter(issue.slug)).toBe(issue);
      expect(newsletterPath(issue.slug)).toBe(`/newsletter/${issue.slug}`);
    }
    expect(newslettersIndexPath()).toBe("/newsletter");
    expect(getNewsletter("2026-10-28")?.title).toBe(
      "⏱️ 「你已經試了 20 秒囉」：陪在旁邊說出孩子努力多久，他更願意再撐一下",
    );
    expect(getNewsletter("2026-10-28")?.description).toBe(
      "孩子卡關就喊「我不會」？今晚 5 分鐘「計時小幫手」遊戲，陪他多撐一下",
    );
    expect(getNewsletter("2026-11-06")?.title).toBe(
      "🧩 「他看影片明明很專心」：孩子跟你一起拼、一起讀的時候，大腦更投入",
    );
    expect(getNewsletter("2026-11-06")?.description).toBe(
      "孩子看影片很安靜，一起玩真的比較好嗎？今晚 8 分鐘「拼圖小司機」，陪他拼一拼",
    );
  });

  it("原稿標記拿掉之後，看得見的字一個都沒少", () => {
    for (const issue of NEWSLETTERS) {
      expect(newsletterVisibleText(issue.body).replace(/\s/g, "")).toBe(
        manuscriptChars(issue.body),
      );
    }
  });

  it("來源連結都留在原稿裡，10/28 主題是審過的口語版", () => {
    for (const issue of NEWSLETTERS) {
      const hrefs = [...issue.body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map(
        (match) => match[1],
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) expect(issue.body).toContain(href);
    }
    const body = getNewsletter("2026-10-28")?.body ?? "";
    for (const href of SOURCE_LINKS) {
      expect(body).toContain(href);
    }
    expect(body).toContain(
      "孩子卡關喊「我不會啦！」的時候，先別急著出手。坐到他旁邊，說一句「你已經試了 20 秒囉」。",
    );
    expect(body).not.toContain("五歲的小宇");
    expect(body).not.toContain("今年七月");
    expect(getNewsletter("2026-10-30")?.body).toContain(
      "不硬推、也不一直幫他躲，一小步就好。",
    );
    expect(getNewsletter("2026-11-03")?.body).toContain(
      "先別急著給答案，陪他猜一猜、試一試。",
    );
    expect(getNewsletter("2026-11-06")?.body).toContain(
      "他看影片很專心，但跟你玩時，大腦更投入。",
    );
  });

  it("列表封面是 11/06，其餘依月份由新到舊", () => {
    const layout = newslettersLayout();
    const latest = getNewsletter("2026-11-06");
    expect(layout.latest?.slug).toBe("2026-11-06");
    expect(layout.latest?.excerpt).toBe(latest?.description);
    expect(layout.latest?.minutes).toBeGreaterThanOrEqual(1);
    expect(layout.series).toEqual([]);
    expect(layout.months.map((month) => month.key)).toEqual(["2026-11", "2026-10"]);
    expect(layout.months[0]?.articles.map((article) => article.slug)).toEqual([
      "2026-11-03",
    ]);
    expect(layout.months[1]?.articles.map((article) => article.slug)).toEqual([
      "2026-10-30",
      "2026-10-28",
      "2026-10-23",
      "2026-10-20",
      "2026-10-16",
      "2026-10-13",
      "2026-10-09",
    ]);
    expect(newsletterReadingMinutes(latest!)).toBe(layout.latest?.minutes);
  });

  it("上一期是較早的，下一期是較新的", () => {
    expect(newsletterNeighbors("2026-10-09")).toMatchObject({
      previous: null,
      next: { slug: "2026-10-13" },
    });
    expect(newsletterNeighbors("2026-10-23")).toMatchObject({
      previous: { slug: "2026-10-20" },
      next: { slug: "2026-10-28" },
    });
    expect(newsletterNeighbors("2026-10-28")).toMatchObject({
      previous: { slug: "2026-10-23" },
      next: { slug: "2026-10-30" },
    });
    expect(newsletterNeighbors("2026-11-06")).toMatchObject({
      previous: { slug: "2026-11-03" },
      next: null,
    });
  });

  it("sitemap 有列表與每一期", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://example.com/newsletter");
    for (const slug of SLUGS) {
      const url = `https://example.com/newsletter/${slug}`;
      expect(urls).toContain(url);
      expect(entries.find((entry) => entry.url === url)?.lastModified).toBe(slug);
    }
    vi.unstubAllEnvs();
  });
});
