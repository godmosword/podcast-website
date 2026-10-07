/**
 * 參考彩圖人工修色：座標為 0–1 比例（看 --debug 格線圖，格號 n 對應 0.n）。
 * 只修自動取色取錯的區塊；顏色限色盤 id。
 * 戶外頁一律天空塗天空藍、雲塗白色，整本看起來是同一套。
 */
import type { ReferenceOverride, ReferenceRecipe } from "./coloring-reference";

const SKY: ReferenceOverride = { at: [0.01, 0.01], color: "sky" };
const cloud = (x: number, y: number): ReferenceOverride => ({
  at: [x, y],
  color: "white",
});

export const REFERENCE_RECIPES: Readonly<Record<string, ReferenceRecipe>> = {
  "char-小紅賽車": {
    paint: [
      SKY,
      cloud(0.25, 0.17),
      cloud(0.8, 0.22),
      { at: [0.06, 0.37], color: "red" },
      { at: [0.5, 0.385], color: "sky" },
      { at: [0.27, 0.45], color: "sky" },
      { at: [0.31, 0.53], color: "red" },
      { at: [0.23, 0.62], color: "white" },
      { at: [0.07, 0.69], color: "gray" },
      { at: [0.34, 0.81], color: "gray" },
    ],
  },
  "char-恐龍車多多": {
    paint: [SKY, cloud(0.2, 0.15), cloud(0.87, 0.15), { at: [0.25, 0.47], color: "sky" }],
  },
  "char-安安救護車": {
    paint: [
      SKY,
      { at: [0.43, 0.28], color: "red" },
      { at: [0.5, 0.29], color: "red" },
      { at: [0.58, 0.29], color: "red" },
      { at: [0.22, 0.67], color: "yellow" },
      { at: [0.46, 0.71], color: "yellow" },
      { at: [0.19, 0.72], color: "white" },
    ],
  },
  "char-鈴鈴清潔車": {
    paint: [
      SKY,
      cloud(0.88, 0.12),
      { at: [0.73, 0.4], color: "white" },
      { at: [0.77, 0.55], color: "green" },
      { at: [0.1, 0.83], color: "yellow" },
      { at: [0.52, 0.89], color: "yellow" },
    ],
  },
  "char-猛猛": {
    remap: { orange: "yellow" },
    paint: [
      SKY,
      cloud(0.27, 0.15),
      cloud(0.83, 0.15),
      { at: [0.6, 0.38], color: "sky" },
      { at: [0.436, 0.247], color: "yellow" },
      { at: [0.488, 0.247], color: "yellow" },
      { at: [0.547, 0.24], color: "yellow" },
      { at: [0.605, 0.238], color: "yellow" },
    ],
  },
  "char-東東挖土機": {
    remap: { orange: "yellow" },
    paint: [SKY, cloud(0.12, 0.11), cloud(0.85, 0.11), { at: [0.78, 0.45], color: "sky" }],
  },
  "char-亮亮警車": {
    paint: [SKY, cloud(0.2, 0.13), cloud(0.79, 0.14), { at: [0.26, 0.63], color: "yellow" }],
  },
  "char-噗噗豬": {
    paint: [
      SKY,
      cloud(0.17, 0.1),
      cloud(0.88, 0.1),
      { at: [0.39, 0.6], color: "pink" },
      { at: [0.27, 0.32], color: "pink" },
      { at: [0.7, 0.32], color: "pink" },
      { at: [0.3, 0.78], color: "white" },
    ],
  },
  "scene-ep-3-05": {
    remap: { orange: "white" },
    paint: [
      { at: [0.01, 0.3], color: "sky" },
      cloud(0.17, 0.12),
      cloud(0.5, 0.12),
      { at: [0.7, 0.05], color: "yellow" },
      { at: [0.83, 0.33], color: "yellow" },
      { at: [0.09, 0.45], color: "red" },
      { at: [0.27, 0.57], color: "red" },
      { at: [0.78, 0.33], color: "sky" },
      { at: [0.957, 0.34], color: "sky" },
      { at: [0.85, 0.51], color: "black" },
    ],
  },
  "scene-ep-9-05": {
    source: "characters/恐龍車多多.jpg",
    paint: [SKY, cloud(0.2, 0.15), cloud(0.87, 0.15)],
  },
  "scene-ep-6-05": {
    // 公園頁：天空與地面沒有分界線、是同一塊，整塊當草地。
    remap: { orange: "lime" },
    paint: [
      { at: [0.5, 0.03], color: "lime" },
      cloud(0.52, 0.08),
      cloud(0.75, 0.08),
      cloud(0.18, 0.11),
      // 救護車
      ...([
        [0.15, 0.7], [0.42, 0.65], [0.3, 0.6], [0.1, 0.65], [0.2, 0.76], [0.42, 0.6],
        [0.45, 0.71], [0.25, 0.45],
      ] as const).map((at) => ({
        at,
        color: "white" as const,
      })),
      { at: [0.45, 0.55], color: "red" },
      // 樹與草叢
      ...([[0.05, 0.42], [0.1, 0.38]] as const).map((at) => ({
        at,
        color: "green" as const,
      })),
      { at: [0.08, 0.27], color: "brown" },
    ],
  },
  "scene-ep-16-05": {
    source: "stories/ep-16/05.jpg",
    paint: [
      { at: [0.5, 0.05], color: "sky" },
      cloud(0.33, 0.12),
      cloud(0.73, 0.07),
      { at: [0.39, 0.6], color: "pink" },
      { at: [0.7, 0.33], color: "pink" },
      { at: [0.55, 0.8], color: "white" },
    ],
  },
  "scene-ep-4-05": {
    paint: [
      SKY,
      cloud(0.17, 0.11),
      cloud(0.83, 0.15),
      { at: [0.82, 0.4], color: "white" },
      { at: [0.73, 0.4], color: "white" },
      { at: [0.1, 0.83], color: "yellow" },
      { at: [0.52, 0.88], color: "yellow" },
      { at: [0.08, 0.63], color: "gray" },
      { at: [0.92, 0.85], color: "white" },
      { at: [0.25, 0.92], color: "green" },
    ],
  },
  "scene-ep-8-05": {
    source: "characters/猛猛.jpg",
    remap: { orange: "yellow" },
    paint: [
      SKY,
      cloud(0.22, 0.12),
      cloud(0.8, 0.13),
      // 猛猛車身
      ...([
        [0.1, 0.47], [0.3, 0.32], [0.25, 0.45], [0.45, 0.47],
        [0.5, 0.57], [0.3, 0.52],
      ] as const).map((at) => ({ at, color: "yellow" as const })),
      { at: [0.25, 0.38], color: "sky" },
      { at: [0.4, 0.36], color: "sky" },
      { at: [0.35, 0.4], color: "white" },
      { at: [0.44, 0.39], color: "white" },
      ...([[0.26, 0.285], [0.31, 0.285], [0.355, 0.285], [0.405, 0.285]] as const).map(
        (at) => ({ at, color: "yellow" as const }),
      ),
      // 大輪胎
      ...([
        [0.05, 0.6], [0.28, 0.7], [0.53, 0.68], [0.31, 0.6], [0.61, 0.68], [0.14, 0.55],
      ] as const).map((at) => ({ at, color: "black" as const })),
      // 小車
      { at: [0.75, 0.7], color: "red" },
      { at: [0.8, 0.55], color: "red" },
      { at: [0.69, 0.585], color: "sky" },
      { at: [0.87, 0.6], color: "sky" },
      // 路邊草地與石頭
      ...([
        [0.64, 0.817], [0.85, 0.862], [0.285, 0.9], [0.35, 0.93], [0.436, 0.775], [0.104, 0.86], [0.163, 0.885],
      ] as const).map((at) => ({ at, color: "gray" as const })),
    ],
  },
  "scene-ep-12-07": {
    source: "stories/ep-12/07.jpg",
    paint: [
      SKY,
      cloud(0.17, 0.12),
      cloud(0.49, 0.17),
      { at: [0.78, 0.07], color: "red" },
      { at: [0.8, 0.3], color: "yellow" },
      { at: [0.15, 0.67], color: "yellow" },
      // 小藍巴士：車身天空藍、車窗白
      { at: [0.8, 0.62], color: "sky" },
      { at: [0.6, 0.62], color: "sky" },
      ...([[0.545, 0.53], [0.605, 0.53], [0.67, 0.53], [0.83, 0.53]] as const).map((at) => ({
        at,
        color: "white" as const,
      })),
    ],
  },
  "scene-ep-5-05": {
    remap: { orange: "yellow" },
    paint: [SKY, cloud(0.13, 0.1), cloud(0.67, 0.1), { at: [0.85, 0.45], color: "sky" }],
  },
};
