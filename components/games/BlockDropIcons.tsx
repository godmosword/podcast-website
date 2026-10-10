/**
 * 方塊轉轉補充圖示：ClayIcons 沒有的幾個（塊數、黃線、任務圖案、迷你起始盤）。
 * 一律 aria-hidden，文字留給 aria-label。
 */
import type { CSSProperties } from "react";
import type { BlockGoal } from "@/lib/games/block-drop/goals";

type IconProps = { size?: number; className?: string };

const svgProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  className,
  "aria-hidden": true as const,
  focusable: "false" as const,
});

/** 塊數（挑戰冒險、剩幾塊）：一個 T 形方塊。跟字同色（currentColor）。 */
export function IconPieces({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <g fill="currentColor">
        <rect x="8.8" y="3.4" width="6.4" height="6.4" rx="1.6" />
        <rect x="2.4" y="10.4" width="6.4" height="6.4" rx="1.6" />
        <rect x="8.8" y="10.4" width="6.4" height="6.4" rx="1.6" />
        <rect x="15.2" y="10.4" width="6.4" height="6.4" rx="1.6" />
      </g>
    </svg>
  );
}

/** 自由堆疊（無盡模式）：一座越疊越高的小塔，跟「挑戰」的 T 形方塊分開。 */
export function IconFreeStack({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <g fill="currentColor">
        <rect x="2.6" y="15.2" width="5.6" height="5.6" rx="1.4" />
        <rect x="9.2" y="15.2" width="5.6" height="5.6" rx="1.4" />
        <rect x="15.8" y="15.2" width="5.6" height="5.6" rx="1.4" />
        <rect x="5.9" y="8.8" width="5.6" height="5.6" rx="1.4" />
        <rect x="12.5" y="8.8" width="5.6" height="5.6" rx="1.4" />
        <rect x="9.2" y="2.4" width="5.6" height="5.6" rx="1.4" />
      </g>
    </svg>
  );
}

/** 結算條件「方塊沒越過黃線」：虛線黃線＋線下的一塊方塊。 */
export function IconUnderLine({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M2.5 8h19" fill="none" stroke="#d99a0b" strokeWidth="2" strokeDasharray="3 2.4" strokeLinecap="round" />
      <rect x="8" y="12" width="8" height="8" rx="2" fill="#8ddff0" stroke="#4aa7bb" strokeWidth="1.2" />
    </svg>
  );
}

const miniBlock = (cell: number, color: string, border: string): CSSProperties => ({
  width: cell,
  height: cell,
  borderRadius: Math.max(1.5, cell * 0.28),
  background: color,
  border: `1px solid ${border}`,
  boxSizing: "border-box",
});

/** 目標圖示（任務列與地圖大卡共用）：一排方塊＝消排、兩排石頭＝清石頭、兩排黃方塊＝一次消兩排。 */
export function BlockGoalIcon({ goal, cell = 7 }: { goal: BlockGoal; cell?: number }) {
  const gap = cell >= 9 ? 2 : 1;
  const row = (color: string, border: string) => (
    <span style={{ display: "flex", gap }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={miniBlock(cell, color, border)} />
      ))}
    </span>
  );
  const box: CSSProperties = { display: "inline-grid", gap, alignContent: "center" };
  if (goal.kind === "clear-stones") {
    return <span aria-hidden style={box}>{row("#cdbfb2", "#6f6258")}{row("#cdbfb2", "#6f6258")}</span>;
  }
  if (goal.kind === "multi-clear") {
    return <span aria-hidden style={box}>{row("#ffe16f", "#c9a032")}{row("#ffe16f", "#c9a032")}</span>;
  }
  return <span aria-hidden style={box}>{row("#8ddff0", "#4aa7bb")}</span>;
}

/**
 * 迷你起始盤（地圖大卡、任務列站名旁）：8 欄，上面補空排，石頭在底（由下往上），缺口亮黃。
 * 格子大小吃 `--mini-cell`（外層 CSS 依版面調整），沒設就用 `cell`。
 */
export function MiniStoneBoard({ stones, rows = 6, cell = 7 }: { stones: readonly string[]; rows?: number; cell?: number }) {
  const empty = Math.max(0, rows - stones.length);
  const lines = [...Array<string>(empty).fill("........"), ...[...stones].reverse()];
  const size = `var(--mini-cell, ${cell}px)`;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(8, ${size})`,
        gap: 1,
        padding: `calc(${size} * 0.5)`,
        borderRadius: `calc(${size} + 1px)`,
        background: "linear-gradient(180deg,#3d3f82,#2a2c5e)",
        flex: "none",
      }}
    >
      {lines.flatMap((line, r) =>
        [...line].map((ch, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              width: size,
              height: size,
              borderRadius: 1.5,
              background: r < empty ? "rgba(255,255,255,.06)" : ch === "X" ? "#cdbfb2" : "rgba(255,232,137,.55)",
            }}
          />
        )),
      )}
    </span>
  );
}
