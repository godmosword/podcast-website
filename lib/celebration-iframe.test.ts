import { describe, expect, it } from "vitest";
import {
  buildCelebrationIframeMessage,
  celebrationEventFromKartFinish,
} from "./celebration-iframe";

describe("celebration-iframe", () => {
  it("buildCelebrationIframeMessage 符合契約", () => {
    const msg = buildCelebrationIframeMessage("game_race_finish", "burst");
    expect(msg).toEqual({
      source: "cheche-celebration",
      type: "celebrate",
      event: "game_race_finish",
      intensity: "burst",
    });
  });

  it("kart finish 映射為 game_race_finish", () => {
    expect(
      celebrationEventFromKartFinish({
        source: "cheche-candy-kart",
        type: "race-finish",
        trackId: "macaron-meadow",
        playerPos: 1,
        totalMs: 50_000,
        bestLapMs: 16_000,
        starsCollected: 7,
        starsTotal: 7,
      }),
    ).toBe("game_race_finish");
  });
});
