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

  it("下架只刪名單裡的故事 URL，不升 cache 版本", () => {
    // 名單寫在 sw.js 本身：名單一變檔案就變，瀏覽器才會重裝並跑 activate。
    // 放在另一個 JSON 檔時 sw.js 不變，回訪者永遠不會清掉下架集數的快取。
    expect(sw).not.toContain("sw-revocations.json");
    expect(sw).toMatch(/^const REVOKED_STORY_SLUGS = \[.*\];$/m);
    expect(sw).toContain('const CACHE_NAME = "chechecar-v6"');
    const drop = sw.match(/async function dropRevokedStoryAssets[\s\S]*?\n}\n/)?.[0] ?? "";
    expect(drop).toContain("REVOKED_STORY_SLUGS");
    expect(drop).toContain("dropCachedStoryAsset");
    const dropOne = sw.match(/async function dropCachedStoryAsset[\s\S]*?\n}\n/)?.[0] ?? "";
    expect(dropOne, "刪快取也要刪大小紀錄，否則容量一直算到已刪的檔").toContain("deleteAssetMeta");
    expect(sw).toMatch(/activate[\s\S]{0,400}dropRevokedStoryAssets/);
  });

  it("下架集數不會被寫回快取，也不從快取拿", () => {
    const cacheFn = sw.match(/async function cacheStoryAsset[\s\S]*?\n}\n/)?.[0] ?? "";
    expect(cacheFn, "背景佇列與 fetch 都經過 cacheStoryAsset").toContain("isRevokedStoryPath");
    const fetchHandler = sw.match(/addEventListener\("fetch"[\s\S]*?\n}\);\n/)?.[0] ?? "";
    const revokedBranch = fetchHandler.indexOf("isRevokedStoryPath(url.pathname)");
    expect(revokedBranch, "fetch 要先判斷下架集數").toBeGreaterThan(-1);
    expect(revokedBranch).toBeLessThan(fetchHandler.indexOf("cache.match(request)"));
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
