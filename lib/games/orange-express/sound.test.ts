import { describe, expect, it } from "vitest";
import { CHIME_SETS, chimeWithinLimits, jointClack } from "@/lib/games/orange-express/chime";
import { MIX_CEILING, driveMix, jointsCrossed } from "@/lib/games/orange-express/sound";
import type { BrakeNotch, PowerNotch } from "@/lib/games/orange-express/types";

describe("駕駛聲音", () => {
  it("停著又沒推桿時完全安靜", () => {
    expect(driveMix(0, 0, 0)).toMatchObject({ humVol: 0, whineVol: 0, hissVol: 0 });
  });

  it("馬達聲隨速度變高", () => {
    const slow = driveMix(0.2, 2, 0);
    const fast = driveMix(0.8, 2, 0);
    expect(fast.humFreq).toBeGreaterThan(slow.humFreq);
    expect(fast.whineFreq).toBeGreaterThan(slow.whineFreq);
    expect(fast.humVol).toBeGreaterThan(slow.humVol);
  });

  it("推動力時有加速的高音，煞車一拉就收掉並出現嘶聲", () => {
    const pushing = driveMix(0.5, 3, 0);
    const braking = driveMix(0.5, 3, 2);
    expect(pushing.whineVol).toBeGreaterThan(braking.whineVol);
    expect(pushing.hissVol).toBe(0);
    expect(braking.hissVol).toBeGreaterThan(0);
    expect(driveMix(0, 0, 4).hissVol).toBe(0);
  });

  it("每一層都不超過音量上限", () => {
    for (const speed of [0, 0.3, 0.6, 1, 2]) {
      for (const power of [0, 1, 2, 3, 4] as PowerNotch[]) {
        for (const brake of [0, 1, 2, 3, 4, 5] as BrakeNotch[]) {
          const mix = driveMix(speed, power, brake);
          expect(mix.humVol).toBeLessThanOrEqual(MIX_CEILING);
          expect(mix.whineVol).toBeLessThanOrEqual(MIX_CEILING);
          expect(mix.hissVol).toBeLessThanOrEqual(MIX_CEILING);
        }
      }
    }
  });

  it("軌道接縫：跨過幾格就喀噠幾次，倒車也算", () => {
    expect(jointsCrossed(0.04, 0.06)).toBe(1);
    expect(jointsCrossed(0.06, 0.07)).toBe(0);
    expect(jointsCrossed(0.31, 0.29)).toBe(1);
    expect(jointsCrossed(Number.NaN, 0.2)).toBe(0);
  });

  it("喇叭、喀、喀噠、鈴都在短音限制內", () => {
    for (const set of CHIME_SETS) expect(chimeWithinLimits(set)).toBe(true);
    for (const speed of [0, 0.5, 1, 3]) expect(chimeWithinLimits(jointClack(speed))).toBe(true);
  });
});
