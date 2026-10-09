"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CANDY_FALL_MS,
  CANDY_SWAP_MS,
  CANDY_SWEEP_MS,
  type CandyFallMotion,
  DROP_ITEM,
  emptySpecials,
  type BoardState,
  type CandySweepKind,
} from "@/lib/games/candy-match/engine";
import {
  CANDY_MATCH_BOARD_PADDING,
  CANDY_MATCH_CELL_GAP,
  candyMatchSwapOffset,
} from "@/lib/games/candy-match/cell-size";
import { CANDY_MATCH_PIECES } from "@/lib/games/candy-match/levels";
import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";
import { IconBroom, IconConfetti, IconRainbow } from "@/components/games/ClayIcons";
import { IconPointingHand } from "@/components/games/CandyMatchIcons";
import styles from "./CandyMatchBoard.module.css";

/** 特殊糖角落徽章：站上黏土圖示（取代 🧹🌈💥，各裝置長相一致、跟棋盤同畫風）。 */
const SPECIAL_BADGE = { row: IconBroom, color: IconRainbow, burst: IconConfetti } as const;
const BADGE_FILL = { width: "100%", height: "100%" } as const;

/**
 * 消除棋盤：渲染格子＋圖案，處理「點兩下相鄰」與「拖一下」兩種交換手勢，
 * 以及鍵盤（方向鍵移焦點、Enter／空白鍵選格、Esc 取消）。
 * 動畫（選取縮放、提示發光、消除 pop、交換／掉落）以 CSS class/style 呈現。
 * 道具預覽格以虛線框標出；有禮物的欄在棋盤下方標出口。
 */

type CandyMatchBoardMotion = {
  swap?: { a: number; b: number } | null;
  falls?: readonly CandyFallMotion[] | null;
  reduced?: boolean;
  sweep?: CandySweepKind | null;
  /** K-7：連擊時整盤車車跳一下 */
  cheer?: boolean;
};

type CandyMatchBoardProps = {
  board: BoardState;
  cellPx: number;
  selected: number | null;
  hint: { a: number; b: number } | null;
  /** 第一局交換教學，獨立於閒置 hint，點錯不會清掉。 */
  teach?: { a: number; b: number } | null;
  /** 正在 pop 消失的格子 */
  popping: ReadonlySet<number>;
  /** 非法交換搖頭中的兩格 */
  shaking: ReadonlySet<number>;
  disabled: boolean;
  onTapCell: (i: number) => void;
  onSwipeCell: (from: number, to: number) => void;
  /** 道具預覽：作用範圍內的格子 */
  preview?: ReadonlySet<number>;
  /** 滑鼠移入格子（道具預覽用；觸控不觸發） */
  onHoverCell?: (i: number | null) => void;
  /** Esc：取消選取或道具 */
  onCancel?: () => void;
  motion?: CandyMatchBoardMotion;
};

const NO_PREVIEW: ReadonlySet<number> = new Set();

