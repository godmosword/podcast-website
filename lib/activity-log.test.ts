import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_MAX_BYTES,
  ACTIVITY_STORAGE_KEY,
  addStorySeconds,
  clearActivityLog,
  clampPlayedDelta,
  createPlaybackClock,
  emptyActivityLog,
  localDateKey,
  mergeActivityLogs,
  notePlaybackTime,
  readActivityLog,
  recordGameSession,
  recordStoryPlay,
  type ActivityLogV1,
  type DayBucket,
} from "./activity-log";

function mockLocalStorage() {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    localStorage: localStorageMock,
  });
  vi.stubGlobal("localStorage", localStorageMock);
  return store;
}

const TODAY = new Date(2026, 9, 5, 15, 0, 0).getTime();

function day(stories: DayBucket["stories"], games: DayBucket["games"] = {}): DayBucket {
  return { stories, games };
}

describe("clampPlayedDelta", () => {
  it("倒退、非數字與超過 2 秒的跳躍都不記，短前進保留", () => {
    expect(clampPlayedDelta(-4)).toBe(0);
    expect(clampPlayedDelta(Number.NaN)).toBe(0);
    expect(clampPlayedDelta(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampPlayedDelta(0)).toBe(0);
    expect(clampPlayedDelta(1.25)).toBe(1.25);
    expect(clampPlayedDelta(30)).toBe(2);
  });
});

describe("notePlaybackTime", () => {
  it("第一次只記下位置；之後的大跳躍最多記 2 秒，倒退不記", () => {
    const clock = createPlaybackClock();
    expect(notePlaybackTime(clock, 0, true)).toBe(false);
    expect(notePlaybackTime(clock, 30, true)).toBe(false);
    expect(clock.pendingSeconds).toBe(2);
    expect(notePlaybackTime(clock, 28, true)).toBe(false);
    expect(clock.pendingSeconds).toBe(2);
    expect(notePlaybackTime(clock, 29, false)).toBe(false);
    expect(clock.pendingSeconds).toBe(2);
  });
});

describe("activity log storage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockLocalStorage();
  });

  it("跨午夜寫入會分到兩個本地日期", () => {
    const late = new Date(2026, 9, 5, 23, 50, 0).getTime();
    const early = new Date(2026, 9, 6, 0, 10, 0).getTime();

    addStorySeconds("ep-15", 5, late);
    addStorySeconds("ep-15", 7, early);

    const log = readActivityLog(early);
    expect(log.days[localDateKey(late)]?.stories["ep-15"]?.seconds).toBe(5);
    expect(log.days[localDateKey(early)]?.stories["ep-15"]?.seconds).toBe(7);
    expect(Object.keys(log.days)).toHaveLength(2);
  });

  it("超過 90 天的日期在寫入時刪除，剛好 90 天仍保留", () => {
    const today = new Date(TODAY);
    const kept = new Date(today);
    kept.setDate(kept.getDate() - 90);
    const dropped = new Date(today);
    dropped.setDate(dropped.getDate() - 91);
    const seeded: ActivityLogV1 = {
      schemaVersion: 1,
      deviceKey: "device-keep-1111",
      days: {
        [localDateKey(dropped.getTime())]: day({
          "ep-1": { seconds: 10, plays: 1, completions: 0 },
        }),
        [localDateKey(kept.getTime())]: day({
          "ep-2": { seconds: 20, plays: 1, completions: 0 },
        }),
      },
    };
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(seeded));

    addStorySeconds("ep-15", 3, TODAY);

    const log = readActivityLog(TODAY);
    expect(log.deviceKey).toBe("device-keep-1111");
    expect(log.days[localDateKey(dropped.getTime())]).toBeUndefined();
    expect(log.days[localDateKey(kept.getTime())]?.stories["ep-2"]?.seconds).toBe(20);
    expect(log.days[localDateKey(TODAY)]?.stories["ep-15"]?.seconds).toBe(3);
  });

  it("格式不合法時丟棄並重新開始", () => {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, "{not-json");
    const log = readActivityLog(TODAY);
    expect(log.schemaVersion).toBe(1);
    expect(log.days).toEqual({});
    expect(log.deviceKey.length).toBeGreaterThanOrEqual(8);

    localStorage.setItem(
      ACTIVITY_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, deviceKey: "device-old-2222", days: {} }),
    );
    const reset = readActivityLog(TODAY);
    expect(reset.days).toEqual({});
    expect(reset.deviceKey).not.toBe("device-old-2222");
  });

  it("正規化後超過大小上限時重新開始", () => {
    const days: ActivityLogV1["days"] = {};
    const start = new Date(TODAY);
    for (let offset = 0; offset < 90; offset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() - offset);
      const stories: DayBucket["stories"] = {};
      for (let index = 0; index < 40; index += 1) {
        stories[`ep-${offset}-${index}`] = { seconds: 100, plays: 1, completions: 0 };
      }
      days[localDateKey(date.getTime())] = day(stories);
    }
    const oversized = JSON.stringify({
      schemaVersion: 1,
      deviceKey: "device-huge-3333",
      days,
    });
    expect(oversized.length).toBeGreaterThan(ACTIVITY_MAX_BYTES);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, oversized);

    const log = readActivityLog(TODAY);
    expect(log.days).toEqual({});
    expect(log.deviceKey).not.toBe("device-huge-3333");
  });

  it("清除活動時保留 deviceKey", () => {
    addStorySeconds("ep-15", 4, TODAY);
    const before = readActivityLog(TODAY);
    const cleared = clearActivityLog();
    expect(cleared.deviceKey).toBe(before.deviceKey);
    expect(cleared.days).toEqual({});
    expect(recordStoryPlay("ep-15", TODAY).days[localDateKey(TODAY)]?.stories["ep-15"]?.plays).toBe(1);
  });

  it("遊戲局數與通關分開累計", () => {
    recordGameSession("candy-match", false, TODAY);
    recordGameSession("candy-match", true, TODAY);
    const game = readActivityLog(TODAY).days[localDateKey(TODAY)]?.games["candy-match"];
    expect(game).toEqual({ seconds: 0, sessions: 2, clears: 1 });
  });
});

