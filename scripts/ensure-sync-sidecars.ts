#!/usr/bin/env npx tsx
/**
 * 目錄裡缺 sidecar 的集數補上 stub。已有的不覆寫。
 * 給 sync workflow 在驗證前呼叫；新集仍由 sync-apple-podcast.ts 先補一次。
 */
import { getStories } from "../data/content";
import { upsertCatalogSidecars } from "./lib/sync-catalog-sidecars";

const stories = getStories().map((story) => ({
  slug: story.slug,
  title: story.title,
  summary: story.summary,
}));

const result = upsertCatalogSidecars(stories);
if (result.updatedSlugs.length === 0) {
  console.log("catalog sidecars：沒有缺的 key。");
} else {
  console.log(`catalog sidecars：補上 ${result.updatedSlugs.join(", ")}`);
}
