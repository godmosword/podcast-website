import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CANDY_KART_TRACKS } from "./tracks";

function gdTrackById(id: string): {
  laps: number;
  par_ms: number;
  stars: number;
} | null {
  const src = readFileSync(
    join(process.cwd(), "candy-kart-game/scripts/track_data.gd"),
    "utf8",
  );
  const marker = `"id": "${id}"`;
  const idx = src.indexOf(marker);
  if (idx < 0) return null;
  const slice = src.slice(idx, idx + 2500);
  const laps = slice.match(/"laps":\s*(\d+)/);
  const par = slice.match(/"par_ms":\s*(\d+)/);
  const starsBlock = slice.match(/"stars":\s*\[([\s\S]*?)\n\t\t\],/);
  const starEntries = starsBlock?.[1].match(/\[\s*[\d.-]+,\s*[\d.-]+\s*\]/g);
  return {
    laps: Number(laps?.[1] ?? 0),
    par_ms: Number(par?.[1] ?? 0),
    stars: starEntries?.length ?? 0,
  };
}

describe("candy-kart tracks sync (TS ↔ Godot)", () => {
  it("Godot track_data 與 tracks.ts 的 id / laps / par / starsTotal 一致", () => {
    for (const ts of CANDY_KART_TRACKS) {
      const g = gdTrackById(ts.id);
      expect(g, `missing Godot track ${ts.id}`).not.toBeNull();
      expect(g!.laps).toBe(ts.laps);
      expect(g!.par_ms).toBe(ts.parTimeMs);
      expect(g!.stars).toBe(ts.starsTotal);
    }
  });
});