describe("mergeActivityLogs", () => {
  const date = "2026-10-05";

  function log(
    deviceKey: string,
    seconds: number,
    plays: number,
  ): ActivityLogV1 {
    return {
      schemaVersion: 1,
      deviceKey,
      days: {
        [date]: day({
          "ep-15": { seconds, plays, completions: 0 },
        }),
      },
    };
  }

  it("同一台裝置取較大值，重複合併結果不變", () => {
    const left = log("device-same-111", 10, 1);
    const right = log("device-same-111", 4, 3);
    const once = mergeActivityLogs(left, right);
    const twice = mergeActivityLogs(once, right);

    expect(once.deviceKey).toBe("device-same-111");
    expect(once.days[date]?.stories["ep-15"]).toEqual({
      seconds: 10,
      plays: 3,
      completions: 0,
    });
    expect(twice).toEqual(once);
    expect(left.days[date]?.stories["ep-15"]?.seconds).toBe(10);
  });

  it("不同裝置的數值相加", () => {
    const merged = mergeActivityLogs(
      log("device-aaa-1111", 10, 1),
      log("device-bbb-2222", 4, 2),
    );
    expect(merged.days[date]?.stories["ep-15"]).toEqual({
      seconds: 14,
      plays: 3,
      completions: 0,
    });
    expect(merged.deviceKey).not.toBe("device-aaa-1111");
    expect(merged.deviceKey).not.toBe("device-bbb-2222");
  });

  it("空紀錄合併後仍是空的", () => {
    expect(mergeActivityLogs(emptyActivityLog("device-empty-11"), emptyActivityLog("device-empty-11")).days).toEqual({});
  });
});
