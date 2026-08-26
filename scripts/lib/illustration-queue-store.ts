import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  episodeNumberFromSlug,
  ILLUSTRATION_QUEUE_RELATIVE_PATH,
  markApproved,
  parseIllustrationQueue,
  proofreadMarkerRelPath,
  upsertAwaiting,
  type IllustrationQueueItem,
} from "../../data/illustration-queue";
import type { SyncRunReport } from "./sync-report";
import { ROOT } from "./transcribe-core";

export function illustrationQueueFilePath(rootDir: string = ROOT): string {
  return join(rootDir, ILLUSTRATION_QUEUE_RELATIVE_PATH);
}

export function isSubtitleReadyOnDisk(
  slug: string,
  rootDir: string = ROOT,
): boolean {
  return existsSync(join(rootDir, proofreadMarkerRelPath(slug)));
}

export function readIllustrationQueueFile(
  rootDir: string = ROOT,
): IllustrationQueueItem[] {
  const path = illustrationQueueFilePath(rootDir);
  if (!existsSync(path)) return [];
  return parseIllustrationQueue(JSON.parse(readFileSync(path, "utf8")) as unknown);
}

export function writeIllustrationQueueFile(
  items: IllustrationQueueItem[],
  rootDir: string = ROOT,
): void {
  writeFileSync(
    illustrationQueueFilePath(rootDir),
    `${JSON.stringify(items, null, 2)}\n`,
    "utf8",
  );
}

/** GHA／vitest 不寫倉儲檔（approve 與 notify 共用）。 */
export function canWriteIllustrationQueue(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.GITHUB_ACTIONS !== "true" && env.VITEST !== "true";
}

/** 本機 notify 才持久化；dry-run 也不寫。 */
export function shouldPersistIllustrationQueue(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return canWriteIllustrationQueue(env) && env.SYNC_ALERT_DRY_RUN !== "1";
}

export function enqueueFromSyncReport(
  report: SyncRunReport,
  slugs: string[] = report.illustratePending,
  rootDir: string = ROOT,
): IllustrationQueueItem[] {
  const incoming = slugs.flatMap((slug) => {
    const ep =
      report.newEpisodes.find((episode) => episode.slug === slug)?.ep ??
      episodeNumberFromSlug(slug);
    if (ep === null) return [];
    return [{ slug, ep, syncedAt: report.runAt }];
  });
  const next = upsertAwaiting(
    readIllustrationQueueFile(rootDir),
    incoming,
    (slug) => isSubtitleReadyOnDisk(slug, rootDir),
  );
  writeIllustrationQueueFile(next, rootDir);
  return next;
}

export function markIllustrationApproved(
  slug: string,
  ep: number,
  rootDir: string = ROOT,
): IllustrationQueueItem[] {
  const next = markApproved(readIllustrationQueueFile(rootDir), slug, {
    ep,
    subtitleReady: true,
  });
  writeIllustrationQueueFile(next, rootDir);
  return next;
}
