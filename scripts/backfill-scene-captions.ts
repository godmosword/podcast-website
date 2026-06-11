#!/usr/bin/env tsx
// ============================================================
// 依 scenes + subtitles 回填幕級 captions（範本集 ep-9／ep-10）
// ============================================================

import { REFERENCE_ILLUSTRATED_SLUGS } from "./lib/episode-workflow";
import { syncSceneCaptionsToMetadata } from "./lib/illustrate-core";

const slugs = process.argv.slice(2);
const targets = slugs.length > 0 ? slugs : [...REFERENCE_ILLUSTRATED_SLUGS];

for (const slug of targets) {
  const { pageCount, captions } = syncSceneCaptionsToMetadata(slug);
  console.log(`${slug}: pageCount=${pageCount}, captions=${captions.length}`);
}
