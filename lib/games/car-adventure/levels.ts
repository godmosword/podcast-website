import type { AdventureLevelJson } from "@/lib/gamekit/adventure-level";

function ground(solid: string[], a: number, b: number, baseRow = 10): void {
  for (let x = a; x <= b; x++) {
    solid.push(`${x},${baseRow}`);
    solid.push(`${x},${baseRow + 1}`);
  }
}

function plat(solid: string[], a: number, b: number, row: number): void {
  for (let x = a; x <= b; x++) solid.push(`${x},${row}`);
}

/** 關卡 1：原硬編關卡（草原出發）。 */
export function buildLevel01Json(): AdventureLevelJson {
  const solid: string[] = [];
  const spikes: string[] = [];
  const coins: [number, number][] = [];
  const enemies: { x: number; y: number }[] = [];

  const coin = (x: number, y: number) => coins.push([x, y]);
  const coinRow = (a: number, b: number, y: number) => {
    for (let x = a; x <= b; x++) coin(x, y);
  };
  const spike = (x: number, y: number) => spikes.push(`${x},${y}`);
  const enemy = (x: number, y: number) => enemies.push({ x, y });

  ground(solid, 0, 13);
  ground(solid, 17, 29);
  ground(solid, 32, 49);
  ground(solid, 52, 89);
  ground(solid, 92, 107);
  plat(solid, 5, 8, 7);
  plat(solid, 20, 24, 7);
  plat(solid, 36, 40, 6);
  solid.push("42,9", "43,8", "44,7");
  plat(solid, 45, 48, 6);
  plat(solid, 56, 60, 7);
  plat(solid, 64, 68, 5);
  spike(70, 9);
  spike(71, 9);
  spike(72, 9);
  coinRow(5, 8, 6);
  coinRow(14, 16, 7);
  coinRow(20, 24, 6);
  coinRow(36, 40, 5);
  coin(43, 7);
  coin(44, 6);
  coinRow(45, 48, 5);
  coinRow(56, 60, 6);
  coinRow(64, 68, 4);
  coinRow(78, 82, 9);
  coinRow(95, 100, 9);
  enemy(24, 9);
  enemy(40, 9);
  enemy(60, 9);
  enemy(82, 9);

  return {
    id: "level-01",
    name: "草原出發",
    tileSize: 36,
    cols: 108,
    rows: 12,
    solid,
    spikes,
    coins,
    enemies,
    start: [2, 9],
    finish: [104, 8, 1, 2],
  };
}

/** 關卡 2：較短兒童路線（金幣多、敵人少）。 */
export function buildLevel02Json(): AdventureLevelJson {
  const solid: string[] = [];
  const coins: [number, number][] = [];
  const enemies: { x: number; y: number }[] = [];

  ground(solid, 0, 18);
  ground(solid, 22, 38);
  plat(solid, 6, 10, 7);
  plat(solid, 14, 17, 5);
  plat(solid, 24, 28, 7);
  plat(solid, 32, 36, 6);
  for (let x = 6; x <= 10; x++) coins.push([x, 6]);
  for (let x = 24; x <= 28; x++) coins.push([x, 6]);
  for (let x = 32; x <= 36; x++) coins.push([x, 5]);
  coins.push([14, 4], [15, 4], [16, 4]);
  enemies.push({ x: 12, y: 9 });
  enemies.push({ x: 30, y: 9 });

  return {
    id: "level-02",
    name: "彩虹捷徑",
    tileSize: 36,
    cols: 40,
    rows: 12,
    solid,
    spikes: [],
    coins,
    enemies,
    start: [2, 9],
    finish: [36, 8, 1, 2],
  };
}

export const CAR_ADVENTURE_LEVELS: AdventureLevelJson[] = [
  buildLevel01Json(),
  buildLevel02Json(),
];
