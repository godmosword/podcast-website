"use client";

import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { DROP_ITEM, type BoardState } from "@/lib/games/candy-match/engine";
import { CANDY_MATCH_PIECES } from "@/lib/games/candy-match/levels";
import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";

/**
 * 消除棋盤：渲染格子＋圖案，處理「點兩下相鄰」與「拖一下」兩種交換手勢。
 * 動畫（選取縮放、提示發光、消除 pop）以 CSS class/style 呈現。
 */

type CandyMatchBoardProps = {
  board: BoardState;
  cellPx: number;
  selected: number | null;
  hint: { a: number; b: number } | null;
  /** 正在 pop 消失的格子 */
  popping: Set<number>;
  /** 非法交換搖頭中的兩格 */
  shaking: Set<number>;
  disabled: boolean;
  onTapCell: (i: number) => void;
  onSwipeCell: (from: number, to: number) => void;
};

export function CandyMatchBoard({
  board,
  cellPx,
  selected,
  hint,
  popping,
  shaking,
  disabled,
  onTapCell,
  onSwipeCell,
}: CandyMatchBoardProps) {
  const dragRef = useRef<{ index: number; x: number; y: number; fired: boolean } | null>(null);
  const { cols, rows, pieces, dirt } = board;

  const onPointerDown = (i: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    dragRef.current = { index: i, x: e.clientX, y: e.clientY, fired: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.fired || disabled) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) < 14) return;
    d.fired = true;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const col = d.index % cols;
    const row = Math.floor(d.index / cols);
    let target = -1;
    if (horizontal) {
      const nc = col + (dx > 0 ? 1 : -1);
      if (nc >= 0 && nc < cols) target = row * cols + nc;
    } else {
      const nr = row + (dy > 0 ? 1 : -1);
      if (nr >= 0 && nr < rows) target = nr * cols + col;
    }
    if (target >= 0) onSwipeCell(d.index, target);
  };

  const onPointerUp = (i: number) => () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (disabled) return;
    if (d && d.index === i && !d.fired) onTapCell(i);
  };

  const hintSet = hint ? new Set([hint.a, hint.b]) : new Set<number>();

  return (
    <div
      data-testid="candy-match-board"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
        gap: 6,
        padding: 10,
        borderRadius: 22,
        background: "rgba(255,255,255,.66)",
        boxShadow:
          "0 14px 30px rgba(150,110,130,.16), inset 0 2px 0 rgba(255,255,255,.9)",
        touchAction: "none",
        justifyContent: "center",
      }}
    >
      {pieces.map((v, i) => {
        const isSelected = selected === i;
        const isHint = hintSet.has(i);
        const isPopping = popping.has(i);
        const isShaking = shaking.has(i);
        const pieceName = v === DROP_ITEM
          ? "禮物盒"
          : v >= 0
            ? CANDY_MATCH_PIECES[v]?.name ?? "圖案"
            : "空格";
        const cellStyle: CSSProperties = {
          position: "relative",
          width: cellPx,
          height: cellPx,
          border: "none",
          padding: 3,
          borderRadius: Math.max(10, cellPx * 0.26),
          background:
            (i % cols) % 2 === Math.floor(i / cols) % 2
              ? "rgba(255,221,230,.5)"
              : "rgba(208,240,255,.5)",
          cursor: disabled ? "default" : "pointer",
          WebkitTapHighlightColor: "transparent",
          transition: "transform .15s ease",
          transform: isSelected ? "scale(1.12)" : "scale(1)",
          boxShadow: isSelected
            ? "0 0 0 3px #ff9fb7, 0 6px 14px rgba(217,95,135,.3)"
            : isHint
              ? "0 0 0 3px rgba(255,211,77,.9), 0 0 14px rgba(255,211,77,.6)"
              : "none",
          animation: isShaking
            ? "candyMatchShake .3s ease"
            : isHint
              ? "candyMatchGlow 1s ease-in-out infinite"
              : "none",
          zIndex: isSelected ? 2 : 1,
        };
        return (
          <button
            key={i}
            type="button"
            aria-label={`第 ${Math.floor(i / cols) + 1} 列第 ${(i % cols) + 1} 格，${pieceName}`}
            aria-pressed={isSelected}
            data-selected={isSelected ? "true" : undefined}
            style={cellStyle}
            onPointerDown={onPointerDown(i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp(i)}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            {dirt[i] && (
              <span style={{ position: "absolute", inset: 0 }}>
                <DirtOverlay size="100%" />
              </span>
            )}
            <span
              style={{
                position: "absolute",
                inset: 3,
                display: "block",
                transition: "opacity .22s ease, transform .22s ease",
                opacity: isPopping || v < 0 ? 0 : 1,
                transform: isPopping ? "scale(1.45)" : "scale(1)",
              }}
            >
              {v === DROP_ITEM ? <PieceGift size="100%" /> : v >= 0 ? <PieceArt piece={v} size="100%" /> : null}
            </span>
          </button>
        );
      })}
      <style>{`
        @keyframes candyMatchGlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes candyMatchShake {
          0%, 100% { transform: translateX(0); }
          30% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="candy-match-board"] button { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
