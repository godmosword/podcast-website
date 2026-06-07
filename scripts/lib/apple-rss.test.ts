import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cleanEpisodeSummary,
  formatItunesDuration,
  parseRssEpisodes,
  pubDateToIsoDate,
  slugForEpisode,
  stripHtml,
} from "./apple-rss";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/sample-rss.xml",
);

describe("parseRssEpisodes", () => {
  it("解析 item 的 guid、標題、集數、音檔與封面", () => {
    const xml = fs.readFileSync(fixturePath, "utf8");
    const episodes = parseRssEpisodes(xml);
    expect(episodes.length).toBe(2);

    const ep7 = episodes.find((e) => e.guid === "ep-7-guid");
    expect(ep7).toBeDefined();
    expect(ep7?.title).toBe("EP7 消防車出動");
    expect(ep7?.episode).toBe(7);
    expect(ep7?.audioUrl).toContain("ep7.mp3");
    expect(ep7?.imageUrl).toBe("https://example.com/ep7.jpg");
    expect(ep7?.duration).toBe("5:48");
  });
});

describe("stripHtml", () => {
  it("移除 HTML 標籤", () => {
    expect(stripHtml("<p>你好 <b>世界</b></p>")).toBe("你好 世界");
  });
});

describe("cleanEpisodeSummary", () => {
  it("移除 SoundOn 託管尾註", () => {
    const raw =
      "遇到高鐵晚到延遲怎麼辦呢？Bonbon和馬米學會冷靜。 這篇為真實故事改編，很謝謝您的收聽。 -- Hosting provided by SoundOn";
    expect(cleanEpisodeSummary(raw)).toBe(
      "遇到高鐵晚到延遲怎麼辦呢？Bonbon和馬米學會冷靜。",
    );
  });

  it("移除節目宣傳段與社群連結", () => {
    const raw =
      "大聲又勇敢的怪獸卡車，完成月光森林任務。 喜歡《車車遊樂園》，歡迎留言。孩子許願想聽的故事 🚗IG https://instagram.com/x";
    expect(cleanEpisodeSummary(raw)).toBe(
      "大聲又勇敢的怪獸卡車，完成月光森林任務。",
    );
  });

  it("解碼 HTML 實體", () => {
    expect(cleanEpisodeSummary("A &amp; B 喜歡《車車遊樂園》尾註")).toBe("A & B");
  });
});

describe("pubDateToIsoDate", () => {
  it("轉成 YYYY-MM-DD", () => {
    expect(pubDateToIsoDate("Wed, 04 Jun 2026 08:00:00 GMT")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatItunesDuration", () => {
  it("秒數轉 mm:ss", () => {
    expect(formatItunesDuration(348)).toBe("5:48");
  });

  it("保留 MM:SS 字串", () => {
    expect(formatItunesDuration("5:48")).toBe("5:48");
  });
});

describe("slugForEpisode", () => {
  it("產生 ep-N slug", () => {
    expect(slugForEpisode(7)).toBe("ep-7");
  });
});
