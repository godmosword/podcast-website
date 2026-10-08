"use client";

/**
 * 《繽紛樂園》版面尺寸、觸控鍵與方塊預覽（原樣搬自 BlockDropView）。
 */
import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  IconBox,
  IconChevronLeft,
  IconChevronRight,
  IconRotate,
  IconSwipeDown,
} from "@/components/games/ClayIcons";
import { SHAPES, type PieceType } from "@/lib/games/block-drop/pieces";
import {
  BLOCK_SYMBOL_BG,
  COLORS,
  MACARON_THEME,
  WIDE_MAX_BOARD_W,
  WIDE_SIDE_W,
  hintChip,
  panelLabel,
} from "./blockDropTheme";

export type LayoutMode = "mobile" | "tablet" | "desktop" | "landscape";

export type KeyMetrics = {
  /** 鍵的邊長（兒童觸控 ≥48px） */
  key: number;
  icon: number;
  /** 相鄰鍵間距（≥12px） */
  gap: number;
};

export type LayoutMetrics = {
  shellPad: string;
  shellMaxW: number;
  sideColW: number;
  boardMaxW: number | undefined;
  playGap: number;
  /** 觸控鍵（只在 coarse pointer） */
  keys: KeyMetrics | null;
  /** bar＝井下一列；sides＝橫向手機兩側 */
  keyLayout: "bar" | "sides";
  hud: { hold: number; nextFirst: number; nextRest: number };
};

/** 橫向手機（矮且寬）走兩側鍵欄，不進平板版型。 */
export function layoutModeFor(w: number, h: number): LayoutMode {
  if (w > h && h < 520 && w >= 560) return "landscape";
  return w >= 980 && h >= 620 ? "desktop" : w >= 700 ? "tablet" : "mobile";
}

export function getLayoutMetrics(mode: LayoutMode, isCoarse: boolean): LayoutMetrics {
  switch (mode) {
    case "mobile":
      return {
        shellPad: "6px 10px 6px",
        shellMaxW: 420,
        sideColW: 0,
        boardMaxW: undefined,
        playGap: 6,
        keys: isCoarse ? { key: 52, icon: 22, gap: 12 } : null,
        keyLayout: "bar",
        hud: { hold: 12, nextFirst: 9, nextRest: 6 },
      };
    case "tablet":
      return {
        shellPad: "16px 18px",
        shellMaxW: WIDE_MAX_BOARD_W + WIDE_SIDE_W * 2 + 56,
        sideColW: WIDE_SIDE_W,
        boardMaxW: 400,
        playGap: 12,
        keys: isCoarse ? { key: 60, icon: 24, gap: 14 } : null,
        keyLayout: "bar",
        hud: { hold: 16, nextFirst: 13, nextRest: 9 },
      };
    case "desktop":
      return {
        shellPad: "18px 22px",
        shellMaxW: WIDE_MAX_BOARD_W + WIDE_SIDE_W * 2 + 80,
        sideColW: WIDE_SIDE_W + 4,
        boardMaxW: WIDE_MAX_BOARD_W,
        playGap: 14,
        keys: isCoarse ? { key: 60, icon: 24, gap: 14 } : null,
        keyLayout: "bar",
        hud: { hold: 18, nextFirst: 16, nextRest: 11 },
      };
    case "landscape":
      return {
        shellPad: "4px 8px",
        shellMaxW: 960,
        sideColW: 200,
        boardMaxW: undefined,
        playGap: 10,
        keys: isCoarse ? { key: 52, icon: 22, gap: 12 } : null,
        keyLayout: "sides",
        hud: { hold: 10, nextFirst: 9, nextRest: 6 },
      };
  }
}

/** DESIGN §觸控：目標下限 44px、相鄰間距下限 8px（平常用 52／12）。 */
export const MIN_KEY_W = 44;
export const MIN_KEY_GAP = 8;

