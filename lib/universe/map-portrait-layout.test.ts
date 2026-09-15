/**
 * 美術審 H3（C-1 (b)）：直式舞台幾何契約。
 *
 * 用「島 footprint」（tile 內縮盒）而非 tile box 量重疊——tile 四周是透明邊，
 * 橫式的 forest／rescue 用 tile box 量本來就是疊的（設計審實算）。
 * 木牌矩形以目標 scale 下的螢幕固定尺寸反算回 stage。
 */
import { describe, expect, it } from "vitest";
import {
  MAP_STAGE,
  MAP_STAGE_PORTRAIT,
  ZONES,
  getMapStage,
  getZones,
  type ZoneId,
} from "@/data/universe-zones";
import { universe } from "@/data/universe";
import { universeSchema } from "@/data/universe.schema";
import { bridgeEdgesFor, resolveUniverseMap } from "@/lib/universe-map";
import {
  MAP_CONTROLS_STACK_MOBILE,
  MAP_PICKER_HEIGHT,
  MIN_SCALE,
  clampCamera,
  fitScaleFor,
  fitScaleForBox,
  insetCenterOffsetY,
  islandContentBounds,
  islandContentCenter,
  islandFocus,
  isMobilePortrait,
  layoutForViewport,
  poseFor,
  viewportInsetFor,
} from "@/lib/universe/map-camera-utils";

type Box = { left: number; top: number; right: number; bottom: number };

/** 島 footprint：tile 內縮（左右 8%、上 22%、下 6%），近似黏土島本體。 */
function footprint(tile: { left: number; top: number; w: number; h: number }): Box {
  return {
    left: tile.left + tile.w * 0.08,
    right: tile.left + tile.w * 0.92,
    top: tile.top + tile.h * 0.22,
    bottom: tile.top + tile.h * 0.94,
  };
}

function intersects(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function containsPoint(b: Box, p: { x: number; y: number }): boolean {
  return p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom;
}

/** 木牌：反縮放後固定螢幕尺寸（約 100×44），掛在錨點下方 6px。 */
const LABEL_W = 100;
const LABEL_H = 44;
const LABEL_GAP = 6;

function labelBoxStage(
  anchor: { x: number; y: number },
  scale: number,
): Box {
  const w = LABEL_W / scale;
  return {
    left: anchor.x - w / 2,
    right: anchor.x + w / 2,
    top: anchor.y + LABEL_GAP / scale,
    bottom: anchor.y + (LABEL_GAP + LABEL_H) / scale,
  };
}

function toScreen(box: Box, cam: { scale: number; tx: number; ty: number }): Box {
  return {
    left: box.left * cam.scale + cam.tx,
    right: box.right * cam.scale + cam.tx,
    top: box.top * cam.scale + cam.ty,
    bottom: box.bottom * cam.scale + cam.ty,
  };
}

/** 世界層直式的實際首屏 pose（與 useMapCamera.reset 同一算式）。 */
function worldPose(w: number, h: number) {
  const inset = viewportInsetFor(w, h, "portrait", "world");
  const scale = fitScaleFor(w, h, "portrait");
  const pose = poseFor(
    islandContentCenter("portrait"),
    scale,
    w,
    h,
    insetCenterOffsetY(inset),
  );
  return clampCamera(pose, w, h, MAP_STAGE_PORTRAIT, inset);
}

/** ≤480 世界層 MapControls 矩形（螢幕 px）：右下 56 寬、三顆疊高，疊在島選擇列之上。 */
function controlsRectWorld(w: number, h: number): Box {
  return {
    left: w - 10 - 56,
    right: w - 10,
    top: h - 10 - MAP_PICKER_HEIGHT - (56 * 3 + 8 * 2),
    bottom: h - 10 - MAP_PICKER_HEIGHT,
  };
}

function controlsRectIsland(w: number, h: number): Box {
  return {
    left: w - 10 - 56,
    right: w - 10,
    top: h - MAP_CONTROLS_STACK_MOBILE,
    bottom: h - 10,
  };
}

/** 二次貝茲取樣（與 bridgePath 的 Q 命令同形）。 */
function sampleQuad(d: string, n = 24): { x: number; y: number }[] {
  const m = d.match(/M ([-\d.]+) ([-\d.]+) Q ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)/);
  if (!m) throw new Error(`unexpected path: ${d}`);
  const [x0, y0, cx, cy, x1, y1] = m.slice(1).map(Number) as number[];
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * x0! + 2 * u * t * cx! + t * t * x1!,
      y: u * u * y0! + 2 * u * t * cy! + t * t * y1!,
    };
  });
}

