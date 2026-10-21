#!/usr/bin/env tsx
/**
 * D1：為各集 01.jpg 封面產生 blurDataURL manifest。
 * 已有的項目保留，只補缺的封面；封面檔不在就失敗，不靜默略過。
 *
 *   npm run generate:story-blurs
 */
import { getStories } from "../data/content";
import { ensureStoryCoverBlurs } from "./lib/story-cover-blur";
import { ROOT } from "./lib/transcribe-core";

async function main(): Promise<void> {
  const result = await ensureStoryCoverBlurs({
    root: ROOT,
    stories: getStories(),
  });

  if (result.missingFiles.length > 0) {
    console.error(`✗ 封面缺檔，無法產生 blur：\n${result.missingFiles.join("\n")}`);
    process.exit(1);
  }

  console.log(
    `✓ blur 本輪新增 ${result.added.length} 筆 → data/story-image-blurs.json`,
  );
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
