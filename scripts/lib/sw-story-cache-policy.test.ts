import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
const player = readFileSync(
  join(process.cwd(), "components/StoryPlayer.tsx"),
  "utf8",
);

describe("service worker story asset cache policy", () => {
  it("維持 v6 cache name（升版會清掉離線故事）", () => {
    expect(sw).toContain('const CACHE_NAME = "chechecar-v6"');
  });

  it("故事音檔／插圖只快取完整 200，不把 206 Partial 寫進 Cache Storage", () => {
    expect(sw).toMatch(/cached && cached\.status === 200/);
    expect(sw).toMatch(/response\.status === 200/);
    expect(sw).not.toMatch(
      /isStoryAsset[\s\S]{0,400}if \(response\.ok\) \{\s*await cacheStoryAsset/,
    );
  });

  it("runtime cache 涵蓋故事 AVIF／WebP，讓 picture currentSrc 可離線命中", () => {
    expect(sw).toMatch(/\.avif/);
    expect(sw).toMatch(/\.webp/);
  });

  it("離開播放頁會取消後續 CACHE_STORY idle queue", () => {
    expect(sw).toMatch(/storyCacheEpoch/);
    expect(sw).toMatch(/storyCacheAllowed/);
    expect(sw).toMatch(
      /PLAYBACK_INACTIVE[\s\S]{0,240}storyCacheAllowed = false/,
    );
    expect(sw).toMatch(/!storyCacheAllowed \|\| epoch !== storyCacheEpoch/);
    expect(sw).toMatch(/hasStoryPlayClient/);
  });

  it("CACHE_STORY 已有 200 時不重抓", () => {
    expect(sw).toMatch(/CACHE_STORY[\s\S]{0,800}cache\.match/);
  });
});

describe("story player cache / audio entry policy", () => {
  it("進播放頁不 preload 完整 MP3", () => {
    expect(player).toMatch(/preload="none"/);
    expect(player).not.toMatch(/preload="metadata"/);
  });

  it("CACHE_STORY 只送 idle 圖片，不把音檔丟進背景下載", () => {
    expect(player).toMatch(/storyIdleCacheUrls/);
    expect(player).toMatch(/type: "CACHE_STORY", urls: idleUrls/);
    expect(player).not.toMatch(
      /postMessage\(\{ type: "CACHE_STORY", urls \}\)/,
    );
  });
});
