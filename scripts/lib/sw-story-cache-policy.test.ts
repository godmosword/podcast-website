import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");

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
});
