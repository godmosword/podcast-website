import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CANDY_KART_MATERIAL_CATALOG } from "./materials-contract";

const ROOT = resolve(process.cwd());

function readGame(rel: string): string {
  return readFileSync(resolve(ROOT, "candy-kart-game", rel), "utf8");
}

describe("candy-kart materials contract", () => {
  it("站內 CATALOG 與 KartMaterials.CATALOG 對齊", () => {
    const source = readGame("scripts/materials.gd");
    for (const id of CANDY_KART_MATERIAL_CATALOG) {
      expect(source).toContain(`"${id}"`);
    }
    expect(source).toContain("class_name KartMaterials");
    expect(source).toContain("static func skin(");
    expect(source).toContain("static func fabric(");
    expect(source).toContain("static func kart_shell(");
    expect(source).toContain("static func rubber(");
  });

  it("TrackBuilder 走 KartMaterials.road／wood／foliage", () => {
    const track = readGame("scripts/track_builder.gd");
    expect(track).toContain("KartMaterials.road()");
    expect(track).toContain("KartMaterials.wood(");
    expect(track).toContain("KartMaterials.foliage(");
    expect(track).toContain("KartMaterials.solid(");
  });

  it("Kart 貼地用 sample_baked_with_rotation，車體用具名材質", () => {
    const kart = readGame("scripts/kart.gd");
    expect(kart).toContain("sample_baked_with_rotation");
    expect(kart).toContain("KartMaterials.kart_shell(");
    expect(kart).toContain("KartMaterials.skin()");
    expect(kart).toContain("KartMaterials.fabric(");
    expect(kart).toContain("KartMaterials.rubber()");
    expect(kart).toContain("_ground_up");
  });
});
