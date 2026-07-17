/** 《繽紛消消樂》關卡資料（企劃第六節 10 關）。 */

/** 圖案＝車車角色（最多 5 種；levels 以索引 0..4 取前 N 種）。 */
export const CANDY_MATCH_PIECES = [
  { id: "xiao-hong", name: "小紅", color: "#ff7a9c" },
  { id: "taxi", name: "計程車", color: "#ffd34d" },
  { id: "bus", name: "小巴士", color: "#6fc3f0" },
  { id: "ling-ling", name: "鈴鈴", color: "#7fd4a8" },
  { id: "duo-duo", name: "多多", color: "#c9a8ff" },
] as const;

export type CandyMatchTask =
  | { kind: "clear-any"; count: number }
  | { kind: "collect"; piece: number; count: number }
  | { kind: "collect-multi"; targets: { piece: number; count: number }[] }
  | { kind: "clean-dirt"; count: number }
  | { kind: "drop-item"; count: number };

export type CandyMatchLevel = {
  index: number;
  name: string;
  /** 關卡地圖節點名（企劃第二節） */
  place: string;
  cols: number;
  rows: number;
  /** 使用前 N 種圖案 */
  pieceKinds: number;
  task: CandyMatchTask;
  /** 0 = 不限步數 */
  moves: number;
  /** 髒髒格數（clean-dirt 任務用；隨機散佈） */
  dirtCount?: number;
  /** 掉落物數（drop-item 任務用；從頂排生成） */
  dropCount?: number;
  /** 主題色（背景漸層） */
  themeA: string;
  themeB: string;
};

export const CANDY_MATCH_LEVELS: CandyMatchLevel[] = [
  {
    index: 0,
    name: "認識消除",
    place: "彩虹入口",
    cols: 5,
    rows: 5,
    pieceKinds: 3,
    task: { kind: "clear-any", count: 3 },
    moves: 0,
    themeA: "#fff3f9",
    themeB: "#e8f7ff",
  },
  {
    index: 1,
    name: "收集小紅",
    place: "泡泡廣場",
    cols: 5,
    rows: 5,
    pieceKinds: 4,
    task: { kind: "collect", piece: 0, count: 5 },
    moves: 0,
    themeA: "#eaf6ff",
    themeB: "#fff0f7",
  },
  {
    index: 2,
    name: "計程車任務",
    place: "冰淇淋小店",
    cols: 5,
    rows: 5,
    pieceKinds: 4,
    task: { kind: "collect", piece: 1, count: 6 },
    moves: 24,
    themeA: "#fff8e6",
    themeB: "#ffeef5",
  },
  {
    index: 3,
    name: "彩虹小巴",
    place: "旋轉木馬",
    cols: 6,
    rows: 6,
    pieceKinds: 4,
    task: { kind: "collect", piece: 2, count: 8 },
    moves: 26,
    themeA: "#eef3ff",
    themeB: "#fdf0ff",
  },
  {
    index: 4,
    name: "清潔小廣場",
    place: "清潔廣場",
    cols: 6,
    rows: 6,
    pieceKinds: 4,
    task: { kind: "clean-dirt", count: 5 },
    moves: 30,
    dirtCount: 5,
    themeA: "#eefaf0",
    themeB: "#f3f6ff",
  },
  {
    index: 5,
    name: "鈴鈴派對",
    place: "小小賽道",
    cols: 6,
    rows: 6,
    pieceKinds: 5,
    task: { kind: "collect", piece: 3, count: 8 },
    moves: 28,
    themeA: "#effaf2",
    themeB: "#fff5ea",
  },
  {
    index: 6,
    name: "摩天輪亮起來",
    place: "摩天輪",
    cols: 6,
    rows: 6,
    pieceKinds: 5,
    task: { kind: "collect", piece: 1, count: 6 },
    moves: 26,
    themeA: "#fdf3ff",
    themeB: "#eef8ff",
  },
  {
    index: 7,
    name: "禮物送下來",
    place: "星星舞台",
    cols: 6,
    rows: 6,
    pieceKinds: 4,
    task: { kind: "drop-item", count: 1 },
    moves: 30,
    dropCount: 1,
    themeA: "#fff5e8",
    themeB: "#f1f0ff",
  },
  {
    index: 8,
    name: "繽紛大遊行",
    place: "甜甜圈屋",
    cols: 6,
    rows: 6,
    pieceKinds: 5,
    task: {
      kind: "collect-multi",
      targets: [
        { piece: 0, count: 5 },
        { piece: 2, count: 5 },
        { piece: 3, count: 5 },
      ],
    },
    moves: 34,
    themeA: "#fff0f4",
    themeB: "#eefcf4",
  },
  {
    index: 9,
    name: "煙火慶祝",
    place: "繽紛煙火",
    cols: 6,
    rows: 6,
    pieceKinds: 5,
    task: { kind: "clear-any", count: 10 },
    moves: 0,
    themeA: "#f0ecff",
    themeB: "#ffeef2",
  },
];

/** 兒童模式（3–4 歲）覆寫：5x5、最多 4 種圖案、不限步數。 */
export function kidsModeLevel(level: CandyMatchLevel): CandyMatchLevel {
  const gentlerCount = (count: number) => Math.max(1, Math.ceil(count * 0.75));
  const task: CandyMatchTask = (() => {
    switch (level.task.kind) {
      case "clear-any":
      case "collect":
      case "drop-item":
        return { ...level.task, count: gentlerCount(level.task.count) };
      case "clean-dirt":
        return {
          ...level.task,
          count: Math.min(
            gentlerCount(level.task.count),
            Math.max(1, Math.min(level.dirtCount ?? level.task.count, 3)),
          ),
        };
      case "collect-multi":
        return {
          ...level.task,
          targets: level.task.targets.map((target) => ({
            ...target,
            count: gentlerCount(target.count),
          })),
        };
    }
  })();

  return {
    ...level,
    cols: 5,
    rows: 5,
    pieceKinds: Math.min(level.pieceKinds, 4),
    moves: 0,
    task,
    dirtCount: Math.min(level.dirtCount ?? 0, 3),
    dropCount: Math.min(level.dropCount ?? 0, 1),
  };
}