/**
 * 井下鍵列放不下時才縮：320 寬的手機五顆 52px 鍵＋12px 間距要 308px，
 * 鍵列只有 262px，「落下」整顆被切掉。間距先縮到 8px，鍵再由 flex 縮到不低於 44px；
 * 360 以上幾乎不變，平板與橫向（兩側鍵欄是固定格線）維持原尺寸。
 */
const keyGap = (metrics: KeyMetrics) =>
  `clamp(${MIN_KEY_GAP}px, calc(10vw - 24px), ${metrics.gap}px)`;

function keyStyle(metrics: KeyMetrics, extra: CSSProperties = {}): CSSProperties {
  return {
    ...hintChip,
    flexDirection: "column",
    gap: 2,
    borderRadius: 16,
    width: metrics.key,
    minWidth: MIN_KEY_W,
    flexShrink: 1,
    minHeight: metrics.key,
    height: metrics.key,
    justifyContent: "center",
    padding: "0 6px",
    boxShadow: "0 4px 12px rgba(126,96,112,.14)",
    touchAction: "manipulation",
    cursor: "pointer",
    fontSize: 11,
    lineHeight: 1,
    ...extra,
  };
}

export type DropMode = "hard" | "soft";

type KeysProps = {
  metrics: KeyMetrics;
  dropMode: DropMode;
  showHold: boolean;
  holdType: PieceType | null;
  canHold: boolean;
  /** 輕鬆冒險閒置時讓 ↓ 亮起 */
  dropGlow?: boolean;
  onRotate: () => void;
  onMoveLeftDown: () => void;
  onMoveRightDown: () => void;
  onMoveStop: () => void;
  onDropDown: () => void;
  onDropUp: () => void;
  onHold: () => void;
};

/** 按住型按鍵：pointer capture，手指滑出仍視為按住（DESIGN 遊戲虛擬鍵規範）。 */
function useHoldHandlers(onDown: () => void, onUp: () => void) {
  const pointerRef = useRef<number | null>(null);
  const release = (el: HTMLButtonElement, pointerId: number) => {
    try {
      if (el.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      // 部分環境不支援 capture
    }
  };
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // 部分環境不支援 capture
      }
      pointerRef.current = e.pointerId;
      onDown();
    },
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (pointerRef.current !== null && e.pointerId !== pointerRef.current) return;
      release(e.currentTarget, e.pointerId);
      pointerRef.current = null;
      onUp();
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLButtonElement>) => {
      release(e.currentTarget, e.pointerId);
      pointerRef.current = null;
      onUp();
    },
    onLostPointerCapture: () => {
      if (pointerRef.current === null) return;
      pointerRef.current = null;
      onUp();
    },
  };
}

function KeyLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <>
      <span aria-hidden style={{ lineHeight: 0 }}>{icon}</span>
      <span aria-hidden style={{ fontWeight: 900 }}>{text}</span>
    </>
  );
}

function MoveKeys({ metrics, onMoveLeftDown, onMoveRightDown, onMoveStop }: KeysProps) {
  const left = useHoldHandlers(onMoveLeftDown, onMoveStop);
  const right = useHoldHandlers(onMoveRightDown, onMoveStop);
  return (
    <>
      <button type="button" aria-label="左移" style={keyStyle(metrics)} {...left}>
        <KeyLabel icon={<IconChevronLeft size={metrics.icon} />} text="左" />
      </button>
      <button type="button" aria-label="右移" style={keyStyle(metrics)} {...right}>
        <KeyLabel icon={<IconChevronRight size={metrics.icon} />} text="右" />
      </button>
    </>
  );
}

