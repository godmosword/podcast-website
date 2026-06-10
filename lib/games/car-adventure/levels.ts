import type { AdventureLevelJson } from "@/lib/gamekit/adventure-level";

/**
 * 共用關卡建造器。所有地面缺口維持 3 格（與第 1 關相同、已驗證可跳過），
 * 尖刺一律放在地面格正上方（row 9），確保不是懸空陷阱。
 */
function levelBuilder() {
  const solid: string[] = [];
  const spikes: string[] = [];
  const coins: [number, number][] = [];
  const enemies: { x: number; y: number }[] = [];

  return {
    ground(a: number, b: number, baseRow = 10): void {
      for (let x = a; x <= b; x++) {
        solid.push(`${x},${baseRow}`, `${x},${baseRow + 1}`);
      }
    },
    plat(a: number, b: number, row: number): void {
      for (let x = a; x <= b; x++) solid.push(`${x},${row}`);
    },
    coin(x: number, y: number): void {
      coins.push([x, y]);
    },
    coinRow(a: number, b: number, y: number): void {
      for (let x = a; x <= b; x++) coins.push([x, y]);
    },
    spike(x: number, y: number): void {
      spikes.push(`${x},${y}`);
    },
    enemy(x: number, y: number): void {
      enemies.push({ x, y });
    },
    done(
      meta: Pick<AdventureLevelJson, "id" | "name" | "cols"> & {
        start: [number, number];
        finish: [number, number, number?, number?];
      },
    ): AdventureLevelJson {
      return {
        id: meta.id,
        name: meta.name,
        tileSize: 36,
        cols: meta.cols,
        rows: 12,
        solid,
        spikes,
        coins,
        enemies,
        start: meta.start,
        finish: meta.finish,
      };
    },
  };
}

/** 關卡 1：草原出發（入門，原硬編關卡）。 */
export function buildLevel01Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 13);
  b.ground(17, 29);
  b.ground(32, 49);
  b.ground(52, 89);
  b.ground(92, 107);
  b.plat(5, 8, 7);
  b.plat(20, 24, 7);
  b.plat(36, 40, 6);
  b.plat(45, 48, 6);
  b.coinRow(5, 8, 6);
  b.coinRow(14, 16, 7);
  b.coinRow(20, 24, 6);
  b.coinRow(36, 40, 5);
  b.coin(43, 7);
  b.coin(44, 6);
  b.coinRow(45, 48, 5);
  b.coinRow(56, 60, 6);
  b.coinRow(64, 68, 4);
  b.coinRow(78, 82, 9);
  b.coinRow(95, 100, 9);
  b.spike(70, 9);
  b.spike(71, 9);
  b.spike(72, 9);
  b.enemy(24, 9);
  b.enemy(40, 9);
  b.enemy(60, 9);
  b.enemy(82, 9);
  return b.done({
    id: "level-01",
    name: "草原出發",
    cols: 108,
    start: [2, 9],
    finish: [104, 8, 1, 2],
  });
}

/** 關卡 2：彩虹捷徑（補足長度與難度，使其高於第 1 關）。 */
export function buildLevel02Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 13);
  b.ground(17, 30);
  b.ground(34, 50);
  b.ground(54, 78);
  b.ground(82, 100);
  b.ground(104, 119);
  b.plat(6, 9, 7);
  b.plat(20, 24, 7);
  b.plat(38, 42, 6);
  b.plat(60, 64, 6);
  b.plat(88, 92, 5);
  b.plat(108, 112, 7);
  b.coinRow(6, 9, 6);
  b.coinRow(20, 24, 6);
  b.coinRow(38, 42, 5);
  b.coinRow(60, 64, 5);
  b.coinRow(88, 92, 4);
  b.coinRow(108, 112, 6);
  b.spike(70, 9);
  b.spike(71, 9);
  b.enemy(24, 9);
  b.enemy(44, 9);
  b.enemy(68, 9);
  b.enemy(95, 9);
  return b.done({
    id: "level-02",
    name: "彩虹捷徑",
    cols: 120,
    start: [2, 9],
    finish: [116, 8, 1, 2],
  });
}

/** 關卡 3：高低起伏（更多平台與尖刺）。 */
export function buildLevel03Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 28);
  b.ground(32, 46);
  b.ground(50, 66);
  b.ground(70, 86);
  b.ground(90, 108);
  b.ground(112, 131);
  b.plat(5, 8, 7);
  b.plat(20, 24, 6);
  b.plat(36, 40, 6);
  b.plat(56, 60, 5);
  b.plat(76, 80, 6);
  b.plat(96, 100, 5);
  b.plat(118, 122, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(20, 24, 5);
  b.coinRow(36, 40, 5);
  b.coinRow(56, 60, 4);
  b.coinRow(76, 80, 5);
  b.coinRow(96, 100, 4);
  b.coinRow(118, 122, 6);
  b.spike(40, 9);
  b.spike(41, 9);
  b.spike(78, 9);
  b.spike(79, 9);
  b.enemy(22, 9);
  b.enemy(38, 9);
  b.enemy(58, 9);
  b.enemy(82, 9);
  b.enemy(100, 9);
  return b.done({
    id: "level-03",
    name: "高低起伏",
    cols: 132,
    start: [2, 9],
    finish: [126, 8, 1, 2],
  });
}

