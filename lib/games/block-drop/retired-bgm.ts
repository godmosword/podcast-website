/**
 * 方塊轉轉已下架。這段旋律只留在原始碼，供日後重設計對照。
 *
 * 禁止從 app/、components/、lib/gamekit 或任何會進網站 bundle 的模組 import。
 * 客戶端不會播放，也不會隨頁面送出。
 */

const C3 = 131;
const D3 = 147;
const E3 = 165;
const G3 = 196;
const A3 = 220;
const B3 = 247;
const A4 = 440;
const B4 = 494;
const C5 = 523;
const D5 = 587;
const E5 = 659;
const G5 = 784;

export const RETIRED_BLOCK_DROP_BGM = {
  bpm: 120,
  stepsPerBeat: 4,
  melodyWave: "square" as const,
  bassWave: "square" as const,
  melodyVol: 0.075,
  bassVol: 0.055,
  melody: [
    [E5, B4, C5, D5, C5, B4, A4, A4, C5, E5, D5, C5, B4, B4, C5, D5],
    [E5, C5, E5, G5, E5, C5, D5, E5, G5, E5, D5, C5, B4, A4, B4, C5],
  ],
  bass: [
    [E3, E3, C3, C3, G3, G3, A3, A3, E3, E3, C3, C3, G3, G3, A3, A3],
    [C3, C3, G3, G3, E3, E3, A3, A3, D3, D3, A3, A3, E3, E3, B3, B3],
  ],
};
