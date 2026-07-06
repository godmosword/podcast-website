import { describe, expect, it } from "vitest";
import { computeZoneProgress } from "./useZoneProgress";

describe("computeZoneProgress", () => {
  const zoneMap = {
    "car-park": { slugs: ["ep-1", "ep-3", "ep-11"] },
    dino: { slugs: ["ep-9", "ep-15"] },
    ocean: { slugs: [] as string[] },
  };

  it("以 storiesCompleted 交集計算各島 completed/total", () => {
    const progress = computeZoneProgress(zoneMap, ["ep-1", "ep-9", "ep-15"]);
    expect(progress["car-park"]).toEqual({ completed: 1, total: 3 });
    expect(progress.dino).toEqual({ completed: 2, total: 2 });
    expect(progress.ocean).toEqual({ completed: 0, total: 0 });
  });

  it("完成清單含未對映 slug 不影響計數", () => {
    const progress = computeZoneProgress(zoneMap, ["ep-999"]);
    expect(progress["car-park"]).toEqual({ completed: 0, total: 3 });
  });

  it("零進度（SSG 首次 render 狀態）", () => {
    const progress = computeZoneProgress(zoneMap, []);
    for (const value of Object.values(progress)) {
      expect(value.completed).toBe(0);
    }
  });
});
