import { describe, expect, it } from "vitest";
import { CHIME_SETS, chimeWithinLimits } from "@/lib/games/orange-express/chime";

describe("小橘特快車鈴與喇叭", () => {
  it("每一組都不超過長度、音量與音數", () => {
    for (const set of CHIME_SETS) {
      expect(chimeWithinLimits(set)).toBe(true);
    }
  });
});
