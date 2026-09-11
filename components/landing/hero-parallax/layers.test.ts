import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BASE_VELOCITY_PX_PER_SECOND,
  PARALLAX_LAYERS,
  TILE_COPIES,
  coveredViewportWidth,
  loopDurationSeconds,
} from "./layers";

type Manifest = {
  layers: Array<{ layer: string; file: string; width: number; height: number }>;
};

const manifest = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../../public/landing/hero-parallax/manifest.json"), "utf8"),
) as Manifest;

describe("PARALLAX_LAYERS 與 compose 產物一致", () => {
  it("每一層的檔名與尺寸都對得上 manifest.json", () => {
    for (const layer of PARALLAX_LAYERS) {
      const built = manifest.layers.find((entry) => entry.layer.toLowerCase() === layer.id);
      expect(built, `${layer.id} 不在 manifest 裡`).toBeDefined();
      expect(path.basename(built!.file)).toBe(layer.file);
      expect({ width: built!.width, height: built!.height }).toEqual({ width: layer.width, height: layer.height });
    }
  });

  it("速度由遠到近遞增，路面是 1.0x 基準", () => {
    const speeds = PARALLAX_LAYERS.map((layer) => layer.speed);
    expect(speeds).toEqual([...speeds].sort((a, b) => a - b));
    expect(PARALLAX_LAYERS.find((layer) => layer.id === "l3")?.speed).toBe(1);
  });
});

describe("loopDurationSeconds", () => {
  it("路面一輪 = tile 寬 ÷ 基準速度", () => {
    const road = PARALLAX_LAYERS.find((layer) => layer.id === "l3")!;
    expect(loopDurationSeconds(road)).toBeCloseTo(road.width / BASE_VELOCITY_PX_PER_SECOND, 5);
  });

  it("越遠的層一輪越久，越近的越快", () => {
    const durations = PARALLAX_LAYERS.map(loopDurationSeconds);
    // l1 (0.3x) 最久；l5 (1.6x) 最快。l3 比 l2 快但 tile 較短，不做嚴格遞減斷言。
    expect(durations[0]).toBeGreaterThan(durations[1]);
    expect(durations[3]).toBeLessThan(durations[1]);
  });
});

describe("coveredViewportWidth", () => {
  const road = PARALLAX_LAYERS.find((layer) => layer.id === "l3")!;

  it("三份最短的 tile 在桌機 scale 1 蓋得住 2560 寬螢幕", () => {
    expect(coveredViewportWidth(road.width, 1, TILE_COPIES)).toBeGreaterThanOrEqual(2560);
  });

  it("手機 scale .5 蓋得住平板橫向 1024", () => {
    expect(coveredViewportWidth(road.width, 0.5, TILE_COPIES)).toBeGreaterThanOrEqual(1024);
  });

  it("兩份只剩一份可見，等於 tile 本身的寬", () => {
    expect(coveredViewportWidth(1920, 1, 2)).toBe(1920);
  });
});
