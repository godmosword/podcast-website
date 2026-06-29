#!/usr/bin/env tsx
/**
 * 修補 roamer PNG 殘留的不透明淺色背景。
 *
 * 起因：`generate-roamer-assets.ts` 以 magenta 平背 + chroma-key 去背，但圖像模型有時
 * 回傳近白／淺灰底而非 magenta，magenta key 抓不到 → 整張殘留不透明白框。
 *
 * 解法：從邊界 flood-fill 只移除「與邊界相連的近白像素」，保留內部白（牙齒、眼白、賽車
 * 白條、白色數字圈）。共用 `scripts/lib/roamer-alpha.ts`，與生成管線 postProcess 同一套。
 *
 * 用法：
 *   npm run fix:roamer-alpha            # 就地修補 public/adventures/roamers/*.png
 *   npm run fix:roamer-alpha -- --check # 只報告各檔背景占比，不寫檔
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/transcribe-core";
import { floodBorderBackground, removeBorderBackground } from "./lib/roamer-alpha";

const DIR = join(ROOT, "public/adventures/roamers");

async function processFile(path: string, check: boolean): Promise<void> {
  const name = path.replace(ROOT + "/", "");
  if (check) {
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const c = info.channels;
    const { removed } = floodBorderBackground(data, info.width, info.height, c);
    // 只計仍「不透明」的背景像素＝實際待修補量（已去背者 alpha=0 不計）。
    let opaqueBg = 0;
    for (let p = 0; p < removed.length; p++) {
      if (removed[p] && data[p * c + 3]! > 16) opaqueBg++;
    }
    const pct = (100 * opaqueBg) / removed.length;
    console.log(`${pct > 5 ? "⚠" : "✓"} ${name}: 殘留不透明背景占比 ${pct.toFixed(1)}%`);
    return;
  }
  // 保留原始畫框（車身已置中、輪子貼底），只去背 → 不動接地錨點。
  const { png, bgPct } = await removeBorderBackground(await sharp(path).toBuffer());
  await sharp(png).toFile(path);
  console.log(`✓ ${name}: 去背完成（背景占比 ${bgPct.toFixed(1)}%）`);
}

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));
  if (files.length === 0) throw new Error(`${DIR} 無 PNG`);
  for (const f of files) await processFile(join(DIR, f), check);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
