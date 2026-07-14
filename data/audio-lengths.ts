/**
 * 故事音檔位元組數（slug → bytes），供 RSS enclosure length。
 *
 * 由 `npm run generate:audio-lengths`（prebuild）產生；
 * feed.xml 只允許讀此模組，禁止 runtime 掃 public/（見 scripts/verify-no-public-fs.ts）。
 */
import lengths from "./audio-lengths.json";

export const audioLengthBySlug: Readonly<Record<string, number>> = lengths;
