import { MAP_STAGE, ZONES, type ZoneId } from "@/data/universe-zones";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";

/** 鏡頭縮放下限（zoom-out 到底）。 */
export const MIN_SCALE = 0.34;

/** 鏡頭縮放上限（zoom-in 到底）。2.4→2.0：幼兒 zoom 過近後整片海找不到島，
 *  收斂上限讓「最放大」仍看得到至少一座島的機率大增（A′ 馴化鏡頭）。 */
export const MAX_SCALE = 2.0;

/** 預設鏡頭比 fit 再退一點，讓島群不貼視窗邊、保留拖曳呼吸感。
 *  0.96：配合島群 bbox fit，手機首屏五島可讀且不裁切。 */
export const FIT_MARGIN = 0.96;

/**
 * 島群 fit 外緣留白（stage px）：木牌／狀態 pill 與島 tile 外框之間的呼吸。
 * 不含 MAP_STAGE 空白海面——fit 對齊島群而非整張舞台。
 */
export const CONTENT_FIT_PAD = 36;

export type IslandContentBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

/** 五島 tile 聯集 bbox（含 CONTENT_FIT_PAD），供預設 fit 使用。 */
export function islandContentBounds(): IslandContentBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const zone of ZONES) {
    const tile = getZoneArtTile(zone.id);
    if (tile.mode !== "island") continue;
    const [ax, ay] = tile.anchorUV;
    const { w, h } = tile.stageSize;
    minX = Math.min(minX, zone.coord.x - ax * w);
    maxX = Math.max(maxX, zone.coord.x + (1 - ax) * w);
    minY = Math.min(minY, zone.coord.y - ay * h);
    maxY = Math.max(maxY, zone.coord.y + (1 - ay) * h);
  }

  minX -= CONTENT_FIT_PAD;
  minY -= CONTENT_FIT_PAD;
  maxX += CONTENT_FIT_PAD;
  maxY += CONTENT_FIT_PAD;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** 把 scale 夾在 MIN_SCALE–MAX_SCALE。 */
