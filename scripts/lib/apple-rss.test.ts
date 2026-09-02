import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cleanEpisodeSummary,
  EPISODE_SUMMARY_MAX_LEN,
  formatItunesDuration,
  parseRssEpisodes,
  pubDateToIsoDate,
  slugForEpisode,
  stripHtml,
} from "./apple-rss";

const appleSyncedPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/apple-synced.json",
);

type AppleSyncedEpisode = { slug: string; summary: string; ep: number; title: string };

function loadAppleSynced(): AppleSyncedEpisode[] {
  return JSON.parse(fs.readFileSync(appleSyncedPath, "utf8")) as AppleSyncedEpisode[];
}

function findSummary(slug: string): string {
  const ep = loadAppleSynced().find((e) => e.slug === slug);
  if (!ep) throw new Error(`apple-synced.json 找不到 ${slug}`);
  return ep.summary;
}

/** 以 Unicode code point 計長度（與 cleanEpisodeSummary 裁切邏輯一致）。 */
function unicodeLen(text: string): number {
  return Array.from(text).length;
}

const PROMO_PATTERN = /歡迎留言|五星|linktr|IG|馬米是非專業|也可許願|http/i;

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
    expect(ep7?.keywords).toEqual(["睡前故事", "高鐵故事", "冷靜"]);
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

  const EP27_RSS_DUMP =
    "今天是金龜車小紅豆開學的第一天，小紅豆要挑戰去幼兒園的三個任務！想媽媽的時候，就抱抱心愛的小鹿被被。陪孩子認識上學的樂趣，回家後也和爸爸媽媽分享今天在學校發生的事 👶回想Bonbon也有不想去上學的時候，很謝謝老師的引導以及讓他帶心愛的玩偶被子上學陪伴 🫶🏻這集的構想很謝謝拉拉媽媽的留言與支持，祝福你們一切順心、每天都開開心心哦 歡迎大家留言或是IG跟我們說育兒的路上遇到什麼有趣或頭疼的事？也許下一集就會在《車車遊樂園》裡，聽見你們家的故事囉。馬米是非專業錄音者，但每集都是花很多心力製作故事給孩子們聽，你的五星留言好評，對我們是最大的支持，謝謝你 🚗車車遊樂園 htt ps://linktr.ee/bonboncarstory";

  it("ep-27 dump：劇情前兩句保留、宣傳尾段全切、Unicode ≤上限", () => {
    const expected =
      "今天是金龜車小紅豆開學的第一天，小紅豆要挑戰去幼兒園的三個任務！想媽媽的時候，就抱抱心愛的小鹿被被。";
    const result = cleanEpisodeSummary(EP27_RSS_DUMP);
    expect(result).toBe(expected);
    expect(unicodeLen(result!)).toBeLessThanOrEqual(EPISODE_SUMMARY_MAX_LEN);
    expect(result).not.toMatch(PROMO_PATTERN);
    expect(result).not.toContain("👶");
  });

  it("ep-13：👶Bonbon 家長註切掉、劇情保留", () => {
    const raw = findSummary("ep-13");
    const result = cleanEpisodeSummary(raw);
    expect(result).toBe(
      "酷酷的阿酷鑽地車，會幫忙挖地修水管、還會幫忙攪麵糊，做出香噴噴的甜甜圈。小車車們也學會了， 認識一個人不能只有看外表。",
    );
    expect(result).not.toContain("👶");
    expect(result).not.toContain("Bonbon");
  });

  it("ep-8 乾淨對照：句界回退切在上限內最後句號、無 promo", () => {
    const raw =
      "大聲又勇敢的怪獸卡車 Monster Truck 猛猛，這次要學會輕輕開、放慢速度，顧及螢火蟲跟別人的感受，完成一場溫柔的月光森林任務。適合親共聽、情緒教育、睡前故事。";
    const result = cleanEpisodeSummary(raw);
    expect(result).toBe(
      "大聲又勇敢的怪獸卡車 Monster Truck 猛猛，這次要學會輕輕開、放慢速度，顧及螢火蟲跟別人的感受，完成一場溫柔的月光森林任務。",
    );
    expect(unicodeLen(result!)).toBeLessThanOrEqual(EPISODE_SUMMARY_MAX_LEN);
    expect(result).not.toMatch(PROMO_PATTERN);
  });

  it("URL 空格變形：htt ps／linktr 整段移除", () => {
    const raw =
      "劇情開頭正文 🚗車車遊樂園 htt ps://linktr.ee/bonboncarstory";
    const result = cleanEpisodeSummary(raw);
    expect(result).toBeDefined();
    expect(result).not.toMatch(/http/i);
    expect(result).not.toMatch(/linktr/i);
    expect(result).not.toMatch(/htt\s*ps/i);
  });

  it("空字串回傳 undefined", () => {
    expect(cleanEpisodeSummary("")).toBeUndefined();
    expect(cleanEpisodeSummary("   ")).toBeUndefined();
  });

  it("冪等：二次 clean 與首次結果相同（ep-27 dump）", () => {
    const once = cleanEpisodeSummary(EP27_RSS_DUMP);
    expect(once).toBeDefined();
    const twice = cleanEpisodeSummary(once!);
    expect(twice).toBe(once);
  });

  it("false-positive：ep-12 劇情 🫶🏻 不得從 emoji 切斷", () => {
    const raw = findSummary("ep-12");
    const result = cleanEpisodeSummary(raw);
    expect(result).toContain("小藍巴士");
    expect(result).not.toContain("👶");
  });

  it("apple-synced 全量 summary 經 cleaner 後不含 promo、👶、且 ≤上限", () => {
    for (const ep of loadAppleSynced()) {
      const result = cleanEpisodeSummary(ep.summary);
      expect(result, `${ep.slug} 不應為空`).toBeDefined();
      expect(unicodeLen(result!), `${ep.slug} 超過 ${EPISODE_SUMMARY_MAX_LEN} 字`).toBeLessThanOrEqual(
        EPISODE_SUMMARY_MAX_LEN,
      );
      expect(result, `${ep.slug} 含 promo`).not.toMatch(PROMO_PATTERN);
      expect(result, `${ep.slug} 含 👶`).not.toContain("👶");
    }
  });

  it("apple-synced.json 儲存值本身已是清洗結果，且 slug 唯一、必要欄位完整", () => {
    const episodes = loadAppleSynced();
    expect(episodes.length, "apple-synced 至少應有 21 筆歷史集數").toBeGreaterThanOrEqual(21);

    const slugs = episodes.map((ep) => ep.slug);
    expect(new Set(slugs).size, "slug 不得重複").toBe(slugs.length);

    for (const ep of episodes) {
      expect(ep.slug, `${ep.slug} slug 不得為空`).toBeTruthy();
      expect(ep.summary, `${ep.slug} summary 不得為空`).toBeTruthy();
      expect(ep.ep, `${ep.slug} ep 不得為空`).toBeGreaterThan(0);
      expect(ep.title, `${ep.slug} title 不得為空`).toBeTruthy();
      expect(ep.summary, `${ep.slug} 儲存值應冪等`).toBe(cleanEpisodeSummary(ep.summary));
      expect(ep.summary, `${ep.slug} 儲存值含 promo`).not.toMatch(PROMO_PATTERN);
      expect(ep.summary, `${ep.slug} 儲存值含 👶`).not.toContain("👶");
    }
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
