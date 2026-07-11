import { describe, expect, it, beforeEach } from "vitest";
import { createCelebrationScheduler } from "./celebration";

describe("celebration scheduler", () => {
  let scheduler = createCelebrationScheduler();

  beforeEach(() => {
    scheduler = createCelebrationScheduler();
  });

  it("允許首次 spark 事件", () => {
    const decision = scheduler.request("favorite_added", 1_000);
    expect(decision.allowed).toBe(true);
    expect(decision.intensity).toBe("spark");
    expect(decision.particleCount).toBe(6);
    expect(decision.playSfx).toBe("collect");
  });

  it("同事件合併視窗內拒絕重複", () => {
    expect(scheduler.request("favorite_added", 1_000).allowed).toBe(true);
    expect(scheduler.request("favorite_added", 1_200).allowed).toBe(false);
    expect(scheduler.request("favorite_added", 2_500).allowed).toBe(true);
  });

  it("burst 強度冷卻阻擋連發", () => {
    expect(scheduler.request("game_race_finish", 1_000).allowed).toBe(true);
    expect(scheduler.request("game_race_finish", 1_500).allowed).toBe(false);
    expect(scheduler.request("game_race_finish", 4_500).allowed).toBe(true);
  });

  it("whisper 事件無粒子", () => {
    const decision = scheduler.request("story_end", 5_000);
    expect(decision.allowed).toBe(true);
    expect(decision.particleCount).toBe(0);
    expect(decision.playSfx).toBeNull();
  });
});
