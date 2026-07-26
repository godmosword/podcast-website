import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAR_ADVENTURE_CLAY,
  CAR_ADVENTURE_MATERIAL_CATALOG,
} from "./materials-contract";

const ROOT = resolve(process.cwd());

function readRender(): string {
  return readFileSync(
    resolve(ROOT, "lib/games/car-adventure/render.ts"),
    "utf8",
  );
}

describe("car-adventure materials contract", () => {
  it("catalog 具名筆刷齊全", () => {
    expect(CAR_ADVENTURE_MATERIAL_CATALOG).toEqual([
      "soil",
      "grass",
      "brick",
      "platform",
      "car_shell",
      "rubber",
      "coin",
      "spike",
      "wood",
      "candy",
    ]);
  });

  it("render 匯入 CLAY 且標註具名筆刷", () => {
    const render = readRender();
    expect(render).toContain("materials-contract");
    expect(render).toContain("CAR_ADVENTURE_CLAY");
    for (const id of CAR_ADVENTURE_MATERIAL_CATALOG) {
      expect(render).toContain(`brush:${id}`);
    }
    expect(render).toContain("CLAY.rubber");
    expect(render).toContain("CLAY.wood");
    expect(render).toContain("CLAY.shellHighlight");
  });

  it("drawCar 支援輪子相位與 hurt squash", () => {
    const render = readRender();
    expect(render).toContain("wheelPhase");
    expect(render).toContain("squashY");
    expect(render).toContain("function drawCar(");
  });

  it("CLAY 色票為穩定 hex／rgba 字串", () => {
    for (const [key, value] of Object.entries(CAR_ADVENTURE_CLAY)) {
      expect(typeof value, key).toBe("string");
      expect(value.length, key).toBeGreaterThan(3);
    }
  });
});
