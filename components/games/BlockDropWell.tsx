"use client";

/**
 * 《繽紛樂園》井：格子、落點影子、消排閃光、危險線、手勢層、回饋（原樣搬自 BlockDropView）。
 */
import type { CSSProperties, MutableRefObject, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { GameJuiceToast } from "@/components/games/GameJuiceToast";
import type { GameState } from "@/lib/games/block-drop/engine";
import { SHAPES, valid, type PieceType } from "@/lib/games/block-drop/pieces";
import type { ClearFx, Toast } from "./useBlockDropGame";
import {
  CELL,
  COLORS,
  MACARON_THEME,
  WELL_BG_BOTTOM,
  WELL_BG_TOP,
  blockStyle,
} from "./blockDropTheme";

type BoardGestures = {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (e: ReactPointerEvent<HTMLDivElement>) => void;
};

export function BlockDropWell({
  g,
  boardScale,
  boardTransform,
  reduced,
  lockFxRef,
  gestures,
  clearFx,
  toasts,
  dangerRow = 4,
  highlightGaps = false,
}: {
  g: GameState;
  boardScale: number;
  boardTransform: string | undefined;
  reduced: boolean;
  lockFxRef: MutableRefObject<{ cells: Set<number>; until: number }>;
  gestures: BoardGestures;
  clearFx: ClearFx | null;
  toasts: Toast[];
  /** 危險線所在列（自由堆疊 4、任務冒險約頂端 20%） */
  dangerRow?: number;
  /** 前幾站：石頭排的缺口加亮框 */
  highlightGaps?: boolean;
}) {
  const COLS = g.board[0]?.length ?? 10;
  const ROWS = g.board.length;
  const BOARD_W = COLS * CELL;
  const BOARD_H = ROWS * CELL;
  const stoneRows = new Set(g.board.flatMap((row, y) => (row.includes("X") ? [y] : [])));
  const view = g.board.map((row) => row.slice());
  const activeSet = new Set<number>();
  const ghostSet = new Set<number>();
  if (g.active) {
    let gy = g.active.y;
    while (valid({ ...g.active, y: gy + 1 }, g.board)) gy++;
    for (const [c, r] of SHAPES[g.active.type][g.active.rot]) {
      const x = g.active.x + c;
      const y = gy + r;
      if (y >= 0) ghostSet.add(y * COLS + x);
    }
    for (const [c, r] of SHAPES[g.active.type][g.active.rot]) {
      const x = g.active.x + c;
      const y = g.active.y + r;
      if (y >= 0) activeSet.add(y * COLS + x);
    }
  }
  const clearSet = new Set(g.clearing ? g.clearRows : []);

  return (
    <>
         <div
           style={{
             position: "absolute",
             top: 0,
            left: "50%",
            marginLeft: -(BOARD_W * boardScale) / 2,
            width: BOARD_W,
            height: BOARD_H,
            transform: `${boardTransform ?? ""} scale(${boardScale})`.trim(),
            transformOrigin: "top left",
            // G-M1：井底改深藍紫（對齊封面「深藍井＋鮮豔糖塊」），粉彩方塊才跳得出來
            background: `linear-gradient(180deg, ${WELL_BG_TOP}, ${WELL_BG_BOTTOM})`,
            borderRadius: 16,
            boxShadow:
              "inset 0 0 0 3px rgba(255,255,255,.55), inset 0 -12px 24px rgba(0,0,0,.18), 0 16px 28px rgba(60,50,110,.28)",
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, idx) => {
            const x = idx % COLS;
            const y = Math.floor(idx / COLS);
            const isClearing = clearSet.has(y);
            let cell: ReactNode = null;
            if (activeSet.has(idx) && g.active) {
              cell = <div style={blockStyle(g.active.type, true)} />;
            } else if (view[y][x] === "X") {
              cell = <div data-stone="true" style={stoneStyle} />;
            } else if (view[y][x]) {
              const squashing =
                lockFxRef.current.cells.has(idx) &&
                performance.now() < lockFxRef.current.until;
              cell = (
                <div
                  style={
                    squashing
                      ? {
                          ...blockStyle(view[y][x] as PieceType),
                          animation: "blockSquash .24s ease-out",
                          transformOrigin: "50% 100%",
                        }
                      : blockStyle(view[y][x] as PieceType)
                  }
                />
              );
            } else if (highlightGaps && stoneRows.has(y) && !ghostSet.has(idx)) {
              cell = <div data-gap="true" style={gapStyle} />;
            } else if (ghostSet.has(idx) && g.active) {
              const ghostColor = COLORS[g.active.type];
              cell = (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 6,
                    border: `2px dashed color-mix(in srgb, ${ghostColor} 80%, #fff)`,
                    background: `color-mix(in srgb, ${ghostColor} 32%, ${WELL_BG_BOTTOM})`,
                    boxSizing: "border-box",
                  }}
                />
              );
            }
            return (
              <div
                key={idx}
                style={{
                  width: CELL,
                  height: CELL,
                  padding: 1,
                  boxSizing: "border-box",
                  background:
                    (x + y) % 2 === 0
                      ? "rgba(255,255,255,.06)"
                      : "rgba(255,255,255,.025)",
                  boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,.09)",
                  animation:
                    isClearing && !reduced ? "lineFlash .26s linear" : "none",
                }}
              >
                {isClearing ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg,#fff,#ffe889,#b9f3db)",
                      borderRadius: 8,
                      boxShadow: "0 0 10px rgba(255,210,111,.45)",
                    }}
                  />
                ) : (
                  cell
                )}
              </div>
            );
             })}
         </div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: Math.max(0, Math.round(CELL * dangerRow * boardScale) - 2),
            zIndex: 2,
            height: 0,
            // 危險線：檸檬黃虛線（與所有方塊色區分，不再用 Z 方塊的粉紅）
            borderTop: "2px dashed rgba(255,232,137,.85)",
            boxShadow: "0 0 8px rgba(255,232,137,.3)",
            pointerEvents: "none",
          }}
        />
        {g.status === "playing" && (
          <div
            aria-hidden
            data-testid="board-gesture"
            onPointerDown={gestures.onPointerDown}
            onPointerMove={gestures.onPointerMove}
            onPointerUp={gestures.onPointerUp}
            onPointerCancel={gestures.onPointerCancel}
            onLostPointerCapture={gestures.onLostPointerCapture}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              touchAction: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          />
        )}

         <div
           style={{
             position: "absolute",
             top: 10,
            left: 0,
            right: 0,
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
             pointerEvents: "none",
           }}
         >
          {clearFx && (
            <div
              key={clearFx.id}
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "42%",
                transform: "translate(-50%,-50%)",
                minWidth: 150,
                padding: "12px 22px",
                borderRadius: 999,
                color: MACARON_THEME.ink,
                background:
                  clearFx.kind === "confetti"
                    ? "linear-gradient(90deg,#ffe889,#b9f3db,#d8c7ff,#ffb4cf)"
                    : "rgba(255,255,255,.88)",
                border: "2px solid rgba(255,255,255,.95)",
                boxShadow:
                  "0 12px 26px rgba(146,106,121,.2), inset 0 2px 0 rgba(255,255,255,.78)",
                fontSize: 24,
                fontWeight: 900,
                textAlign: "center",
                animation: reduced ? "none" : "clearBurst .82s ease-out forwards",
              }}
            >
              {clearFx.text}
              {Array.from({ length: clearFx.kind === "confetti" ? 14 : 8 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${8 + ((i * 23) % 84)}%`,
                    top: `${clearFx.kind === "wave" ? 68 : 38 + ((i * 17) % 24)}%`,
                    width: clearFx.kind === "wave" ? 18 : 9,
                    height: clearFx.kind === "wave" ? 5 : 9,
                    borderRadius: clearFx.kind === "spark" ? 2 : 4,
                    background:
                      [
                        MACARON_THEME.lemon,
                        MACARON_THEME.mint,
                        MACARON_THEME.sky,
                        MACARON_THEME.berry,
                        MACARON_THEME.lavender,
                      ][i % 5],
                    transform: `rotate(${i * 31}deg)`,
                    animation: reduced ? "none" : `candyPop .72s ease-out ${i * 0.025}s forwards`,
                  }}
                />
              ))}
            </div>
          )}
          {toasts.map((t) => (
            <GameJuiceToast
              key={t.id}
              text={t.text}
              big={t.big}
              reduced={reduced}
            />
          ))}
        </div>
    </>
  );
}

/** 石頭：暖灰顆粒＋深一階實線外框，在深藍井底上對比 ≥3:1，與空格、影子分得開。 */
const stoneStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  borderRadius: 4,
  border: "2px solid #6f6258",
  backgroundColor: "#cdbfb2",
  backgroundImage:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,.55) 0 12%, transparent 13%), radial-gradient(circle at 70% 65%, rgba(111,98,88,.35) 0 10%, transparent 11%), radial-gradient(circle at 35% 75%, rgba(111,98,88,.25) 0 8%, transparent 9%)",
};

/** 缺口提示（前幾站）：靜態檸檬黃虛框，reduced motion 也一樣。 */
const gapStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  borderRadius: 5,
  border: "2px dashed rgba(255,232,137,.9)",
  background: "rgba(255,232,137,.12)",
};