export function clampScale(scale: number): number {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

/** landmark 模式（歷史 fallback）的構圖框，對齊 `lib/universe-map.ts` 的 tileBox。 */
const LANDMARK_BOX = { w: 184, h: 150 } as const;

/**
 * 木牌欄在錨點下方佔的讓位（stage px）：木牌反縮放後約 44 螢幕 px，
 * 焦點往下推半個木牌高，島與木牌才一起落在畫面中央。
 */
export const NAMEPLATE_FOCUS_ALLOWANCE = 14;

export type IslandFocus = {
  /** 應置中於視窗的舞台座標（島圖視覺中心，非沙岸錨點）。 */
  center: { x: number; y: number };
  /** 島構圖框（stage px）：供 flyTo 夾住「島放得進畫面」的縮放上限。 */
  box: { w: number; h: number };
};

/**
 * 進島鏡頭焦點：island tile 的 anchorUV 是**沙岸底中心**（[0.5, 0.84]），
 * 直接把 zone.coord 置中會讓 84% 的島高落在畫面上緣（島頂被切）。
 * 故焦點取 tile box 視覺中心，再為木牌欄讓位。
 */
export function islandFocus(zoneId: ZoneId): IslandFocus {
  const zone = ZONES.find((z) => z.id === zoneId);
  const coord = zone?.coord ?? { x: MAP_STAGE.width / 2, y: MAP_STAGE.height / 2 };
  const tile = getZoneArtTile(zoneId);
  if (tile.mode !== "island") {
    return { center: { x: coord.x, y: coord.y }, box: { ...LANDMARK_BOX } };
  }

  const [ax, ay] = tile.anchorUV;
  const { w, h } = tile.stageSize;
  return {
    center: {
      x: coord.x + (0.5 - ax) * w,
      y: coord.y + (0.5 - ay) * h + NAMEPLATE_FOCUS_ALLOWANCE,
    },
    box: { w, h },
  };
}

/** 島構圖框外緣留白（stage px）：島與視窗邊之間的呼吸，供 fitBox 上限使用。 */
export const ISLAND_FIT_PAD = 16;

/**
 * 「島放得進畫面」的縮放上限：島比視窗還寬（手機直向）時，
 * 置中也看不到全島，故把進島 scale 夾到 contain-fit。
 */
export function fitScaleForBox(
  box: { w: number; h: number },
  viewportW: number,
  viewportH: number,
): number {
  if (viewportW === 0 || viewportH === 0) return MAX_SCALE;
  const pad = ISLAND_FIT_PAD * 2;
  return clampScale(
    Math.min(viewportW / (box.w + pad), viewportH / (box.h + pad)),
  );
}

/**
 * srcset `sizes`／島 props 用的縮放級距（0.25 一階）。
 * 連續 pinch zoom 時若每 tick 傳真實 scale，會打穿 memo；量化後同桶內不重渲染。
 */
export const MAP_SCALE_BUCKET = 0.25;

export function bucketMapScale(scale: number): number {
  const bucketed =
    Math.round(scale / MAP_SCALE_BUCKET) * MAP_SCALE_BUCKET;
  // 避免 round 到 0；下限對齊 MIN_SCALE 桶
  return Math.max(MAP_SCALE_BUCKET, bucketed);
}

export type CameraState = { scale: number; tx: number; ty: number };

/**
 * 以焦點像素（viewport 座標）縮放鏡頭，維持焦點下的舞台點不動。
 * 不含 viewport clamp；呼叫端接 `clampCamera`。
 */
export function zoomCameraAt(
  cam: CameraState,
  factor: number,
  focusX: number,
  focusY: number,
): CameraState {
  const ns = clampScale(cam.scale * factor);
  const realFactor = ns / cam.scale;
  if (realFactor === 1) return cam;
  return {
    scale: ns,
    tx: focusX - (focusX - cam.tx) * realFactor,
    ty: focusY - (focusY - cam.ty) * realFactor,
  };
}

/** 島群 bbox 中心：預設鏡頭對齊此點，讓島群在視窗置中，而非偏向某一座島（避免單側空海）。 */
export function islandContentCenter(): { x: number; y: number } {
  const b = islandContentBounds();
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

/**
 * 直向（portrait）視窗相對 contain 的最大放大倍率。
 * 島群偏寬，直向若用寬度 contain 會縮成中央窄帶、上下大量空海；適度往「填滿高度」
 * 偏移填滿垂直空間（上限此倍率，避免島群裁切過度、仍看得到主島與鄰島）。
 */
export const PORTRAIT_MAX_ZOOM = 1.5;

/**
 * 島名木牌呼吸（螢幕 px，單邊）。
 *
 * `CONTENT_FIT_PAD` 是 stage 單位，會隨 fit 縮放一起縮小；但木牌反縮放後是**固定
 * 螢幕尺寸**，所以手機 fit 下那份留白不夠，最外側島的木牌會被視窗裁掉（375px 實測
 * 溢出 24px）。這裡改在螢幕空間預留，維持 MAP-MOBILE-FIT 的「五島可讀且不裁切」。
 */
export const LABEL_SCREEN_PAD = 28;

/** 依 viewport 尺寸算預設島群 contain-fit 鏡頭倍率（含 FIT_MARGIN 與 clamp）。
 *  直向視窗改偏向填滿高度（見 PORTRAIT_MAX_ZOOM），減少上下空海。 */
export function fitScaleFor(w: number, h: number): number {
  if (w === 0 || h === 0) return 1;
  const bounds = islandContentBounds();
  // 先扣掉木牌的螢幕留白，再算 contain（見 LABEL_SCREEN_PAD）。
  const availW = Math.max(1, w - LABEL_SCREEN_PAD * 2);
  const availH = Math.max(1, h - LABEL_SCREEN_PAD * 2);
  const contain = Math.min(availW / bounds.width, availH / bounds.height);
  const scale =
    h > w
      ? Math.min(availH / bounds.height, contain * PORTRAIT_MAX_ZOOM)
      : contain;
  return clampScale(scale * FIT_MARGIN);
}

type Camera = { scale: number; tx: number; ty: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 夾住鏡頭平移。
 * 舞台放得下時置中；放不下時允許任一舞台點移到 viewport 中心。
 */
export function clampCamera(next: Camera, viewportW: number, viewportH: number): Camera {
  if (viewportW === 0 || viewportH === 0) return next;

  const stageW = MAP_STAGE.width * next.scale;
  const stageH = MAP_STAGE.height * next.scale;

  const tx =
    stageW <= viewportW
      ? (viewportW - stageW) / 2
      : clamp(next.tx, viewportW / 2 - stageW, viewportW / 2);
  const ty =
    stageH <= viewportH
      ? (viewportH - stageH) / 2
      : clamp(next.ty, viewportH / 2 - stageH, viewportH / 2);

  return { scale: next.scale, tx, ty };
}

/** 迷路判定的視窗外緣寬容（螢幕 px）：島心離視窗邊在此距離內仍算「看得到」。 */
export const RECENTER_VISIBLE_MARGIN_PX = 40;

/** 鏡頭靜止多久後檢查迷路（ms）：拖曳／慣性期間值持續變動會一直順延。 */
export const RECENTER_IDLE_MS = 700;

/**
 * 迷路自救判定：目前鏡頭下是否至少有一個座標點（島心）落在視窗（含 margin）內。
 * 全部落在視窗外＝孩子把地圖拖到只剩海，該自動飛回樂園。
 */
export function anyPointVisible(
  cam: Camera,
  viewportW: number,
  viewportH: number,
  points: readonly { x: number; y: number }[],
  margin: number = RECENTER_VISIBLE_MARGIN_PX,
): boolean {
  if (viewportW === 0 || viewportH === 0) return true;
  return points.some((p) => {
    const sx = p.x * cam.scale + cam.tx;
    const sy = p.y * cam.scale + cam.ty;
    return (
      sx >= -margin &&
      sx <= viewportW + margin &&
      sy >= -margin &&
      sy <= viewportH + margin
    );
  });
}

/** 依 wheel deltaY 計算平滑縮放倍率（clamped）。 */
export function wheelZoomFactor(deltaY: number): number {
  const clamped = Math.max(-120, Math.min(120, deltaY));
  const factor = Math.exp(-clamped * 0.002);
  return Math.min(Math.max(factor, 0.92), 1.08);
}

/** 拖曳判定門檻（像素）：指標移動未超過此距離視為點擊、不啟動平移。 */
export const DRAG_SLOP_PX = 8;

/** 雙擊/雙點放大：兩次點擊的最大時間間隔（毫秒）。 */
export const DOUBLE_TAP_MS = 300;
/** 雙擊/雙點放大：兩次點擊的最大位移（螢幕 px），超過視為兩次獨立點擊。 */
export const DOUBLE_TAP_DIST_PX = 30;
/** 雙擊/雙點放大的縮放倍率（相對當前 scale；達 MAX_SCALE 由 flyTo 自然 no-op）。 */
export const DOUBLE_TAP_ZOOM = 1.8;

/** 一次點擊取樣（螢幕座標 + 時間戳）。 */
export type TapSample = { t: number; x: number; y: number };

/** 判定兩次點擊是否構成雙擊：時間間隔與位移皆在門檻內。 */
export function isDoubleTap(
  prev: TapSample | null,
  next: TapSample,
  maxMs: number = DOUBLE_TAP_MS,
  maxDistPx: number = DOUBLE_TAP_DIST_PX,
): boolean {
  if (!prev) return false;
  if (next.t - prev.t > maxMs) return false;
  return exceedsDragSlop(next.x - prev.x, next.y - prev.y, maxDistPx) === false;
}

/** 判斷指標位移是否已越過拖曳門檻（用平方比較避免開根號）。 */
export function exceedsDragSlop(
  dx: number,
  dy: number,
  slop: number = DRAG_SLOP_PX,
): boolean {
  return dx * dx + dy * dy >= slop * slop;
}

/** 慣性甩動的起始最低速度（px/ms）；放手時低於此不觸發慣性。 */
export const MIN_FLING_SPEED = 0.05;

/** 慣性停止速度（px/ms）；衰減到此以下即停止動畫。 */
export const INERTIA_STOP_SPEED = 0.008;

/** 慣性衰減時間常數（ms）：速度每經過此毫秒數衰減為 1/e，數值越大滑得越遠。 */
export const INERTIA_DECAY_TAU = 325;

/** 速度取樣的指數平滑係數（0–1，越大越偏向最新的瞬時速度）。 */
export const VELOCITY_BLEND_ALPHA = 0.4;

/** 放手前的靜止判定（ms）：距最後一次移動超過此時間視為停住，不甩動。 */
export const VELOCITY_IDLE_RESET_MS = 80;

/** 依經過時間對速度做指數衰減（時間無關於幀率，長短幀一致）。 */
export function decayVelocity(
  v: number,
  dtMs: number,
  tau: number = INERTIA_DECAY_TAU,
): number {
  return v * Math.exp(-dtMs / tau);
}

/** 指數平滑混合速度取樣：回傳 prev 與 instant 的加權值（alpha 偏向 instant）。 */
export function blendVelocity(
  prev: number,
  instant: number,
  alpha: number = VELOCITY_BLEND_ALPHA,
): number {
  return prev * (1 - alpha) + instant * alpha;
}

/**
 * 把「舞台某點置中於視窗」轉成相機 pose（未 clamp；呼叫端接 `clampCamera`）。
 * offsetY 為正時把舞台往下推（島在畫面上移）。
 */
export function poseFor(
  coord: { x: number; y: number },
  scale: number,
  viewportW: number,
  viewportH: number,
  offsetY = 0,
): CameraState {
  return {
    scale,
    tx: viewportW / 2 - coord.x * scale,
    ty: viewportH / 2 - coord.y * scale + offsetY,
  };
}

/** `poseFor` 的反函式：目前鏡頭下位於視窗中心的舞台座標。 */
export function cameraCenter(
  cam: CameraState,
  viewportW: number,
  viewportH: number,
): { x: number; y: number } {
  return {
    x: (viewportW / 2 - cam.tx) / cam.scale,
    y: (viewportH / 2 - cam.ty) / cam.scale,
  };
}

/**
 * van Wijk & Nuij 曲率參數（INFOVIS '03「Smooth and efficient zooming and panning」）。
 * 1.414 為論文與 Mapbox flyTo 的預設值。
 */
export const FLY_RHO = 1.414;

/**
 * 飛行「感知速度」（van Wijk 世界單位／秒）：時長 = 感知路徑長 S ÷ 此速度。
 * 校準基準為手機直向（390×740，主要使用情境）：進島車車樂園約 390ms、
 * 雙擊放大約 245ms——刻意對齊改動前手調的 450／250 手感。調小＝整體變慢。
 */
export const FLY_VELOCITY = 2.5;

/** 飛行時長下限（ms）：極短位移也別瞬移，孩子需要看得到鏡頭在動。 */
export const MIN_FLY_MS = 180;
/** 飛行時長上限（ms）：跨全圖也不該拖過久。 */
export const MAX_FLY_MS = 700;

/** 純縮放判定門檻（stage px）：位移小於此值走退化分支，避免除以近零。 */
const FLY_PAN_EPS = 1e-6;

/**
 * van Wijk & Nuij 的感知路徑長 S：同時計入平移與縮放，且縮放取對數尺度
 * （0.34→0.68 的感知距離大於 1.6→2.0，雖然兩者都是放大一倍以內）。
 *
 * 注意：這裡只借用論文的「距離度量」，不採用其參數化弧線路徑——實際過場仍由
 * CSS transition 直線插值（見 map-camera-visual.ts）。
 */
export function flyPathLength(
  from: CameraState,
  to: CameraState,
  viewportW: number,
  viewportH: number,
): number {
  if (viewportW === 0 || viewportH === 0) return 0;

  const c0 = cameraCenter(from, viewportW, viewportH);
  const c1 = cameraCenter(to, viewportW, viewportH);
  const du = Math.hypot(c1.x - c0.x, c1.y - c0.y);

  // 視窗涵蓋的世界寬度（stage px）：縮放越大看得越少。
  const w0 = viewportW / from.scale;
  const w1 = viewportW / to.scale;

  const rho2 = FLY_RHO * FLY_RHO;
  if (du < FLY_PAN_EPS) {
    // 純縮放：退化為對數距離。
    return Math.abs(Math.log(w1 / w0)) / FLY_RHO;
  }

  const rho4 = rho2 * rho2;
  const b0 = (w1 * w1 - w0 * w0 + rho4 * du * du) / (2 * w0 * rho2 * du);
  const b1 = (w1 * w1 - w0 * w0 - rho4 * du * du) / (2 * w1 * rho2 * du);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  return (r1 - r0) / FLY_RHO;
}

/**
 * 依起訖鏡頭推導過場時長（ms）：近距離縮放自動變快、跨島飛行自動變慢，
 * 不需要為每個呼叫點各拍一個常數。
 */
export function flyDurationFor(
  from: CameraState,
  to: CameraState,
  viewportW: number,
  viewportH: number,
): number {
  const ms = (flyPathLength(from, to, viewportW, viewportH) / FLY_VELOCITY) * 1000;
  if (!Number.isFinite(ms)) return MIN_FLY_MS;
  return clamp(ms, MIN_FLY_MS, MAX_FLY_MS);
}
