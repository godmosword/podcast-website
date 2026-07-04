import fs from "node:fs/promises";
import path from "node:path";

export type SyncRunReport = {
  runAt: string;
  dryRun: boolean;
  newEpisodes: Array<{ slug: string; ep: number; title: string }>;
  metadataUpdated: string[];
  tagBackfill: string[];
  vehicleBackfill: string[];
  /** 本輪 Whisper 新產生的側車檔 */
  subtitlesCreated: string[];
  /** 同步內自動 proofread --fix：slug → 修正處數 */
  proofreadAutoFixed: Record<string, number>;
  /** 自動 fix 後仍待人工 lint：slug → 待修項數 */
  proofreadPendingLint: Record<string, number>;
  /** 目錄內有音檔但缺側車檔（同步結束時） */
  subtitlesMissing: string[];
  /** 新集 slug（ep-N），供開 illustrate Issue */
  illustratePending: string[];
  /** 本輪新增至 data/browse-index.json 的車種 */
  browseIndexVehicles: string[];
  /** 本輪新增至 data/browse-index.json 的主題 */
  browseIndexTopics: string[];
  /** emoji 依索引校正 */
  emojiSync: string[];
};

export function createEmptyReport(dryRun: boolean): SyncRunReport {
  return {
    runAt: new Date().toISOString(),
    dryRun,
    newEpisodes: [],
    metadataUpdated: [],
    tagBackfill: [],
    vehicleBackfill: [],
    subtitlesCreated: [],
    proofreadAutoFixed: {},
    proofreadPendingLint: {},
    subtitlesMissing: [],
    illustratePending: [],
    browseIndexVehicles: [],
    browseIndexTopics: [],
    emojiSync: [],
  };
}

export function isIllustrateSlug(slug: string): boolean {
  return /^ep-\d+$/.test(slug);
}

export async function writeSyncReport(
  report: SyncRunReport,
  filePath: string | undefined,
): Promise<void> {
  if (!filePath) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