function segmentsCross(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
): boolean {
  const cross = (p: typeof a, q: typeof a, r: typeof a) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** ≤480 sticky 頂欄高（`--nav-h` 64 + 1px 邊）：map 視窗＝100dvh − 頂欄。 */
const NAV_H = 65;

/** 裝置視口 → 實際 map 視窗（扣頂欄）。兩組都跑：幾何契約不該只在理想高度成立。 */
const PORTRAIT_VIEWPORTS = [
  [390, 844],
  [390, 844 - NAV_H],
  [375, 812],
  [375, 812 - NAV_H],
  [375, 667],
  [375, 667 - NAV_H],
  [360, 640 - NAV_H],
  [320, 568],
  [320, 568 - NAV_H],
] as const;

describe("layout 契約：預設橫式零差", () => {
  it("getZones() 就是 ZONES；橫式舞台與橋數不變", () => {
    expect(getZones()).toBe(ZONES);
    expect(getMapStage()).toEqual(MAP_STAGE);
    expect(getMapStage("portrait")).toEqual(MAP_STAGE_PORTRAIT);
    const landscape = resolveUniverseMap();
    expect(landscape.layout).toBe("landscape");
    expect(landscape.bridges).toHaveLength(7);
    expect(landscape.stage).toEqual({ width: 1000, height: 720 });
    expect(landscape.viewBox).toBe("0 0 1000 720");
    expect(fitScaleFor(1280, 800)).toBe(fitScaleFor(1280, 800, "landscape"));
    expect(islandFocus("dino")).toEqual(islandFocus("dino", "landscape"));
  });

  it("資料契約：五島都有直式座標與相機，schema 通過", () => {
    expect(() => universeSchema.parse(universe)).not.toThrow();
    for (const zone of universe.zones) {
      expect(zone.worldPortrait.x).toBeGreaterThan(0);
      expect(zone.worldPortrait.x).toBeLessThan(1);
      expect(zone.worldPortrait.y).toBeGreaterThan(0);
      expect(zone.worldPortrait.y).toBeLessThan(1);
      expect(zone.cameraPortrait.center).toEqual([
        zone.worldPortrait.x,
        zone.worldPortrait.y,
      ]);
      expect(zone.cameraPortrait.zoom).toBe(zone.camera.zoom);
    }
  });

  it("isMobilePortrait／layoutForViewport 單一判準", () => {
    expect(isMobilePortrait(390, 844)).toBe(true);
    expect(isMobilePortrait(480, 900)).toBe(true);
    expect(isMobilePortrait(481, 900)).toBe(false);
    expect(isMobilePortrait(390, 390)).toBe(false);
    expect(isMobilePortrait(844, 390)).toBe(false);
    expect(isMobilePortrait(0, 0)).toBe(false);
    expect(layoutForViewport(390, 844)).toBe("portrait");
    expect(layoutForViewport(1280, 800)).toBe("landscape");
    expect(layoutForViewport(768, 1024)).toBe("landscape");
    expect(layoutForViewport(0, 0)).toBe("landscape");
  });
});

describe("直式舞台幾何（C-1 (b)）", () => {
  const map = resolveUniverseMap("portrait");
  const zones = map.zones;
  const byId = new Map(zones.map((z) => [z.id, z] as const));
  const foot = new Map(zones.map((z) => [z.id, footprint(z.tileBox)] as const));

  it("舞台 720×1400、六條橋（直式不畫 rescue–ocean）", () => {
    expect(map.stage).toEqual({ width: 720, height: 1400 });
    expect(map.viewBox).toBe("0 0 720 1400");
    expect(map.bridges).toHaveLength(6);
    expect(map.bridges.map((b) => b.id)).not.toContain("rescue-ocean");
    expect(bridgeEdgesFor("portrait")).toHaveLength(6);
    expect(bridgeEdgesFor()).toHaveLength(7);
  });

  it("五島 footprint 兩兩不相交、全部在舞台內", () => {
    const ids = [...foot.keys()];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        expect(
          intersects(foot.get(ids[i]!)!, foot.get(ids[j]!)!),
          `${ids[i]} ∩ ${ids[j]}`,
        ).toBe(false);
      }
    }
    for (const [id, b] of foot) {
      expect(b.left, `${id} left`).toBeGreaterThanOrEqual(0);
      expect(b.top, `${id} top`).toBeGreaterThanOrEqual(0);
      expect(b.right, `${id} right`).toBeLessThanOrEqual(720);
      expect(b.bottom, `${id} bottom`).toBeLessThanOrEqual(1400);
    }
  });

  it("島心兩兩距離 ≥ 240，dino／rescue 之間留縫給 car-park→forest 的橋", () => {
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const a = zones[i]!.px;
        const b = zones[j]!.px;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(240);
      }
    }
    const dino = byId.get("dino")!.tileBox;
    const rescue = byId.get("rescue")!.tileBox;
    const gap = rescue.left - (dino.left + dino.w);
    expect(gap).toBeGreaterThanOrEqual(100);
    const carPark = byId.get("car-park")!.px;
    expect(carPark.x).toBeGreaterThan(dino.left + dino.w);
    expect(carPark.x).toBeLessThan(rescue.left);
  });

  it("橋不交叉；橋的可見段不穿第三座島", () => {
    const chords = map.bridges.map((b) => ({
      id: b.id,
      from: b.from,
      to: b.to,
      a: b.fromPort,
      b: b.toPort,
      pts: sampleQuad(b.d),
    }));
    for (let i = 0; i < chords.length; i++) {
      for (let j = i + 1; j < chords.length; j++) {
        const p = chords[i]!;
        const q = chords[j]!;
        expect(
          segmentsCross(p.a, p.b, q.a, q.b),
          `${p.id} × ${q.id}`,
        ).toBe(false);
      }
    }
    for (const c of chords) {
      for (const [id, box] of foot) {
        if (id === c.from || id === c.to) continue;
        for (const pt of c.pts) {
          expect(containsPoint(box, pt), `${c.id} 穿過 ${id}`).toBe(false);
        }
      }
    }
  });

  it("390×779（844 扣頂欄）：小島 ≥120px、hero ≥150px，群島落在 chrome-free 盒內", () => {
    const [w, h] = [390, 844 - NAV_H];
    const scale = fitScaleFor(w, h, "portrait");
    expect(scale).toBeGreaterThan(MIN_SCALE);
    expect(264 * scale).toBeGreaterThanOrEqual(120);
    expect(330 * scale).toBeGreaterThanOrEqual(150);
    const cam = worldPose(w, h);
    const inset = viewportInsetFor(w, h, "portrait", "world");
    // 以 tile box 聯集（不含 CONTENT_FIT_PAD）量：pad 只是 fit 的呼吸，不是內容。
    const tileTop = Math.min(...zones.map((z) => z.tileBox.top));
    const tileBottom = Math.max(...zones.map((z) => z.tileBox.top + z.tileBox.h));
    expect(tileTop * cam.scale + cam.ty).toBeGreaterThanOrEqual(inset.top - 1);
    expect(tileBottom * cam.scale + cam.ty).toBeLessThanOrEqual(h - inset.bottom + 1);
    // 木牌（含 ocean 的）也在盒內
    const lowest = Math.max(...zones.map((z) => labelBoxStage(z.px, cam.scale).bottom));
    expect(lowest * cam.scale + cam.ty).toBeLessThanOrEqual(h - inset.bottom + LABEL_H);
    expect(islandContentBounds("portrait").width).toBeLessThanOrEqual(720);
  });

  it("每個直向視窗：直式島不比橫式小；island footprint／木牌 ∩ MapControls = ∅", () => {
    for (const [w, h] of PORTRAIT_VIEWPORTS) {
      const portraitScale = fitScaleFor(w, h, "portrait");
      const landscapeScale = fitScaleFor(w, h, "landscape");
      expect(portraitScale, `${w}×${h}`).toBeGreaterThanOrEqual(landscapeScale);

      const cam = worldPose(w, h);
      const controls = controlsRectWorld(w, h);
      // 群島放得進盒（scale 未被 MIN_SCALE 夾住）時，島身與木牌都不得碰控制鈕；
      // 被地板夾住的極小視窗（360×575／320×503）群島本就溢出可拖曳，只要求島身不碰。
      const floored = portraitScale <= MIN_SCALE + 1e-6;
      for (const z of zones) {
        const fp = toScreen(foot.get(z.id)!, cam);
        expect(intersects(fp, controls), `${z.id} footprint ∩ controls @${w}×${h}`).toBe(false);
        if (floored) continue;
        const label = toScreen(labelBoxStage(z.px, cam.scale), cam);
        expect(intersects(label, controls), `${z.id} 木牌 ∩ controls @${w}×${h}`).toBe(false);
      }
    }
  });

  it("390×779：木牌不進其他島的 footprint、木牌兩兩不相交", () => {
    const scale = fitScaleFor(390, 844 - NAV_H, "portrait");
    const labels = zones.map((z) => [z.id, labelBoxStage(z.px, scale)] as const);
    for (const [id, label] of labels) {
      for (const [other, fp] of foot) {
        if (other === id) continue;
        expect(intersects(label, fp), `${id} 木牌進了 ${other}`).toBe(false);
      }
    }
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        expect(
          intersects(labels[i]![1], labels[j]![1]),
          `${labels[i]![0]} 木牌 ∩ ${labels[j]![0]} 木牌`,
        ).toBe(false);
      }
    }
  });

  it("進島直向：island 盒內置中，不被控制鈕疊高壓到", () => {
    for (const [w, h] of PORTRAIT_VIEWPORTS) {
      for (const id of ["dino", "car-park", "rescue"] as ZoneId[]) {
        const focus = islandFocus(id, "portrait");
        const scale = fitScaleForBox(focus.box, w, h, "portrait");
        const inset = viewportInsetFor(w, h, "portrait", "island");
        const cam = clampCamera(
          poseFor(focus.center, scale, w, h, insetCenterOffsetY(inset)),
          w,
          h,
          MAP_STAGE_PORTRAIT,
          inset,
        );
        const fp = toScreen(foot.get(id)!, cam);
        expect(
          intersects(fp, controlsRectIsland(w, h)),
          `${id} @${w}×${h} 被控制鈕壓到`,
        ).toBe(false);
        expect(fp.top, `${id} @${w}×${h} 頂`).toBeGreaterThanOrEqual(0);
      }
    }
    // 390×779 進島島寬 ≥ 280（設計審預估 ~300）。
    const scale390 = fitScaleForBox(islandFocus("dino", "portrait").box, 390, 844 - NAV_H, "portrait");
    expect(264 * scale390).toBeGreaterThanOrEqual(280);
  });
});
