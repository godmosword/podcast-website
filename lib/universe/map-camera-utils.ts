import { MAP_STAGE, ZONES } from "@/data/universe-zones";
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

/** 依 viewport 尺寸算預設島群 contain-fit 鏡頭倍率（含 FIT_MARGIN 與 clamp）。 */
export function fitScaleFor(w: number, h: number): number {
  if (w === 0 || h === 0) return 1;
  const bounds = islandContentBounds();
  return clampScale(
    Math.min(w / bounds.width, h / bounds.height) * FIT_MARGIN,
  );
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
