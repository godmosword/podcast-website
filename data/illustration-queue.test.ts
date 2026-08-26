import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getStories } from "./content";
import {
  episodeNumberFromSlug,
  illustrationStatusForPageCount,
  listAwaitingIllustrations,
  markApproved,
  parseIllustrationQueue,
  reconcileIllustrationQueue,
  syncedAtFromStoryDate,
  upsertAwaiting,
} from "./illustration-queue";

describe("illustration-queue", () => {
  it("pageCount≤1 為待生圖，全幕為 approved", () => {
    expect(illustrationStatusForPageCount(1)).toBe("awaiting-illustrate");
    expect(illustrationStatusForPageCount(0)).toBe("awaiting-illustrate");
    expect(illustrationStatusForPageCount(19)).toBe("approved");
  });

  it("slug 解析 ep 編號", () => {
    expect(episodeNumberFromSlug("ep-26")).toBe(26);
    expect(episodeNumberFromSlug("ev")).toBeNull();
  });

  it("故事日期轉台北午夜 ISO", () => {
    expect(syncedAtFromStoryDate("2026-08-19")).toBe("2026-08-19T00:00:00+08:00");
    expect(syncedAtFromStoryDate("2026-08-19T12:00:00.000Z")).toBe(
      "2026-08-19T12:00:00.000Z",
    );
  });

  it("reconcile：catalog pageCount 覆蓋 overlay 狀態，保留 syncedAt", () => {
    const items = reconcileIllustrationQueue({
      stories: [
        { slug: "ep-2", ep: 2, pageCount: 16, date: "2026-01-01" },
        { slug: "ep-26", ep: 26, pageCount: 1, date: "2026-08-19" },
      ],
      overlay: [
        {
          slug: "ep-26",
          ep: 26,
          syncedAt: "2026-08-20T00:00:00.000Z",
          subtitleReady: false,
          status: "approved",
        },
      ],
      isSubtitleReady: (slug) => slug === "ep-26",
    });

    expect(items).toEqual([
      {
        slug: "ep-26",
        ep: 26,
        syncedAt: "2026-08-20T00:00:00.000Z",
        subtitleReady: true,
        status: "awaiting-illustrate",
      },
    ]);
  });

  it("reconcile：已全幕且 overlay 沒記過的不列入", () => {
    const items = reconcileIllustrationQueue({
      stories: [{ slug: "ep-9", ep: 9, pageCount: 21, date: "2026-04-01" }],
      overlay: [],
      isSubtitleReady: () => true,
    });
    expect(items).toEqual([]);
  });

  it("upsert 不降級已 approved 的集", () => {
    const overlay = [
      {
        slug: "ep-10",
        ep: 10,
        syncedAt: "2026-01-01T00:00:00.000Z",
        subtitleReady: true,
        status: "approved" as const,
      },
    ];
    const next = upsertAwaiting(
      overlay,
      [{ slug: "ep-10", ep: 10, syncedAt: "2026-09-01T00:00:00.000Z" }],
      () => false,
    );
    expect(next[0]?.status).toBe("approved");
    expect(next[0]?.syncedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("upsert 寫入新的待生圖集", () => {
    const next = upsertAwaiting(
      [],
      [{ slug: "ep-27", ep: 27, syncedAt: "2026-09-01T00:00:00.000Z" }],
      () => false,
    );
    expect(next).toEqual([
      {
        slug: "ep-27",
        ep: 27,
        syncedAt: "2026-09-01T00:00:00.000Z",
        subtitleReady: false,
        status: "awaiting-illustrate",
      },
    ]);
  });

  it("markApproved 把狀態改為 approved", () => {
    const next = markApproved(
      [
        {
          slug: "ep-26",
          ep: 26,
          syncedAt: "2026-08-19T00:00:00+08:00",
          subtitleReady: false,
          status: "awaiting-illustrate",
        },
      ],
      "ep-26",
      { ep: 26, subtitleReady: true },
    );
    expect(next[0]?.status).toBe("approved");
    expect(next[0]?.subtitleReady).toBe(true);
  });

  it("倉儲 JSON 可通過 schema，且與 catalog 待生圖 slug 對齊", () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), "data/illustration-queue.json"), "utf8"),
    ) as unknown;
    const overlay = parseIllustrationQueue(raw);
    const catalogAwaiting = getStories()
      .filter(
        (story) =>
          /^ep-\d+$/.test(story.slug) &&
          illustrationStatusForPageCount(story.pageCount) ===
            "awaiting-illustrate",
      )
      .map((story) => story.slug)
      .sort();
    const reconciled = reconcileIllustrationQueue({
      stories: getStories(),
      overlay,
      isSubtitleReady: () => false,
    });
    expect(
      listAwaitingIllustrations(reconciled)
        .map((item) => item.slug)
        .sort(),
    ).toEqual(catalogAwaiting);
    // overlay 可比 catalog 少（GHA 不寫檔）；不得把已全幕集標成 awaiting。
    for (const item of overlay) {
      if (item.status === "awaiting-illustrate") {
        expect(catalogAwaiting).toContain(item.slug);
      }
    }
  });

  it("Apple sync 主脚本與 workflow 不得寫入生圖佇列（紅線）", () => {
    const syncScript = readFileSync(
      join(process.cwd(), "scripts/sync-apple-podcast.ts"),
      "utf8",
    );
    const yaml = readFileSync(
      join(process.cwd(), ".github/workflows/sync-apple-podcast.yml"),
      "utf8",
    );
    const watchdog = readFileSync(
      join(process.cwd(), ".github/workflows/sync-watchdog.yml"),
      "utf8",
    );
    expect(syncScript).not.toContain("illustration-queue");
    expect(yaml).not.toContain("illustration-queue");
    expect(watchdog).not.toContain("illustration-queue");
  });
});