export function CandyMatchBoard({
  board,
  cellPx,
  selected,
  hint,
  teach = null,
  popping,
  shaking,
  disabled,
  onTapCell,
  onSwipeCell,
  preview = NO_PREVIEW,
  onHoverCell,
  onCancel,
  motion,
}: CandyMatchBoardProps) {
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
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
  const giftColumns = new Set<number>();
  pieces.forEach((v, i) => {
    if (v === DROP_ITEM) giftColumns.add(i % cols);
  });
  const rovingIndex = Math.min(focusIndex, pieces.length - 1);

  const moveFocus = (to: number) => {
    setFocusIndex(to);
    gridRef.current?.querySelectorAll<HTMLButtonElement>("button[data-cell]")[to]?.focus();
  };

  const onKeyDown = (i: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const step: Record<string, number | null> = {
      ArrowLeft: col > 0 ? i - 1 : null,
      ArrowRight: col < cols - 1 ? i + 1 : null,
      ArrowUp: row > 0 ? i - cols : null,
      ArrowDown: row < rows - 1 ? i + cols : null,
    };
    if (e.key in step) {
      e.preventDefault();
      const to = step[e.key];
      if (to != null) moveFocus(to);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
    }
  };

  return (
    <div className={styles.boardFrame}>
      <div
        ref={gridRef}
        data-testid="candy-match-board"
        aria-disabled={disabled || undefined}
        data-cheer={!reduced && motion?.cheer ? "true" : undefined}
        data-swap={swap ? `${swap.a}-${swap.b}` : undefined}
        data-falling={fallByTo.size > 0 ? "true" : undefined}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") onHoverCell?.(null);
        }}
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
          const isPreview = preview.has(i);
          const dirtLayer = dirt[i] ?? 0;
          const pieceName = v === DROP_ITEM
            ? "禮物盒"
            : v >= 0
              ? CANDY_MATCH_PIECES[v]?.name ?? "圖案"
              : "空格";
          const dirtName = dirtLayer >= 2 ? "，厚污漬" : dirtLayer === 1 ? "，髒髒格" : "";
          const specialKind =
            specials[i] === "row" || specials[i] === "color" || specials[i] === "burst" ? specials[i] : null;
          const specialName =
            specialKind === "row" ? "掃把糖" : specialKind === "color" ? "彩虹糖" : specialKind === "burst" ? "爆炸糖" : "";
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
        const teachPeer = teach && !swapOff
          ? i === teach.a
            ? teach.b
            : i === teach.b
              ? teach.a
              : null
          : null;
        const teachOff = teachPeer != null
          ? candyMatchSwapOffset(i, teachPeer, cols, cellPx)
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
            boxShadow: isPreview
              ? "0 0 0 3px #7a5cc9, 0 0 0 6px rgba(255,255,255,.85)"
              : isSelected
              ? "0 0 0 3px #ff9fb7, 0 6px 14px rgba(217,95,135,.3)"
              : isHint || (reduced && teachOff)
                ? "0 0 0 3px rgba(255,211,77,.9), 0 0 14px rgba(255,211,77,.6)"
                : "none",
            animation: reduced
              ? "none"
              : isShaking
                ? "candyMatchShake .3s ease"
                : isHint
                  ? "candyMatchGlow 1s ease-in-out infinite"
                  : "none",
            zIndex: isSelected || swapOff || isPreview ? 2 : 1,
          };
          const artClass = [
            styles.pieceArt,
            isPopping ? styles.piecePop : "",
            v < 0 && v !== DROP_ITEM ? styles.pieceHidden : "",
            swapOff ? styles.pieceSwap : "",
            teachOff && !reduced ? styles.pieceTeach : "",
            fallRows > 0 ? styles.pieceFall : "",
            isPopping && sweep === "row" ? styles.sweepRow : "",
            isPopping && sweep === "color" ? styles.sweepColor : "",
            isPopping && sweep === "burst" ? styles.sweepBurst : "",
            isPopping && sweep === "cross" ? styles.sweepCross : "",
            isPopping && sweep === "board" ? styles.sweepBoard : "",
          ]
            .filter(Boolean)
            .join(" ");
          const artStyle: CSSProperties = {
            // K-7：跳一下依列錯開
            ["--cheer-col" as string]: String(i % cols),
            ...(swapOff
            ? {
                ["--swap-dx" as string]: `${swapOff.dx}px`,
                ["--swap-dy" as string]: `${swapOff.dy}px`,
                ["--swap-ms" as string]: `${CANDY_SWAP_MS}ms`,
              }
            : teachOff
              ? {
                  ["--swap-dx" as string]: `${teachOff.dx}px`,
                  ["--swap-dy" as string]: `${teachOff.dy}px`,
                }
            : fallRows > 0
              ? {
                  ["--fall-from" as string]: `${-fallRows * (cellPx + CANDY_MATCH_CELL_GAP)}px`,
                  ["--fall-ms" as string]: `${CANDY_FALL_MS}ms`,
                }
              : sweep
                ? { ["--sweep-ms" as string]: `${CANDY_SWEEP_MS}ms` }
                : {}),
          };
          return (
            <button
              key={i}
              type="button"
              aria-label={`第 ${Math.floor(i / cols) + 1} 列第 ${(i % cols) + 1} 格，${pieceName}${dirtName}${specialName ? `，${specialName}` : ""}${isPreview ? "，道具範圍" : ""}`}
              aria-pressed={isSelected}
              aria-disabled={disabled || undefined}
              tabIndex={i === rovingIndex ? 0 : -1}
              data-cell={i}
              data-selected={isSelected ? "true" : undefined}
              data-preview={isPreview ? "true" : undefined}
              data-hint={isHint || (reduced && teachOff) ? "true" : undefined}
              data-teach={teachOff ? "true" : undefined}
              data-dirt={dirtLayer > 0 ? String(dirtLayer) : undefined}
              data-special={specialKind ?? undefined}
              data-sweep={isPopping && sweep ? sweep : undefined}
              data-swap={swapOff ? "true" : undefined}
              data-fall-rows={fallRows > 0 ? String(fallRows) : undefined}
              style={cellStyle}
              onFocus={() => setFocusIndex(i)}
              onKeyDown={onKeyDown(i)}
              onClick={(e) => {
                // 鍵盤 Enter／空白鍵觸發的 click（detail 為 0）；指標操作走 pointer 事件
                if (e.detail === 0 && !disabled) onTapCell(i);
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") onHoverCell?.(i);
              }}
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onLostPointerCapture={onLostPointerCapture}
            >
              {dirtLayer > 0 && (
                <span style={{ position: "absolute", inset: 0 }}>
                  <DirtOverlay size="100%" thick={dirtLayer >= 2} />
                </span>
              )}
              <span className={artClass} style={artStyle}>
                {v === DROP_ITEM ? <PieceGift size="100%" /> : v >= 0 ? <PieceArt piece={v} size="100%" /> : null}
                {specialKind ? (
                  <span className={styles.specialBadge} data-kind={specialKind} aria-hidden>
                    {(() => {
                      const Badge = SPECIAL_BADGE[specialKind];
                      return <Badge style={BADGE_FILL} />;
                    })()}
                  </span>
                ) : null}
                {v === DROP_ITEM ? (
                  <span className={styles.giftArrow} aria-hidden>▼</span>
                ) : null}
              </span>
              {/* 第一步示範：手指點在要換的那一格，取代「① 先點一個圖案」的文字泡泡 */}
              {teachOff && teach && i === teach.a ? (
                <span className={styles.teachHand} data-teach-hand="true" aria-hidden>
                  <IconPointingHand size={Math.round(cellPx * 0.7)} />
                </span>
              ) : null}
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
      {giftColumns.size > 0 ? (
        <div
          className={styles.exitRow}
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
            columnGap: CANDY_MATCH_CELL_GAP,
            paddingInline: CANDY_MATCH_BOARD_PADDING,
          }}
          aria-label="禮物出口：把禮物送到這一欄最下面"
          role="note"
        >
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className={styles.exit} data-active={giftColumns.has(c) ? "true" : undefined}>
              {giftColumns.has(c) ? "▼ 出口" : ""}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
