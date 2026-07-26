import { describe, expect, it } from "vitest";
import { MAP_STAGE, ZONES } from "@/data/universe-zones";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import {
  DRAG_SLOP_PX,
  FIT_MARGIN,
  INERTIA_DECAY_TAU,
  DOUBLE_TAP_DIST_PX,
  DOUBLE_TAP_MS,
  MAX_FLY_MS,
  MAX_SCALE,
  MIN_FLY_MS,
  MIN_SCALE,
  PORTRAIT_MAX_ZOOM,
  RECENTER_VISIBLE_MARGIN_PX,
  anyPointVisible,
  cameraCenter,
  isDoubleTap,
  blendVelocity,
  clampCamera,
  bucketMapScale,
  clampScale,
  decayVelocity,
  exceedsDragSlop,
  fitScaleFor,
  flyDurationFor,
  flyPathLength,
  islandContentBounds,
  islandContentCenter,
  poseFor,
  wheelZoomFactor,
  zoomCameraAt,
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

  it("bucketMapScale 以 0.25 級距量化", () => {
    expect(bucketMapScale(1.0)).toBe(1);
    expect(bucketMapScale(1.12)).toBe(1);
    expect(bucketMapScale(1.13)).toBe(1.25);
    expect(bucketMapScale(0.1)).toBe(0.25);
  });

  it("zoomCameraAt 維持焦點下的舞台點", () => {
    const cam = { scale: 1, tx: 100, ty: 50 };
    const next = zoomCameraAt(cam, 2, 200, 100);
    expect(next.scale).toBe(2);
    // 焦點 (200,100) 對應舞台點在縮放前後應投影到同一螢幕點
    const stageX = (200 - cam.tx) / cam.scale;
    const stageY = (100 - cam.ty) / cam.scale;
    expect(stageX * next.scale + next.tx).toBeCloseTo(200);
    expect(stageY * next.scale + next.ty).toBeCloseTo(100);
  });

  it("zoomCameraAt 達上限時不漂移", () => {
    const cam = { scale: MAX_SCALE, tx: 10, ty: 20 };
    expect(zoomCameraAt(cam, 1.5, 100, 100)).toEqual(cam);
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

  it("fitScaleFor：橫向 contain-fit；直向偏向填滿高度（減少上下空海）", () => {
    const bounds = islandContentBounds();
    // 橫向・高受限
    expect(fitScaleFor(5000, 1440)).toBeCloseTo(
      clampScale((1440 / bounds.height) * FIT_MARGIN),
      6,
    );
    // 橫向・寬受限
    expect(fitScaleFor(1000, 900)).toBeCloseTo(
      clampScale((1000 / bounds.width) * FIT_MARGIN),
      6,
    );
    // 直向：min(高度fit, contain×PORTRAIT_MAX_ZOOM)，且嚴謹大於純寬度 contain
    const portraitContain = Math.min(400 / bounds.width, 900 / bounds.height);
    expect(fitScaleFor(400, 900)).toBeCloseTo(
      clampScale(
        Math.min(900 / bounds.height, portraitContain * PORTRAIT_MAX_ZOOM) *
          FIT_MARGIN,
      ),
      6,
    );
    expect(fitScaleFor(400, 900)).toBeGreaterThan(
      clampScale(portraitContain * FIT_MARGIN),
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

  it("isDoubleTap：時間與位移皆在門檻內才算雙擊", () => {
    const prev = { t: 1000, x: 100, y: 100 };
    // 命中：150ms、位移 5px
    expect(isDoubleTap(prev, { t: 1150, x: 105, y: 100 })).toBe(true);
    // 無前次點擊
    expect(isDoubleTap(null, { t: 1150, x: 105, y: 100 })).toBe(false);
    // 超時
    expect(
      isDoubleTap(prev, { t: 1000 + DOUBLE_TAP_MS + 1, x: 100, y: 100 }),
    ).toBe(false);
    // 超距（位移剛好達門檻視為分開）
    expect(
      isDoubleTap(prev, { t: 1100, x: 100 + DOUBLE_TAP_DIST_PX, y: 100 }),
    ).toBe(false);
  });
});

describe("poseFor / cameraCenter", () => {
  it("poseFor 把指定舞台點置中於視窗", () => {
    const pose = poseFor({ x: 400, y: 300 }, 2, 800, 600);
    // 400*2 + tx 應等於視窗中心 400
    expect(pose.tx).toBe(800 / 2 - 400 * 2);
    expect(pose.ty).toBe(600 / 2 - 300 * 2);
    expect(400 * pose.scale + pose.tx).toBe(400);
    expect(300 * pose.scale + pose.ty).toBe(300);
  });

  it("poseFor 的 offsetY 把舞台往下推（島在畫面上移）", () => {
    const base = poseFor({ x: 400, y: 300 }, 1, 800, 600);
    const shifted = poseFor({ x: 400, y: 300 }, 1, 800, 600, 40);
    expect(shifted.ty - base.ty).toBe(40);
    expect(shifted.tx).toBe(base.tx);
  });

  it("cameraCenter 是 poseFor 的反函式", () => {
    const coord = { x: 175, y: 300 };
    const pose = poseFor(coord, 1.6, 390, 740);
    const back = cameraCenter(pose, 390, 740);
    expect(back.x).toBeCloseTo(coord.x, 10);
    expect(back.y).toBeCloseTo(coord.y, 10);
  });
});

describe("flyPathLength / flyDurationFor（van Wijk 距離推導）", () => {
  const W = 390;
  const H = 740;
  const at = (x: number, y: number, scale: number) =>
    poseFor({ x, y }, scale, W, H);

  it("純縮放（無位移）走退化分支，回傳有限正值", () => {
    const S = flyPathLength(at(500, 360, 0.6), at(500, 360, 1.2), W, H);
    expect(Number.isFinite(S)).toBe(true);
    expect(S).toBeGreaterThan(0);
  });

  it("同一鏡頭的路徑長為 0", () => {
    expect(flyPathLength(at(500, 360, 1), at(500, 360, 1), W, H)).toBeCloseTo(0, 10);
  });

  it("純平移：距離越遠路徑長越大", () => {
    const from = at(200, 360, 1);
    const near = flyPathLength(from, at(300, 360, 1), W, H);
    const far = flyPathLength(from, at(800, 360, 1), W, H);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
  });

  it("路徑長對稱：S(a→b) === S(b→a)", () => {
    const a = at(175, 300, 0.6);
    const b = at(825, 560, 1.6);
    expect(flyPathLength(a, b, W, H)).toBeCloseTo(flyPathLength(b, a, W, H), 10);
  });

  it("縮放取對數尺度：低倍率端的同倍數放大感知距離更大", () => {
    const low = flyPathLength(at(500, 360, 0.34), at(500, 360, 0.68), W, H);
    const high = flyPathLength(at(500, 360, 1.0), at(500, 360, 2.0), W, H);
    // 兩者都是放大一倍，對數尺度下應相等（這正是不用線性尺度的理由）
    expect(low).toBeCloseTo(high, 10);
    // 而同樣的「絕對 scale 差」在低倍率端感知距離遠大於高倍率端
    const lowDelta = flyPathLength(at(500, 360, 0.34), at(500, 360, 1.34), W, H);
    const highDelta = flyPathLength(at(500, 360, 1.0), at(500, 360, 2.0), W, H);
    expect(lowDelta).toBeGreaterThan(highDelta);
  });

  it("視窗未量測（0 尺寸）回傳 0 路徑長與最小時長", () => {
    const a = { scale: 1, tx: 0, ty: 0 };
    const b = { scale: 2, tx: 100, ty: 100 };
    expect(flyPathLength(a, b, 0, 0)).toBe(0);
    expect(flyDurationFor(a, b, 0, 0)).toBe(MIN_FLY_MS);
  });

  it("flyDurationFor 夾在 MIN_FLY_MS–MAX_FLY_MS 之間", () => {
    // 零位移 → 撞下限
    expect(flyDurationFor(at(500, 360, 1), at(500, 360, 1), W, H)).toBe(MIN_FLY_MS);
    // 跨全圖 + 極端縮放 → 撞上限
    expect(
      flyDurationFor(at(0, 0, MIN_SCALE), at(MAP_STAGE.width, MAP_STAGE.height, MAX_SCALE), W, H),
    ).toBe(MAX_FLY_MS);
  });

  it("代表性場景釘樁：進島約 390ms、雙擊放大約 245ms（手機直向）", () => {
    const fit = fitScaleFor(W, H);
    const world = poseFor(islandContentCenter(), fit, W, H);

    // 進島：車車樂園（唯一 open 的島）
    const carPark = ZONES.find((z) => z.id === "car-park")!;
    const enterMs = flyDurationFor(world, poseFor(carPark.coord, 1.6, W, H), W, H);
    expect(enterMs).toBeGreaterThan(330);
    expect(enterMs).toBeLessThan(460);

    // 雙擊：原地放大 1.8 倍，焦點偏視窗 1/4 寬
    const center = islandContentCenter();
    const tapScale = clampScale(fit * 1.8);
    const tapMs = flyDurationFor(
      world,
      poseFor({ x: center.x + W / 4 / fit, y: center.y }, tapScale, W, H),
      W,
      H,
    );
    expect(tapMs).toBeGreaterThan(200);
    expect(tapMs).toBeLessThan(300);
  });

  it("近島比遠島快：forest（近中心）< ocean（角落）", () => {
    const fit = fitScaleFor(W, H);
    const world = poseFor(islandContentCenter(), fit, W, H);
    const forest = ZONES.find((z) => z.id === "forest")!;
    const ocean = ZONES.find((z) => z.id === "ocean")!;
    const forestMs = flyDurationFor(world, poseFor(forest.coord, 1.6, W, H), W, H);
    const oceanMs = flyDurationFor(world, poseFor(ocean.coord, 1.6, W, H), W, H);
    expect(forestMs).toBeLessThan(oceanMs);
  });
});
