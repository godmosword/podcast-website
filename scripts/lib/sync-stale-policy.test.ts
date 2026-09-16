import { describe, expect, it } from "vitest";
import {
  decideStaleRssAlert,
  runsAfterPubDate,
  waitForFirstSyncHoursFromEnv,
} from "./sync-stale-policy";

const wait = 8;

describe("waitForFirstSyncHoursFromEnv", () => {
  it("yaml STALE_HOURS=3 時仍至少等 8 小時，避免新集連開兩張單", () => {
    expect(waitForFirstSyncHoursFromEnv({ STALE_HOURS: "3" })).toBe(8);
  });

  it("可被 WAIT_FOR_SYNC_HOURS 覆寫", () => {
    expect(
      waitForFirstSyncHoursFromEnv({
        STALE_HOURS: "3",
        WAIT_FOR_SYNC_HOURS: "12",
      }),
    ).toBe(12);
  });

  it("無效的 WAIT_FOR_SYNC_HOURS 回退到預設 8h", () => {
    expect(
      waitForFirstSyncHoursFromEnv({
        STALE_HOURS: "3",
        WAIT_FOR_SYNC_HOURS: "nope",
      }),
    ).toBe(8);
  });
});

describe("runsAfterPubDate", () => {
  it("只保留發佈後才開始的 run", () => {
    const pub = "Wed, 16 Sep 2026 07:00:00 GMT";
    const runs = [
      { startedAt: "2026-09-16T06:43:10Z", status: "completed" },
      { startedAt: "2026-09-16T12:03:44Z", status: "completed" },
    ];
    expect(runsAfterPubDate(runs, pub)).toEqual([runs[1]]);
  });
});

describe("decideStaleRssAlert", () => {
  it("已上站 → 關閉 stale", () => {
    expect(
      decideStaleRssAlert({
        onSite: true,
        hours: 10,
        syncActive: false,
        postPublishRuns: [],
        waitForFirstSyncHours: wait,
      }).action,
    ).toBe("resolve");
  });

  it("ep-30 情境：發佈 4.6h、sync 還沒跑過 → 靜默（交給之後的待生圖單）", () => {
    const decision = decideStaleRssAlert({
      onSite: false,
      hours: 4.6,
      syncActive: false,
      postPublishRuns: [],
      waitForFirstSyncHours: wait,
    });
    expect(decision.action).toBe("silent");
    expect(decision.reason).toContain("等待第一次 sync");
  });

  it("sync 正在跑 → 靜默", () => {
    expect(
      decideStaleRssAlert({
        onSite: false,
        hours: 10,
        syncActive: true,
        postPublishRuns: [],
        waitForFirstSyncHours: wait,
      }).action,
    ).toBe("silent");
  });

  it("發佈後已有 in_progress run → 靜默", () => {
    expect(
      decideStaleRssAlert({
        onSite: false,
        hours: 10,
        syncActive: false,
        postPublishRuns: [{ status: "in_progress", startedAt: "2026-09-16T12:03:44Z" }],
        waitForFirstSyncHours: wait,
      }).action,
    ).toBe("silent");
  });

  it("超過等待窗仍未上站 → 開 stale", () => {
    const decision = decideStaleRssAlert({
      onSite: false,
      hours: 10,
      syncActive: false,
      postPublishRuns: [],
      waitForFirstSyncHours: wait,
    });
    expect(decision.action).toBe("open");
  });
});
