/**
 * 車車故事屋 Game Kit 主調色盤（32 色）。
 * 各遊戲取子集；HUD／tile 共用同一光源方向（左上高光）。
 */
export const MASTER_PALETTE = [
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#ff6b6b",
  "#ff8e72",
  "#ffd166",
  "#ffe66d",
  "#f7a8c4",
  "#c084fc",
  "#a78bfa",
  "#7c3aed",
  "#6bcb77",
  "#b7df9b",
  "#4d96ff",
  "#5bc0eb",
  "#89cff0",
  "#34302b",
  "#5c534a",
  "#8d857b",
  "#c4b8a8",
  "#fff8f0",
  "#ffffff",
  "#2d6a4f",
  "#40916c",
  "#52b788",
  "#95d5b2",
  "#f4a261",
  "#e76f51",
  "#264653",
  "#2a9d8f",
] as const;

/** 相機／座標次像素取整，保持像素邊緣穩定。 */
export function snapPixel(value: number): number {
  return Math.round(value);
}
