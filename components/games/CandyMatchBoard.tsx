"use client";

import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  CANDY_FALL_MS,
  CANDY_SWAP_MS,
  CANDY_SWEEP_MS,
  type CandyFallMotion,
  DROP_ITEM,
  emptySpecials,
  type BoardState,
} from "@/lib/games/candy-match/engine";
import {
  CANDY_MATCH_BOARD_PADDING,
  CANDY_MATCH_CELL_GAP,
  candyMatchSwapOffset,
} from "@/lib/games/candy-match/cell-size";
import { CANDY_MATCH_PIECES } from "@/lib/games/candy-match/levels";
import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";
import styles from "./CandyMatchBoard.module.css";

/**
 * 消除棋盤：渲染格子＋圖案，處理「點兩下相鄰」與「拖一下」兩種交換手勢。
 * 動畫（選取縮放、提示發光、消除 pop、交換／掉落）以 CSS class/style 呈現。
 */

export type CandyMatchBoardMotion = {
  swap?: { a: number; b: number } | null;
  falls?: readonly CandyFallMotion[] | null;
  reduced?: boolean;
  sweep?: "row" | "color" | null;
};

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
  motion?: CandyMatchBoardMotion;
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
  motion,
}: CandyMatchBoardProps) {
  const dragRef = useRef<{
    index: number;
    pointerId: number;
    x: number;
    y: number;
    fired: boolean;
  } | null>(null);
  const { cols, rows, pieces, dirt } = board;
  const specials = board.specials ?? emptySpecials(pieces.length);
  const reduced = Boolean(motion?.reduced);
  const swap = reduced ? null : motion?.swap ?? null;
  const sweep = reduced ? null : motion?.sweep ?? null;
  const fallByTo = new Map<number, number>();
  if (!reduced) {
    for (const fall of motion?.falls ?? []) {
      fallByTo.set(fall.to, fall.rows);
    }
  }

  const releaseCapture = (el: HTMLButtonElement, pointerId: number) => {
    try {
      if (el.hasPointerCapture?.(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    } catch {
      // 部分環境不支援 capture
    }
  };

  const clearDrag = (el: HTMLButtonElement, pointerId: number) => {
    dragRef.current = null;
    releaseCapture(el, pointerId);
  };

  const onPointerDown = (i: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 部分環境不支援 capture
    }
    dragRef.current = {
      index: i,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      fired: false,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId || d.fired || disabled) return;
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

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    releaseCapture(e.currentTarget, e.pointerId);
    if (disabled) return;
    // capture 下 up 落在按下的格子；以 drag 起點 index 觸發 tap
    if (!d.fired) onTapCell(d.index);
  };

  const onPointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    clearDrag(e.currentTarget, e.pointerId);
  };

  const onLostPointerCapture = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d && d.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  const hintSet = hint ? new Set([hint.a, hint.b]) : new Set<number>();

  return (
    <div
      data-testid="candy-match-board"
      data-swap={swap ? `${swap.a}-${swap.b}` : undefined}
      data-falling={fallByTo.size > 0 ? "true" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
        gap: CANDY_MATCH_CELL_GAP,
        padding: CANDY_MATCH_BOARD_PADDING,
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
        const specialKind = specials[i] === "row" || specials[i] === "color" ? specials[i] : null;
        const specialName = specialKind === "row" ? "掃把糖" : specialKind === "color" ? "彩虹糖" : "";
        const swapPeer = swap
          ? i === swap.a
            ? swap.b
            : i === swap.b
              ? swap.a
              : null
          : null;
        const swapOff = swapPeer != null
          ? candyMatchSwapOffset(i, swapPeer, cols, cellPx)
          : null;
        const fallRows = fallByTo.get(i) ?? 0;
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
          transition: reduced ? "none" : "transform .15s ease",
          transform: isSelected && !swapOff ? "scale(1.12)" : "scale(1)",
          boxShadow: isSelected
            ? "0 0 0 3px #ff9fb7, 0 6px 14px rgba(217,95,135,.3)"
            : isHint
              ? "0 0 0 3px rgba(255,211,77,.9), 0 0 14px rgba(255,211,77,.6)"
              : "none",
          animation: reduced
            ? "none"
            : isShaking
              ? "candyMatchShake .3s ease"
              : isHint
                ? "candyMatchGlow 1s ease-in-out infinite"
                : "none",
          zIndex: isSelected || swapOff ? 2 : 1,
        };
        const artClass = [
          styles.pieceArt,
          isPopping ? styles.piecePop : "",
          v < 0 && v !== DROP_ITEM ? styles.pieceHidden : "",
          swapOff ? styles.pieceSwap : "",
          fallRows > 0 ? styles.pieceFall : "",
          isPopping && sweep ? styles.pieceSweep : "",
        ]
          .filter(Boolean)
          .join(" ");
        const artStyle: CSSProperties = swapOff
          ? {
              ["--swap-dx" as string]: `${swapOff.dx}px`,
              ["--swap-dy" as string]: `${swapOff.dy}px`,
              ["--swap-ms" as string]: `${CANDY_SWAP_MS}ms`,
            }
          : fallRows > 0
            ? {
                ["--fall-from" as string]: `${-fallRows * (cellPx + CANDY_MATCH_CELL_GAP)}px`,
                ["--fall-ms" as string]: `${CANDY_FALL_MS}ms`,
              }
            : sweep
              ? { ["--sweep-ms" as string]: `${CANDY_SWEEP_MS}ms` }
              : {};
        return (
          <button
            key={i}
            type="button"
            aria-label={`第 ${Math.floor(i / cols) + 1} 列第 ${(i % cols) + 1} 格，${pieceName}${specialName ? `，${specialName}` : ""}`}
            aria-pressed={isSelected}
            data-selected={isSelected ? "true" : undefined}
            data-hint={isHint ? "true" : undefined}
            data-special={specialKind ?? undefined}
            data-sweep={isPopping && sweep ? sweep : undefined}
            data-swap={swapOff ? "true" : undefined}
            data-fall-rows={fallRows > 0 ? String(fallRows) : undefined}
            style={cellStyle}
            onPointerDown={onPointerDown(i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onLostPointerCapture}
          >
            {dirt[i] && (
              <span style={{ position: "absolute", inset: 0 }}>
                <DirtOverlay size="100%" />
              </span>
            )}
            <span className={artClass} style={artStyle}>
              {v === DROP_ITEM ? <PieceGift size="100%" /> : v >= 0 ? <PieceArt piece={v} size="100%" /> : null}
              {specialKind ? (
                <span className={styles.specialBadge} aria-hidden>
                  {specialKind === "row" ? "🧹" : "🌈"}
                </span>
              ) : null}
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
