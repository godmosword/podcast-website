import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { cleanEpisodeSummary } from "../scripts/lib/apple-rss";
import {
  lineShareUrl,
  storyLineShareText,
  storyShareUrl,
} from "./share-story";

/** ep-27 原始 RSS 摘要（含 linktr／五星／IG 尾註）。 */
const EP27_RAW_SUMMARY =
  "今天是金龜車小紅豆開學的第一天，小紅豆要挑戰去幼兒園的三個任務！想媽媽的時候，就抱抱心愛的小鹿被被。陪孩子認識上學的樂趣，回家後也和爸爸媽媽分享今天在學校發生的事 👶回想Bonbon也有不想去上學的時候，很謝謝老師的引導以及讓他帶心愛的玩偶被子上學陪伴 🫶🏻這集的構想很謝謝拉拉媽媽的留言與支持，祝福你們一切順心、每天都開開心心哦 歡迎大家留言或是IG跟我們說育兒的路上遇到什麼有趣或頭疼的事？也許下一集就會在《車車遊樂園》裡，聽見你們家的故事囉。馬米是非專業錄音者，但每集都是花很多心力製作故事給孩子們聽，你的五星留言好評，對我們是最大的支持，謝謝你 🚗車車遊樂園 htt ps://linktr.ee/bonboncarstory";

describe("storyShareUrl", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("組出單集絕對網址", () => {
    expect(storyShareUrl("ep-1")).toBe("https://example.com/story/ep-1");
  });
});

describe("storyLineShareText", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("含集數、標題、大綱與連結", () => {
    const text = storyLineShareText({
      ep: 3,
      title: "小紅賽車",
      slug: "ep-3",
      summary: "一起比賽吧！",
    });
    expect(text).toContain("EP 3 小紅賽車");
    expect(text).toContain("一起比賽吧！");
    expect(text).toContain("https://example.com/story/ep-3");
  });

  it("無大綱時用預設句", () => {
    const text = storyLineShareText({
      ep: 1,
      title: "測試",
      slug: "test",
    });
    expect(text).toContain("睡前看圖聽故事");
  });

  it("clean 過的 ep-27 大綱不含 linktr／五星／IG", () => {
    const cleaned = cleanEpisodeSummary(EP27_RAW_SUMMARY);
    expect(cleaned).toBeDefined();
    const text = storyLineShareText({
      ep: 27,
      title: "小紅豆汽車勇敢上學｜想媽媽的時候怎麼辦？",
      slug: "ep-27",
      summary: cleaned,
    });
    expect(text).not.toMatch(/linktr/i);
    expect(text).not.toMatch(/五星/);
    expect(text).not.toMatch(/\bIG\b/);
  });
});

describe("lineShareUrl", () => {
  it("編碼為 LINE 分享網址", () => {
    const url = lineShareUrl("你好\nhttps://example.com");
    expect(url).toMatch(/^https:\/\/line\.me\/R\/msg\/text\/\?/);
    expect(decodeURIComponent(url.split("?")[1]!)).toBe(
      "你好\nhttps://example.com",
    );
  });
});
