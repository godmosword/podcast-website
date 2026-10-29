import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COVER_ALT,
  COVER_CROPS,
  COVER_SVG,
  COVER_WEBP,
  STICKER_WEBP,
  coverCrop,
  switchGamesCover,
  switchStickerSrc,
  upsertSources,
} from "./orange-express-art";

const ROOT = join(__dirname, "..", "..");
const games = readFileSync(join(ROOT, "data/games.ts"), "utf8");
const art = readFileSync(join(ROOT, "lib/games/orange-express/art.ts"), "utf8");

describe("小橘特快車生圖核准：自動換路徑", () => {
  it("data/games.ts：封面與縮圖都換成 cover.webp，替代文字換新；再跑一次不變", () => {
    const once = switchGamesCover(games);
    expect(once).not.toContain(COVER_SVG);
    expect(once.split(COVER_WEBP)).toHaveLength(3);
    expect(once).toContain(`alt: "${COVER_ALT}"`);
    expect(switchGamesCover(once)).toBe(once);
    // 只動小橘特快車那幾行，其他遊戲不變。
    expect(once.split("\n").filter((line, i) => line !== games.split("\n")[i])).toHaveLength(3);
  });

  it("art.ts：貼紙路徑從 null 換成 xiaoju-sticker.webp；再跑一次不變", () => {
    const once = switchStickerSrc(art);
    expect(once).toContain(`XIAOJU_STICKER_SRC: string | null = "${STICKER_WEBP}"`);
    expect(switchStickerSrc(once)).toBe(once);
  });

  it("找不到要換的地方就丟，不默默略過", () => {
    expect(() => switchGamesCover("export const GAMES = [];")).toThrow();
    expect(() => switchStickerSrc("export const X = 1;")).toThrow();
  });
});

describe("小橘特快車生圖核准：SOURCES.md", () => {
  const row = { file: "cover.webp", use: "封面", how: "AI 生圖", model: "gpt-image-2", date: "2026-10-29", handling: "轉 webp" };

  it("沒有檔時建一份，有表頭與一列；同檔名再寫是更新，不重複", () => {
    const first = upsertSources(null, [row]);
    expect(first).toContain("# 小橘特快車圖檔來源");
    expect(first).toContain("| `cover.webp` | 封面 | AI 生圖 | gpt-image-2 | 2026-10-29 | 轉 webp | 待填 |");
    const again = upsertSources(first, [{ ...row, date: "2026-10-30" }]);
    expect(again.match(/\| `cover\.webp` \|/g)).toHaveLength(1);
    expect(again).toContain("2026-10-30");
    const both = upsertSources(again, [{ ...row, file: "xiaoju-sticker.webp" }]);
    expect(both).toContain("| `cover.webp` |");
    expect(both).toContain("| `xiaoju-sticker.webp` |");
  });
});

describe("小橘特快車封面裁切審稿", () => {
  it("1536×1024 裁進各個框：比例對、不出界", () => {
    for (const crop of COVER_CROPS) {
      const box = coverCrop(1536, 1024, crop.aspect, crop.y);
      expect(box.width / box.height).toBeCloseTo(crop.aspect, 1);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.left + box.width).toBeLessThanOrEqual(1536);
      expect(box.top + box.height).toBeLessThanOrEqual(1024);
    }
  });

  it("3:2 的框剛好是整張；遊樂園 4:3 左右各切一點；直式手機標題留約八成高度、往上偏", () => {
    expect(coverCrop(1536, 1024, 3 / 2)).toEqual({ left: 0, top: 0, width: 1536, height: 1024 });
    const hub = coverCrop(1536, 1024, 4 / 3);
    expect(hub.height).toBe(1024);
    expect(hub.left).toBe(86);
    const phone = coverCrop(1536, 1024, 358 / 186, 0.45);
    expect(phone.height / 1024).toBeGreaterThan(0.75);
    expect(phone.top).toBeLessThan((1024 - phone.height) / 2);
  });
});
