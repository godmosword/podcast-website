import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  DINO_SUSHI_ASSET_ROOT,
  DINO_SUSHI_SM_WIDTH,
  dinoSushiSmPath,
  dinoSushiSrc,
  type DinoSushiAsset,
} from "./asset-src";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PUBLIC_ROOT = join(ROOT, "public", DINO_SUSHI_ASSET_ROOT);
const ASSETS = Object.keys(DINO_SUSHI_SM_WIDTH) as DinoSushiAsset[];

describe("壽司屋素材縮小副本", () => {
  it("畫面讀同目錄 sm/ 底下的副本", () => {
    expect(dinoSushiSrc("food/salmon.webp")).toBe("/games/v2/dino-sushi/food/sm/salmon.webp");
    expect(dinoSushiSrc("duoduo/sticker-open.webp")).toBe("/games/v2/dino-sushi/duoduo/sm/sticker-open.webp");
    expect(dinoSushiSmPath("shop/wall.webp")).toBe("shop/sm/wall.webp");
  });

  it("寬度是 64 的倍數、至少 128（原圖本身更窄的例外）", () => {
    for (const asset of ASSETS) {
      const w = DINO_SUSHI_SM_WIDTH[asset];
      expect(w === null || (w >= 128 && w % 64 === 0), asset).toBe(true);
    }
  });

  it("每張原檔都在，副本也都產生了", () => {
    const missing = ASSETS.flatMap((asset) => [
      ...(existsSync(join(PUBLIC_ROOT, asset)) ? [] : [`原檔 ${asset}`]),
      ...(existsSync(join(PUBLIC_ROOT, dinoSushiSmPath(asset))) ? [] : [`副本 ${dinoSushiSmPath(asset)}`]),
    ]);
    expect(missing, "跑 npm run optimize:dino-sushi-assets").toEqual([]);
  });

  it("副本寬度與長寬比符合原檔、透明不掉、不比原檔大；原尺寸的就是原檔", async () => {
    const wrong: string[] = [];
    for (const asset of ASSETS) {
      const original = join(PUBLIC_ROOT, asset);
      const copy = join(PUBLIC_ROOT, dinoSushiSmPath(asset));
      const [orig, sm] = await Promise.all([sharp(original).metadata(), sharp(copy).metadata()]);
      const target = DINO_SUSHI_SM_WIDTH[asset] ?? orig.width!;
      const expected = Math.min(target, orig.width!);
      if (sm.width !== expected) wrong.push(`${asset} 寬 ${sm.width}，應為 ${expected}`);
      // 長寬比對不上＝原檔換過圖、副本沒重產
      if (Math.abs(sm.height! - (orig.height! * sm.width!) / orig.width!) > 1) wrong.push(`${asset} 長寬比跟原檔不同`);
      if (orig.hasAlpha && !sm.hasAlpha) wrong.push(`${asset} 掉了透明`);
      if (statSync(copy).size > statSync(original).size) wrong.push(`${asset} 副本比原檔大`);
      if (expected === orig.width && !readFileSync(copy).equals(readFileSync(original))) {
        wrong.push(`${asset} 原尺寸副本跟原檔不一樣`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("sm/ 裡沒有設定表以外的檔", () => {
    const expected = new Set(ASSETS.map(dinoSushiSmPath));
    const extra = ["duoduo", "food", "shop", "customers"].flatMap((dir) => {
      const smDir = join(PUBLIC_ROOT, dir, "sm");
      if (!existsSync(smDir)) return [];
      return readdirSync(smDir)
        .map((name) => `${dir}/sm/${name}`)
        .filter((path) => !expected.has(path));
    });
    expect(extra).toEqual([]);
  });
});
