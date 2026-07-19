import { describe, expect, it } from "vitest";
import { MAP_STAGE, ZONES } from "@/data/universe-zones";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import {
  DRAG_SLOP_PX,
  FIT_MARGIN,
  INERTIA_DECAY_TAU,
  MAX_SCALE,
  MIN_SCALE,
  RECENTER_VISIBLE_MARGIN_PX,
  anyPointVisible,
  blendVelocity,
  clampCamera,
  clampScale,
  decayVelocity,
  exceedsDragSlop,
  fitScaleFor,
  islandContentBounds,
  wheelZoomFactor,
} from "./map-camera-utils";

describe("map-camera-utils", () => {
  it("wheelZoomFactor 向上滾放大、向下滾縮小", () => {
    expect(wheelZoomFactor(-50)).toBeGreaterThan(1);
    expect(wheelZoomFactor(50)).toBeLessThan(1);
  });

  it("clampScale 夾在 MIN_SCALE–MAX_SCALE", () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(99)).toBe(MAX_SCALE);
    expect(clampScale(1)).toBe(1);
  });

  it("FIT_MARGIN 維持 0.96（手機島群可讀、五島不裁切）", () => {
    expect(FIT_MARGIN).toBe(0.96);
  });

  it("islandContentBounds 包住五島 tile（小於整張 MAP_STAGE）", () => {
    const bounds = islandContentBounds();
    expect(bounds.width).toBeLessThan(MAP_STAGE.width);
    expect(bounds.height).toBeLessThan(MAP_STAGE.height);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);

    for (const zone of ZONES) {
      const tile = getZoneArtTile(zone.id);
      if (tile.mode !== "island") continue;
      const [ax, ay] = tile.anchorUV;
      const left = zone.coord.x - ax * tile.stageSize.w;
      const right = zone.coord.x + (1 - ax) * tile.stageSize.w;
      const top = zone.coord.y - ay * tile.stageSize.h;
      const bottom = zone.coord.y + (1 - ay) * tile.stageSize.h;
      expect(left).toBeGreaterThanOrEqual(bounds.minX);
      expect(right).toBeLessThanOrEqual(bounds.maxX);
      expect(top).toBeGreaterThanOrEqual(bounds.minY);
      expect(bottom).toBeLessThanOrEqual(bounds.maxY);
    }
  });

  it("fitScaleFor 依島群 bbox contain-fit × FIT_MARGIN（比整舞台更近）", () => {
    const bounds = islandContentBounds();
    // 寬受限（大視窗可能觸頂 MAX_SCALE）
    expect(fitScaleFor(2000, 3000)).toBeCloseTo(
      clampScale((2000 / bounds.width) * FIT_MARGIN),
      6,
    );
    // 高受限
    expect(fitScaleFor(5000, 1440)).toBeCloseTo(
      clampScale((1440 / bounds.height) * FIT_MARGIN),
      6,
    );
    // 手機 375：島群 fit 必須嚴謹大於整舞台 fit（五島更飽滿）
    const mobile = fitScaleFor(375, 748);
    const stageFit = clampScale(
      Math.min(375 / MAP_STAGE.width, 748 / MAP_STAGE.height) * FIT_MARGIN,
    );
    expect(mobile).toBeGreaterThan(stageFit);
  });

  it("fitScaleFor 邊界：0 尺寸回 1、極端尺寸夾 clamp", () => {
    expect(fitScaleFor(0, 800)).toBe(1);
    expect(fitScaleFor(1280, 0)).toBe(1);
    expect(fitScaleFor(100, 100)).toBe(MIN_SCALE);
    expect(fitScaleFor(100000, 100000)).toBe(MAX_SCALE);
  });

  it("clampCamera 在舞台放得下時置中", () => {
    expect(clampCamera({ scale: 1, tx: 999, ty: -999 }, 1280, 900)).toEqual({
      scale: 1,
      tx: (1280 - MAP_STAGE.width) / 2,
      ty: (900 - MAP_STAGE.height) / 2,
    });
  });

  it("clampCamera 允許放大後的角落島置中", () => {
    const scale = 1.6;
    const viewport = { w: 375, h: 667 };
    const dino = { x: 210, y: 260 };

    expect(
      clampCamera(
        {
          scale,
          tx: viewport.w / 2 - dino.x * scale,
          ty: viewport.h / 2 - dino.y * scale,
        },
        viewport.w,
        viewport.h,
      ),
    ).toEqual({
      scale,
      tx: viewport.w / 2 - dino.x * scale,
      ty: viewport.h / 2 - dino.y * scale,
    });
  });

  it("clampCamera 於 FOCUS_SCALE 保留 dock offset（舞台大於視窗時不吃掉 viewportOffsetY）", () => {
    // T6 點島置中一致化：第一次點擊 fly-to 帶 dock offset，第二次開 sheet 不再位移。
    // 前提是 clampCamera 在舞台大於視窗（此處 1000×720 × 1.6 = 1600×1152）時，
    // 不會把 flyTo 算出的含 offset ty 夾回置中。tested viewports 375/1280 皆成立。
    const scale = 1.6;
    const offsetY = 96;
    const dino = { x: 210, y: 260 };
    for (const viewport of [
      { w: 375, h: 667 },
      { w: 1280, h: 800 },
    ]) {
      const tx = viewport.w / 2 - dino.x * scale;
      const ty = viewport.h / 2 - dino.y * scale + offsetY;
      expect(clampCamera({ scale, tx, ty }, viewport.w, viewport.h)).toEqual({
        scale,
        tx,
        ty,
      });
    }
  });

  it("clampCamera 夾住超出可置中範圍的平移", () => {
    const scale = 1.6;
    expect(clampCamera({ scale, tx: 9999, ty: 9999 }, 375, 667)).toEqual({
      scale,
      tx: 375 / 2,
      ty: 667 / 2,
    });
    expect(clampCamera({ scale, tx: -9999, ty: -9999 }, 375, 667)).toEqual({
      scale,
      tx: 375 / 2 - MAP_STAGE.width * scale,
      ty: 667 / 2 - MAP_STAGE.height * scale,
    });
  });

  it("exceedsDragSlop：門檻內不算拖曳、門檻外才算（含斜向）", () => {
    expect(exceedsDragSlop(0, 0)).toBe(false);
    expect(exceedsDragSlop(DRAG_SLOP_PX - 1, 0)).toBe(false);
    expect(exceedsDragSlop(0, DRAG_SLOP_PX - 1)).toBe(false);
    // 剛好等於門檻即成立（>=）
    expect(exceedsDragSlop(DRAG_SLOP_PX, 0)).toBe(true);
    // 斜向：3-4-5，slop=4 時位移 5 應越過
    expect(exceedsDragSlop(3, 4, 4)).toBe(true);
    expect(exceedsDragSlop(3, 2, 4)).toBe(false);
  });

  it("decayVelocity：指數衰減、時間越長越慢、經過 TAU 約為 1/e", () => {
    const v = 1;
    expect(decayVelocity(v, 0)).toBe(1);
    expect(decayVelocity(v, INERTIA_DECAY_TAU)).toBeCloseTo(Math.exp(-1), 6);
    // 單調遞減
    expect(decayVelocity(v, 50)).toBeGreaterThan(decayVelocity(v, 100));
    // 保留方向（負速度仍為負）
    expect(decayVelocity(-2, 100)).toBeLessThan(0);
  });

  it("decayVelocity：時間無關於幀率——兩段 8ms 等同一段 16ms", () => {
    const oneStep = decayVelocity(1, 16);
    const twoSteps = decayVelocity(decayVelocity(1, 8), 8);
    expect(twoSteps).toBeCloseTo(oneStep, 12);
  });

  it("blendVelocity：alpha=0 取舊值、alpha=1 取新值、中間為加權", () => {
    expect(blendVelocity(2, 8, 0)).toBe(2);
    expect(blendVelocity(2, 8, 1)).toBe(8);
    expect(blendVelocity(2, 8, 0.5)).toBeCloseTo(5, 6);
  });

  it("anyPointVisible：島心在視窗內（含 margin）為 true", () => {
    const cam = { scale: 1, tx: 0, ty: 0 };
    expect(anyPointVisible(cam, 1280, 800, [{ x: 500, y: 400 }])).toBe(true);
    // margin 內：略超出右緣但在寬容範圍
    expect(
      anyPointVisible(cam, 1280, 800, [
        { x: 1280 + RECENTER_VISIBLE_MARGIN_PX - 1, y: 400 },
      ]),
    ).toBe(true);
  });

  it("anyPointVisible：全部島心離場為 false（迷路自救觸發條件）", () => {
    // MAX_SCALE=2、桌機 1280×800：舞台右上角海域（tx=-1360, ty=400）所有島心皆出視窗
    const cam = { scale: 2, tx: -1360, ty: 400 };
    const coords = [
      { x: 500, y: 400 },
      { x: 210, y: 260 },
      { x: 820, y: 250 },
      { x: 820, y: 560 },
      { x: 210, y: 560 },
    ];
    expect(anyPointVisible(cam, 1280, 800, coords)).toBe(false);
    // 只要任一島心回到視窗即 true
    expect(
      anyPointVisible(cam, 1280, 800, [...coords, { x: 800, y: 100 }]),
    ).toBe(true);
  });

  it("anyPointVisible：viewport 未量測（0 尺寸）時視為可見，不誤觸自救", () => {
    expect(anyPointVisible({ scale: 1, tx: 0, ty: 0 }, 0, 0, [{ x: 99999, y: 99999 }])).toBe(
      true,
    );
  });
});
