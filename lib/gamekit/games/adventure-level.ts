/** Game Kit 大冒險關卡 JSON（可由 Tiled 匯出再轉換，或直接手寫）。 */
export type AdventureLevelJson = {
  id: string;
  name: string;
  tileSize: number;
  cols: number;
  rows: number;
  /** 實心地形格，格式 `"tx,ty"` */
  solid: string[];
  spikes?: string[];
  /** 金幣：tile 座標 [tx, ty] */
  coins?: [number, number][];
  /** 敵人：tile 座標 [tx, ty]，可選 vx */
  enemies?: { x: number; y: number; vx?: number }[];
  /** 玩家起點 tile [tx, ty] */
  start: [number, number];
  /** 終點旗 tile：x, y, 寬高（格數，預設 1×2） */
  finish: [number, number, number?, number?];
  /** 可撞碎地形格，格式 `"tx,ty"` */
  breakable?: string[];
  /** 能力門：需特定車輛能力才能通過 */
  abilityGates?: { x: number; y: number; ability: string }[];
  /** 祕密區域格，格式 `"tx,ty"` */
  secrets?: string[];
};

type AdventureCoin = {
  x: number;
  y: number;
  taken: boolean;
};

type AdventureEnemy = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  dir: number;
  alive: boolean;
};

type AdventureFinish = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** 執行期關卡（CarPlatformer 碰撞／渲染用）。 */
export type AdventureLevel = {
  id: string;
  name: string;
  solid: Set<string>;
  spikes: Set<string>;
  coins: AdventureCoin[];
  enemies: AdventureEnemy[];
  cols: number;
  rows: number;
  worldW: number;
  worldH: number;
  start: { x: number; y: number };
  finish: AdventureFinish;
  total: number;
};

const DEFAULT_ENEMY = {
  w: 30,
  h: 24,
  vx: 62,
  dir: -1 as const,
};

export function levelFromJson(
  json: AdventureLevelJson,
  tileSize = json.tileSize,
): AdventureLevel {
  const solid = new Set(json.solid);
  const spikes = new Set(json.spikes ?? []);
  const coins: AdventureCoin[] = (json.coins ?? []).map(([tx, ty]) => ({
    x: tx * tileSize + tileSize / 2,
    y: ty * tileSize + tileSize / 2,
    taken: false,
  }));
  const enemies: AdventureEnemy[] = (json.enemies ?? []).map((e) => ({
    x: e.x * tileSize + 3,
    y: e.y * tileSize + (tileSize - DEFAULT_ENEMY.h),
    w: DEFAULT_ENEMY.w,
    h: DEFAULT_ENEMY.h,
    vx: e.vx ?? DEFAULT_ENEMY.vx,
    dir: DEFAULT_ENEMY.dir,
    alive: true,
  }));

  const [sx, sy] = json.start;
  const [fx, fy, fw = 1, fh = 2] = json.finish;

  return {
    id: json.id,
    name: json.name,
    solid,
    spikes,
    coins,
    enemies,
    cols: json.cols,
    rows: json.rows,
    worldW: json.cols * tileSize,
    worldH: json.rows * tileSize,
    start: { x: sx * tileSize, y: sy * tileSize - 2 },
    finish: {
      x: fx * tileSize,
      y: fy * tileSize,
      w: fw * tileSize,
      h: fh * tileSize,
    },
    total: coins.length,
  };
}
