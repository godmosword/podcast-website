import fs from "node:fs/promises";
import path from "node:path";

export type SubtitleStatus = "created" | "exists" | "missing";

export type SyncRunReport = {
  runAt: string;
  dryRun: boolean;
  newEpisodes: Array<{ slug: string; ep: number; title: string }>;
  metadataUpdated: string[];
  tagBackfill: string[];
  vehicleBackfill: string[];
  /** 本輪 Whisper 新產生的側車檔 */
  subtitlesCreated: string[];
  /** 目錄內有音檔但缺側車檔（同步結束時） */
  subtitlesMissing: string[];
  /** 新集 slug（ep-N），供開 illustrate Issue */
  illustratePending: string[];
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
    subtitlesMissing: [],
    illustratePending: [],
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
