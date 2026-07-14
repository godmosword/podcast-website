import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 契約：feed.xml 不得再引入會觸發 public/ NFT 的動態路徑。
 * 與 verify:no-public-fs 互補——本測試保證關鍵 route 源碼不回退。
 */
describe("feed.xml 紅線契約", () => {
  const routeSrc = readFileSync(
    join(process.cwd(), "app/feed.xml/route.ts"),
    "utf8",
  );

  it("不對 public/ 做 process.cwd 動態路徑", () => {
    expect(routeSrc).not.toMatch(/process\.cwd\(\)/);
    expect(routeSrc).not.toMatch(/["']public["']/);
    expect(routeSrc).not.toMatch(/\bstatSync\b/);
    expect(routeSrc).not.toMatch(/\breadFileSync\b/);
  });

  it("enclosure length 來自 data/audio-lengths", () => {
    expect(routeSrc).toContain("@/data/audio-lengths");
    expect(routeSrc).toContain("audioLengthBySlug");
  });
});