/** 關卡 4：尖刺迷宮（尖刺密度提高）。 */
export function buildLevel04Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 44);
  b.ground(48, 62);
  b.ground(66, 80);
  b.ground(84, 100);
  b.ground(104, 120);
  b.ground(124, 145);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(34, 38, 6);
  b.plat(52, 56, 5);
  b.plat(70, 74, 6);
  b.plat(90, 94, 5);
  b.plat(110, 114, 6);
  b.plat(130, 134, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(34, 38, 5);
  b.coinRow(52, 56, 4);
  b.coinRow(70, 74, 5);
  b.coinRow(90, 94, 4);
  b.coinRow(110, 114, 5);
  b.coinRow(130, 134, 6);
  b.spike(38, 9);
  b.spike(39, 9);
  b.spike(56, 9);
  b.spike(57, 9);
  b.spike(92, 9);
  b.spike(93, 9);
  b.enemy(20, 9);
  b.enemy(36, 9);
  b.enemy(54, 9);
  b.enemy(72, 9);
  b.enemy(95, 9);
  b.enemy(112, 9);
  return b.done({
    id: "level-04",
    name: "尖刺迷宮",
    cols: 146,
    start: [2, 9],
    finish: [140, 8, 1, 2],
  });
}

/** 關卡 5：空中走廊（長度與敵人再升級）。 */
export function buildLevel05Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 42);
  b.ground(46, 58);
  b.ground(62, 74);
  b.ground(78, 92);
  b.ground(96, 112);
  b.ground(116, 132);
  b.ground(136, 157);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(33, 37, 5);
  b.plat(49, 53, 6);
  b.plat(65, 69, 5);
  b.plat(82, 86, 6);
  b.plat(100, 104, 5);
  b.plat(120, 124, 6);
  b.plat(142, 146, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(33, 37, 4);
  b.coinRow(49, 53, 5);
  b.coinRow(65, 69, 4);
  b.coinRow(82, 86, 5);
  b.coinRow(100, 104, 4);
  b.coinRow(120, 124, 5);
  b.coinRow(142, 146, 6);
  b.spike(36, 9);
  b.spike(37, 9);
  b.spike(52, 9);
  b.spike(53, 9);
  b.spike(84, 9);
  b.spike(85, 9);
  b.spike(104, 9);
  b.spike(105, 9);
  b.enemy(20, 9);
  b.enemy(34, 9);
  b.enemy(50, 9);
  b.enemy(68, 9);
  b.enemy(86, 9);
  b.enemy(108, 9);
  b.enemy(124, 9);
  return b.done({
    id: "level-05",
    name: "空中走廊",
    cols: 158,
    start: [2, 9],
    finish: [150, 8, 1, 2],
  });
}

/** 關卡 6：終極大冒險（最長、最多障礙的收尾關）。 */
export function buildLevel06Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 42);
  b.ground(46, 56);
  b.ground(60, 72);
  b.ground(76, 88);
  b.ground(92, 104);
  b.ground(108, 122);
  b.ground(126, 140);
  b.ground(144, 175);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(33, 37, 5);
  b.plat(48, 52, 6);
  b.plat(63, 67, 5);
  b.plat(79, 83, 6);
  b.plat(95, 99, 5);
  b.plat(112, 116, 6);
  b.plat(130, 134, 5);
  b.plat(150, 154, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(33, 37, 4);
  b.coinRow(48, 52, 5);
  b.coinRow(63, 67, 4);
  b.coinRow(79, 83, 5);
  b.coinRow(95, 99, 4);
  b.coinRow(112, 116, 5);
  b.coinRow(130, 134, 4);
  b.coinRow(150, 154, 6);
  b.spike(36, 9);
  b.spike(37, 9);
  b.spike(50, 9);
  b.spike(51, 9);
  b.spike(66, 9);
  b.spike(67, 9);
  b.spike(98, 9);
  b.spike(99, 9);
  b.spike(116, 9);
  b.spike(117, 9);
  b.spike(132, 9);
  b.enemy(20, 9);
  b.enemy(34, 9);
  b.enemy(48, 9);
  b.enemy(64, 9);
  b.enemy(82, 9);
  b.enemy(98, 9);
  b.enemy(114, 9);
  b.enemy(134, 9);
  b.enemy(160, 9);
  return b.done({
    id: "level-06",
    name: "終極大冒險",
    cols: 176,
    start: [2, 9],
    finish: [168, 8, 1, 2],
  });
}

export const CAR_ADVENTURE_LEVELS: AdventureLevelJson[] = [
  buildLevel01Json(),
  buildLevel02Json(),
  buildLevel03Json(),
  buildLevel04Json(),
  buildLevel05Json(),
  buildLevel06Json(),
];