function ActionKeys(props: KeysProps) {
  const { metrics, dropMode, showHold, holdType, canHold, dropGlow, onRotate, onDropDown, onDropUp, onHold } = props;
  const drop = useHoldHandlers(onDropDown, onDropUp);
  const holdCell = Math.max(6, Math.floor(metrics.key / 7));
  return (
    <>
      {showHold ? (
        <button
          type="button"
          aria-label="暫存"
          style={keyStyle(metrics, { opacity: canHold ? 1 : 0.45 })}
          onClick={onHold}
        >
          {holdType ? (
            <>
              <PiecePreview type={holdType} cell={holdCell} />
              <span aria-hidden style={{ fontWeight: 900 }}>先放著</span>
            </>
          ) : (
            <KeyLabel icon={<IconBox size={metrics.icon} color={MACARON_THEME.inkSoft} />} text="先放著" />
          )}
        </button>
      ) : null}
      <button type="button" aria-label="旋轉" style={keyStyle(metrics)} onClick={onRotate}>
        <KeyLabel icon={<IconRotate size={metrics.icon} />} text="轉" />
      </button>
      <button
        type="button"
        aria-label={dropMode === "hard" ? "落下" : "往下（按住快快落）"}
        data-drop-mode={dropMode}
        data-glow={dropGlow ? "true" : undefined}
        style={keyStyle(
          metrics,
          dropGlow ? { boxShadow: "0 0 0 3px #ffe889, 0 0 14px rgba(255,210,111,.7)" } : {},
        )}
        {...drop}
      >
        <KeyLabel icon={<IconSwipeDown size={metrics.icon} />} text={dropMode === "hard" ? "落下" : "快快落"} />
      </button>
    </>
  );
}

/**
 * 井下鍵列（直向）：◀ ▶ 在左側拇指、轉與 ↓（與暫存）在右側拇指；鍵 ≥48px、間距 ≥12px、附短字。
 * 橫向手機：part="left" 放 ◀ ▶、part="right" 放轉、↓、暫存，分在井的兩側。
 */
export function BlockDropKeys(props: KeysProps & { part?: "bar" | "left" | "right" }) {
  const { part = "bar", metrics } = props;
  if (part === "left" || part === "right") {
    return (
      <div
        data-testid="touch-control-pad"
        data-part={part}
        style={{
          display: "grid",
          gridTemplateColumns: part === "left" ? `repeat(2, ${metrics.key}px)` : `${metrics.key}px`,
          gap: metrics.gap,
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        {part === "left" ? <MoveKeys {...props} /> : <ActionKeys {...props} />}
      </div>
    );
  }
  return (
    <div
      data-testid="touch-control-pad"
      data-part="bar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: keyGap(metrics),
        width: "100%",
        marginTop: 6,
      }}
    >
      <div style={{ display: "flex", gap: keyGap(metrics), minWidth: 0 }}>
        <MoveKeys {...props} />
      </div>
      <div style={{ display: "flex", gap: keyGap(metrics), minWidth: 0 }}>
        <ActionKeys {...props} />
      </div>
    </div>
  );
}

export function PanelTitle({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div
      aria-hidden
      style={{
        ...panelLabel,
        marginBottom: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

export function PiecePreview({ type, cell }: { type: PieceType | null; cell: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cell}px)`,
        gridTemplateRows: `repeat(2, ${cell}px)`,
        gap: 2,
        justifyContent: "center",
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => {
        const c = i % 4;
        const r = Math.floor(i / 4);
        const on = type && SHAPES[type][0].some(([cc, rr]) => cc === c && rr === r);
        return (
          <div
            key={i}
            style={
              on
                ? {
                    width: "100%",
                    height: "100%",
                    background: `${BLOCK_SYMBOL_BG[type as PieceType]}, ${COLORS[type as PieceType]}`,
                    backgroundSize: "42% 42%, 100% 100%",
                    backgroundPosition: "center, 0 0",
                    backgroundRepeat: "no-repeat, no-repeat",
                    borderRadius: Math.max(5, cell / 2.8),
                    boxShadow:
                      "inset 2px 2px 0 rgba(255,255,255,.62), inset -2px -2px 0 rgba(111,72,86,.16), 0 3px 6px rgba(117,88,119,.16)",
                  }
                : { background: "transparent" }
            }
          />
        );
      })}
    </div>
  );
}

