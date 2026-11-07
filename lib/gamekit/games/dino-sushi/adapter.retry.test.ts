// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DinoSushiInstance } from "@/lib/gamekit/games/dino-sushi/adapter";
import { ACTIVITY_STORAGE_KEY, localDateKey, readActivityLog } from "@/lib/activity-log";
import { getLifetimeStars } from "@/lib/gamekit/progress/economy";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { reportGameSession } from "@/lib/gamekit/progress/session";

const original = Storage.prototype.setItem;

/** 第 n 次寫入丟 QuotaExceededError，其他照常：模擬寫到一半才滿。 */
function failNthWrite(n: number) {
  let writes = 0;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(this: Storage, key, value) {
    writes += 1;
    if (writes === n) throw new DOMException("storage is full", "QuotaExceededError");
    original.call(this, key, value);
  });
  return () => writes;
}

function dinoSessionsToday() {
  const now = Date.now();
  return readActivityLog(now).days[localDateKey(now)]?.games["dino-sushi"]?.sessions ?? 0;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("第 4 天回報寫到一半失敗，再存一次（真的走 reportGameSession）", () => {
  const medals = { cleared: true, flawless: true, collectedAll: false };

  function clearDayFour() {
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false, onSession: reportGameSession });
    inst.notifyPlaying("order");
    return { inst, saved: inst.notifyWon(medals) };
  }

  it("正常路徑：拿到 2 顆全站星星，活動紀錄 1 次，總共幾次寫入當作下面的上限", () => {
    const writes = failNthWrite(0);
    expect(clearDayFour().saved).toBe(true);
    expect(getLifetimeStars(loadPlayerProfile())).toBe(2);
    expect(dinoSessionsToday()).toBe(1);
    expect(writes()).toBeGreaterThanOrEqual(2);
  });

  it.each([1, 2, 3, 4])("第 %i 次寫入失敗：補寫後星星不多發，活動紀錄只算一次", (n) => {
    failNthWrite(n);
    const { inst, saved } = clearDayFour();
    if (!saved) expect(inst.flushSessions()).toBe(true);
    expect(getLifetimeStars(loadPlayerProfile())).toBe(2);
    expect(dinoSessionsToday()).toBe(1);
    expect(localStorage.getItem(ACTIVITY_STORAGE_KEY)).not.toBeNull();
  });

  it("再補寫一次也不會重複", () => {
    failNthWrite(1);
    const { inst } = clearDayFour();
    inst.flushSessions();
    inst.flushSessions();
    expect(getLifetimeStars(loadPlayerProfile())).toBe(2);
    expect(dinoSessionsToday()).toBe(1);
  });
});
