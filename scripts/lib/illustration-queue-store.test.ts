import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import {
  canWriteIllustrationQueue,
  enqueueFromSyncReport,
  illustrationQueueFilePath,
  markIllustrationApproved,
  shouldPersistIllustrationQueue,
} from "./illustration-queue-store";
import type { SyncRunReport } from "./sync-report";

const dirs: string[] = [];

function tempRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "illustration-queue-"));
  dirs.push(dir);
  mkdirSync(join(dir, "data"), { recursive: true });
  mkdirSync(join(dir, "data/subtitles/_proofread"), { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function sampleReport(overrides: Partial<SyncRunReport> = {}): SyncRunReport {
  return {
    runAt: "2026-09-01T00:00:00.000Z",
    dryRun: false,
    newEpisodes: [{ slug: "ep-27", ep: 27, title: "測試" }],
    metadataUpdated: [],
    tagBackfill: [],
    vehicleBackfill: [],
    subtitlesCreated: [],
    proofreadAutoFixed: {},
    proofreadPendingLint: {},
    subtitlesMissing: [],
    illustratePending: ["ep-27"],
    browseIndexVehicles: [],
    browseIndexTopics: [],
    emojiSync: [],
    episodeFaqStubs: [],
    ...overrides,
  };
}

describe("illustration-queue-store", () => {
  it("本機才持久化，GHA／dry-run／vitest 不寫檔", () => {
    expect(canWriteIllustrationQueue({ VITEST: "true" })).toBe(false);
    expect(canWriteIllustrationQueue({ GITHUB_ACTIONS: "true" })).toBe(false);
    expect(canWriteIllustrationQueue({})).toBe(true);
    expect(shouldPersistIllustrationQueue({ VITEST: "true" })).toBe(false);
    expect(shouldPersistIllustrationQueue({ GITHUB_ACTIONS: "true" })).toBe(
      false,
    );
    expect(shouldPersistIllustrationQueue({ SYNC_ALERT_DRY_RUN: "1" })).toBe(
      false,
    );
    expect(shouldPersistIllustrationQueue({})).toBe(true);
  });

  it("enqueueFromSyncReport 寫入 awaiting，並讀校對標記", () => {
    const root = tempRoot();
    writeFileSync(
      join(root, "data/subtitles/_proofread/ep-27.json"),
      "{}\n",
      "utf8",
    );
    const items = enqueueFromSyncReport(sampleReport(), undefined, root);
    expect(items).toEqual([
      {
        slug: "ep-27",
        ep: 27,
        syncedAt: "2026-09-01T00:00:00.000Z",
        subtitleReady: true,
        status: "awaiting-illustrate",
      },
    ]);
    const written = JSON.parse(
      readFileSync(illustrationQueueFilePath(root), "utf8"),
    ) as unknown;
    expect(written).toEqual(items);
  });

  it("markIllustrationApproved 改為 approved", () => {
    const root = tempRoot();
    enqueueFromSyncReport(sampleReport(), ["ep-27"], root);
    const items = markIllustrationApproved("ep-27", 27, root);
    expect(items[0]?.status).toBe("approved");
    expect(items[0]?.subtitleReady).toBe(true);
  });
});
