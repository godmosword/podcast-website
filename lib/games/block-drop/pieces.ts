/**
 * 《繽紛樂園》方塊、旋轉表與棋盤基本運算（純函式）。
 * 形狀與踢牆表原樣搬自 BlockDropView，棋盤尺寸改由棋盤本身決定（自由堆疊 10×20、任務冒險 8 欄）。
 */

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
/** 一般格：方塊種類；"X"＝任務冒險的石頭；null＝空格。 */
export type Cell = PieceType | "X" | null;
export type Board = Cell[][];

export interface Piece {
  type: PieceType;
  rot: number;
  x: number;
  y: number;
}

export const TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const SHAPES: Record<PieceType, readonly (readonly [number, number])[][]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: [
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
};
export const KICKS: readonly (readonly [number, number])[] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
  [-2, 0],
  [2, 0],
];

export const boardRows = (board: readonly (readonly Cell[])[]): number => board.length;
export const boardCols = (board: readonly (readonly Cell[])[]): number => board[0]?.length ?? 0;

export const emptyBoard = (cols: number, rows: number): Board =>
  Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));

/** 出生欄：10 欄＝3（同現行）、8 欄＝2。 */
export const spawnX = (cols: number): number => Math.floor((cols - 4) / 2);

export function valid(p: Piece, board: readonly (readonly Cell[])[]): boolean {
  const cols = boardCols(board);
  const rows = boardRows(board);
  for (const [c, r] of SHAPES[p.type][p.rot]) {
    const x = p.x + c;
    const y = p.y + r;
    if (x < 0 || x >= cols || y >= rows) return false;
    if (y >= 0 && board[y][x]) return false;
  }
  return true;
}

export function merge(p: Piece, board: readonly (readonly Cell[])[]): Board {
  const nb = board.map((row) => row.slice());
  for (const [c, r] of SHAPES[p.type][p.rot]) {
    const x = p.x + c;
    const y = p.y + r;
    if (y >= 0) nb[y][x] = p.type;
  }
  return nb;
}

/** 落點影子的 y。 */
export function ghostY(p: Piece, board: readonly (readonly Cell[])[]): number {
  let gy = p.y;
  while (valid({ ...p, y: gy + 1 }, board)) gy++;
  return gy;
}

export function pieceCells(p: Piece): Array<readonly [number, number]> {
  return SHAPES[p.type][p.rot].map(([c, r]) => [p.x + c, p.y + r] as const);
}
