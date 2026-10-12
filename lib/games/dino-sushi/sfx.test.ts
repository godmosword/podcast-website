import { describe, expect, it } from "vitest";
import { MAX_VOICES_PER_CALL, type SynthVoice } from "@/lib/gamekit/runtime/audio";
import { MOOD_RANK } from "./reactions";
import { addSfx, allSushiSfx, MOOD_SFX, plateSfx, SUSHI_SFX, varied } from "./sfx";

/** 一組聲音從起點到最後一個音收尾的秒數。 */
function length(voices: readonly SynthVoice[]): number {
  return Math.max(...voices.map((v) => (v.at ?? 0) + v.dur));
}

describe("多多壽司屋音效", () => {
  it("每個音效都在合理範圍：短、小聲、聽得到的頻率、不超過單次音色上限", () => {
    for (const [key, voices] of Object.entries(allSushiSfx())) {
      expect(voices.length, key).toBeGreaterThan(0);
      expect(voices.length, key).toBeLessThanOrEqual(MAX_VOICES_PER_CALL);
      expect(length(voices), key).toBeLessThanOrEqual(1.7);
      for (const v of voices) {
        expect(v.dur, key).toBeGreaterThan(0);
        expect(v.vol, key).toBeGreaterThan(0);
        // 兒童向：單一音色峰值上限 0.2（再乘 sfx 分軌 0.85×遊戲音量）
        expect(v.vol, key).toBeLessThanOrEqual(0.2);
        expect(v.at ?? 0, key).toBeGreaterThanOrEqual(0);
        if (v.wave !== "noise") {
          expect(v.freq, key).toBeGreaterThanOrEqual(60);
          expect(v.freq, key).toBeLessThanOrEqual(6000);
        }
      }
    }
  });

  it("每種反應都有自己的音", () => {
    for (const mood of Object.keys(MOOD_RANK) as (keyof typeof MOOD_RANK)[]) {
      expect(MOOD_SFX[mood].length, mood).toBeGreaterThan(0);
    }
  });

  it("嚼嚼聲在多多做出反應前收尾（咀嚼到反應相隔 450ms）", () => {
    expect(length(SUSHI_SFX.chomp)).toBeLessThanOrEqual(0.45);
  });

  it("加料的啵一層比一層高，放到第 3 層之後不再升高", () => {
    const pitch = (layer: number) => addSfx(layer)[0]!.freq!;
    expect(pitch(2)).toBeGreaterThan(pitch(1));
    expect(pitch(3)).toBeGreaterThan(pitch(2));
    expect(pitch(4)).toBe(pitch(3));
    expect(pitch(0)).toBe(pitch(1));
  });

  it("金邊盤比一般盤多一串亮晶晶", () => {
    expect(plateSfx(true).length).toBeGreaterThan(plateSfx(false).length);
  });

  it("varied 只把音高整組挪 ±3%，噪音、長度、音量不變", () => {
    const base = SUSHI_SFX.chomp;
    const up = varied(base, () => 1);
    const down = varied(base, () => 0);
    base.forEach((v, i) => {
      expect(up[i]!.dur).toBe(v.dur);
      expect(up[i]!.vol).toBe(v.vol);
      if (v.wave === "noise") {
        expect(up[i]).toBe(v);
      } else {
        expect(up[i]!.freq).toBeCloseTo(v.freq! * 1.03);
        expect(down[i]!.freq).toBeCloseTo(v.freq! * 0.97);
      }
    });
  });
});
