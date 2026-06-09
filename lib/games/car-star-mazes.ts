/** 車車吃星星迷宮定義（#牆 .=星星 o=大星星 P=玩家 G=追逐車）。 */

export type CarStarMazeDef = {
  id: string;
  name: string;
  emoji: string;
  rows: string[];
};

export const CAR_STAR_MAZES: CarStarMazeDef[] = [
  {
    id: "classic",
    name: "經典迷宮",
    emoji: "🏠",
    rows: [
      "###############",
      "#o...........o#",
      "#.##.##.##.##.#",
      "#.##.##.##.##.#",
      "#.............#",
      "#.##.##.##.##.#",
      "#.##.##G##.##.#",
      "#.##.##.##.##.#",
      "#.............#",
      "#.##.##.##.##.#",
      "#.##.##P##.##.#",
      "#o...........o#",
      "###############",
    ],
  },
  {
    id: "open",
    name: "寬闊廣場",
    emoji: "🌳",
    rows: [
      "###############",
      "#o...........o#",
      "#.............#",
      "#.##.......##.#",
      "#.............#",
      "#....##G##....#",
      "#.............#",
      "#.##.......##.#",
      "#.............#",
      "#....##P##....#",
      "#.............#",
      "#o...........o#",
      "###############",
    ],
  },
  {
    id: "zigzag",
    name: "彎彎小路",
    emoji: "🌀",
    rows: [
      "###############",
      "#o...........o#",
      "#...####......#",
      "#...#..#......#",
      "#.......#.....#",
      "#.####..#.....#",
      "#....#G#......#",
      "#....#..####..#",
      "#.........#...#",
      "#....####.....#",
      "#....#P##.....#",
      "#o...........o#",
      "###############",
    ],
  },
];

export type MazeRuntime = {
  id: string;
  name: string;
  rows: number;
  cols: number;
  grid: string[][];
  initStars: Set<string>;
  initPowers: Set<string>;
  playerStart: { r: number; c: number };
  ghostStart: { r: number; c: number };
};

export function parseCarStarMaze(def: CarStarMazeDef): MazeRuntime {
  const grid = def.rows.map((r) => r.split(""));
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const initStars = new Set<string>();
  const initPowers = new Set<string>();
  let playerStart = { r: rows - 2, c: Math.floor(cols / 2) };
  let ghostStart = { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };

  grid.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (ch === ".") initStars.add(`${r},${c}`);
      else if (ch === "o") initPowers.add(`${r},${c}`);
      else if (ch === "P") playerStart = { r, c };
      else if (ch === "G") ghostStart = { r, c };
    }),
  );

  return {
    id: def.id,
    name: def.name,
    rows,
    cols,
    grid,
    initStars,
    initPowers,
    playerStart,
    ghostStart,
  };
}

export function getCarStarMaze(id: string): MazeRuntime {
  const def = CAR_STAR_MAZES.find((m) => m.id === id) ?? CAR_STAR_MAZES[0];
  return parseCarStarMaze(def);
}
