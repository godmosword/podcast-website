#!/usr/bin/env tsx
/**
 * 每集封面 01.jpg 補 WebP／AVIF。同步的衍生資產之一：播放頁 <picture> 先要 AVIF，
 * 缺檔是 404、不會退回 JPG（ep-33～36 就這樣破圖）。只補缺的，已有的不動。
 *
 *   npm run generate:story-covers
 */
import { join } from "node:path";
import { ensureStoryCoverSiblings } from "./lib/lcp-image-optimize";
import { ROOT } from "./lib/transcribe-core";

ensureStoryCoverSiblings(join(ROOT, "public"))
  .then((written) => {
    console.log(written.length ? `封面現代格式：補了 ${written.join(", ")}` : "封面現代格式：都齊了");
  })
  .catch((err: unknown) => {
    console.error(`✗ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
