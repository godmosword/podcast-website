/** 敵人種類：patrol＝水平巡邏可踩；hopper＝定點彈跳可踩；floater＝飄浮不可踩（危險）。 */
export type AdventureEnemyKind = "patrol" | "hopper" | "floater";

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
  /** 敵人：tile 座標 [tx, ty]，可選 vx；kind 預設 patrol（水平巡邏可踩） */
  enemies?: { x: number; y: number; vx?: number; kind?: AdventureEnemyKind }[];
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
  /** 移動平台：tile 座標與往復設定（tile 單位；range 為往復幅度格數） */
  movingPlatforms?: {
    x: number;
    y: number;
    w?: number;
    axis?: "x" | "y";
    range?: number;
    speed?: number;
  }[];
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
  kind: AdventureEnemyKind;
  /** hopper 垂直速度。 */
  vy: number;
  /** floater 浮動基準 y。 */
  baseY: number;
  /** floater 浮動相位累積。 */
  t: number;
  /** hopper 下次彈跳倒數。 */
  hopTimer: number;
};

type AdventureFinish = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** 能力門（pixel）：需 `ability` 才能通過；S6a 接判定。 */
type AdventureAbilityGate = {
  x: number;
  y: number;
  w: number;
  h: number;
  ability: string;
};

/** 移動平台（pixel）：`x0/y0` 為起點（reduced 靜止用）；S3 接模擬。 */
type AdventureMovingPlatform = {
  x: number;
  y: number;
  x0: number;
  y0: number;
  w: number;
  h: number;
  axis: "x" | "y";
  range: number;
  speed: number;
  dir: number;
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
  /** 可撞碎地形格（tile key `"tx,ty"`）；S2 接。預設空。 */
  breakable: Set<string>;
  /** 祕密區域格（tile key `"tx,ty"`）；S7 接。預設空。 */
  secrets: Set<string>;
  /** 能力門（pixel）；S6a 接。預設空。 */
  abilityGates: AdventureAbilityGate[];
  /** 移動平台（pixel）；S3 接。預設空。 */
  movingPlatforms: AdventureMovingPlatform[];
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
  const enemies: AdventureEnemy[] = (json.enemies ?? []).map((e) => {
    const y = e.y * tileSize + (tileSize - DEFAULT_ENEMY.h);
    return {
      x: e.x * tileSize + 3,
      y,
      w: DEFAULT_ENEMY.w,
      h: DEFAULT_ENEMY.h,
      vx: e.vx ?? DEFAULT_ENEMY.vx,
      dir: DEFAULT_ENEMY.dir,
      alive: true,
      kind: e.kind ?? "patrol",
      vy: 0,
      baseY: y,
      t: 0,
      // 0 → hopper 落地首幀即彈（之後由 physics 以 HOP_INTERVAL 重置）。
      hopTimer: 0,
    };
  });

  const breakable = new Set(json.breakable ?? []);
  const secrets = new Set(json.secrets ?? []);
  const abilityGates: AdventureAbilityGate[] = (json.abilityGates ?? []).map(
    (a) => ({
      x: a.x * tileSize,
      y: a.y * tileSize,
      w: tileSize,
      h: tileSize * 2,
      ability: a.ability,
    }),
  );
  const movingPlatforms: AdventureMovingPlatform[] = (
    json.movingPlatforms ?? []
  ).map((m) => ({
    x: m.x * tileSize,
    y: m.y * tileSize,
    x0: m.x * tileSize,
    y0: m.y * tileSize,
    w: (m.w ?? 2) * tileSize,
    h: Math.round(tileSize * 0.5),
    axis: m.axis ?? "x",
    range: (m.range ?? 0) * tileSize,
    speed: m.speed ?? 0,
    dir: 1,
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
    breakable,
    secrets,
    abilityGates,
    movingPlatforms,
  };
}
