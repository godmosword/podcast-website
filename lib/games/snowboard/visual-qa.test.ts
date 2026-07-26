import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SNOWBOARD_MATERIAL_CATALOG,
  SNOWBOARD_VISUAL_POSES,
  SNOWBOARD_VISUAL_STAGES,
  isSnowboardVisualPose,
  isSnowboardVisualStage,
} from "./visual-qa";

const ROOT = process.cwd();

function source(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("snowboard visual QA contract", () => {
  it("景別／姿勢白名單穩定", () => {
    expect(SNOWBOARD_VISUAL_STAGES).toEqual([
      "start",
      "forest",
      "valley",
      "finish",
    ]);
    expect(SNOWBOARD_VISUAL_POSES).toEqual([
      "ride",
      "carve",
      "jump",
      "landing",
    ]);
    expect(isSnowboardVisualStage("forest")).toBe(true);
    expect(isSnowboardVisualStage("space")).toBe(false);
    expect(isSnowboardVisualPose("carve")).toBe(true);
    expect(isSnowboardVisualPose("spin")).toBe(false);
  });

  it("SnowMaterials.CATALOG 與站內常數對齊，且具名 factory 存在", () => {
    const materials = source("snowboard-game/scripts/materials.gd");
    expect(materials).toContain("const CATALOG :=");
    for (const id of SNOWBOARD_MATERIAL_CATALOG) {
      expect(materials).toContain(`"${id}"`);
      if (id === "blob_shadow") {
        expect(materials).toContain("static func blob_shadow(");
      } else {
        expect(materials).toContain(`static func ${id}(`);
      }
    }
    expect(materials).toContain("uv1_scale");
  });

  it("rider／world 使用具名材質（skin／fabric／wood／board_plastic）", () => {
    const rider = source("snowboard-game/scripts/rider.gd");
    const world = source("snowboard-game/scripts/world_builder.gd");
    expect(rider).toContain("SnowMaterials.skin()");
    expect(rider).toContain("SnowMaterials.fabric(");
    expect(rider).toContain("SnowMaterials.board_plastic(");
    expect(world).toContain("SnowMaterials.wood(");
    expect(world).toContain("SnowMaterials.foliage(");
  });

  it("HTML patch 與 iframe-src 轉送 visualStage／visualPose", () => {
    const patch = source("scripts/patch-snowboard-html.mjs");
    const iframe = source("lib/games/snowboard/iframe-src.ts");
    expect(patch).toContain("visualStage");
    expect(patch).toContain("visualPose");
    expect(patch).toContain("--visual-stage=");
    expect(iframe).toContain("isSnowboardVisualStage");
    expect(iframe).toContain("isSnowboardVisualPose");
  });

  it("visual QA 不寫成績（main 略過 debug finish／finish bridge）", () => {
    const main = source("snowboard-game/scripts/main.gd");
    expect(main).toContain("visual_qa");
    expect(main).toContain("if not visual_qa:");
    expect(main).toContain("send_debug_finish_if_requested");
    expect(main).toContain("_start_visual_qa");
  });
});
