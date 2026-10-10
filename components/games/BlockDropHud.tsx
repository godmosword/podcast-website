"use client";

/**
 * 《繽紛樂園》HUD：教學卡、暫存、下一個、分數（原樣搬自 BlockDropView）。
 */
import { IconBox, IconBulb, IconFlame, IconNext } from "@/components/games/ClayIcons";
import Icon from "@/components/ui/Icon";
import type { GameState } from "@/lib/games/block-drop/engine";
import type { PieceType } from "@/lib/games/block-drop/pieces";
import {
  BLOCK_DROP_TUTORIAL_COPY,
  type BlockDropTutorialStep,
} from "@/lib/games/block-drop/tutorial";
import { PanelTitle, PiecePreview, type LayoutMode } from "./BlockDropControls";
import { MACARON_THEME, panelLabel, panelStyle } from "./blockDropTheme";

/**
 * 自由堆疊三步教學。寬螢幕放在棋盤上方；手機浮在 HUD 列上（不擋井中央的方塊與落點影子）；
 * 矮手機改走井旁窄欄時（narrow）直排在欄內。「略過」是 ✕ 圖示鍵（≥44px）。
 */
export function BlockDropTutorialCard({
  g,
  wide,
  narrow = false,
  tutorialStep,
  skipTutorial,
}: {
  g: GameState;
  wide: boolean;
  narrow?: boolean;
  tutorialStep: BlockDropTutorialStep | null;
  skipTutorial: () => void;
}) {
  return (
    tutorialStep && g.status === "playing" ? (
      <div
        role="status"
        aria-live="polite"
        data-testid="block-drop-tutorial"
        data-step={tutorialStep}
        style={{
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
          border: "2px solid rgba(255,216,102,.8)",
          borderRadius: 14,
          color: MACARON_THEME.ink,
          background: "rgba(255,255,255,.88)",
          boxShadow: "0 6px 14px rgba(126,96,112,.12)",
          lineHeight: 1.35,
          // 手機蓋在 HUD 列上（分數／下一個暫時讓位），井中央保持乾淨
          ...(narrow
            ? { flexDirection: "column", width: "100%", margin: 0, padding: "6px 4px", gap: 4, textAlign: "center", fontSize: 11 }
            : wide
              ? { width: "min(100%, 420px)", margin: "0 auto 8px", padding: "8px 10px", gap: 8, fontSize: 12 }
              : { position: "absolute", top: 0, left: 0, right: 0, width: "auto", margin: 0, padding: "4px 4px 4px 10px", gap: 8, fontSize: 12, zIndex: 6 }),
        }}
      >
        <IconBulb size={22} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: narrow ? 12 : 13 }}>
            {BLOCK_DROP_TUTORIAL_COPY[tutorialStep].title}
          </strong>
          {BLOCK_DROP_TUTORIAL_COPY[tutorialStep].body}
        </span>
        <button
          type="button"
          onClick={skipTutorial}
          aria-label="略過教學"
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            padding: 0,
            border: "1px solid rgba(93,74,103,.18)",
            borderRadius: 999,
            color: MACARON_THEME.ink,
            background: "rgba(255,255,255,.72)",
            cursor: "pointer",
          }}
        >
          <Icon name="close" size={18} />
        </button>
      </div>
    ) : null
  );
}

export function BlockDropHoldButton({
  g,
  font,
  cell,
  holdPiece,
}: {
  g: GameState;
  font: string;
  cell: number;
  holdPiece: () => void;
}) {
  return (
    <button
      type="button"
      onClick={holdPiece}
      aria-label="暫存方塊"
      style={{
        ...panelStyle,
        border: "none",
        cursor: "pointer",
        fontFamily: font,
        opacity: g.status === "playing" && !g.canHold ? 0.45 : 1,
      }}
    >
      <PanelTitle
        icon={<IconBox size={15} color={MACARON_THEME.inkSoft} />}
        text="暫存"
      />
      <PiecePreview type={g.hold} cell={cell} />
    </button>
  );
}

export function BlockDropNextPanel({
  g,
  firstCell,
  restCell,
  compact = false,
  narrow = false,
}: {
  g: GameState;
  firstCell: number;
  restCell: number;
  compact?: boolean;
  /** 井旁窄欄：只留字，不然「下一個」會被圖示擠成兩行 */
  narrow?: boolean;
}) {
  // 固定三格高度（空位用透明占位）：待機／遊玩中版面高度一致，棋盤不會被擠到破版
  const nextQueue: (PieceType | null)[] = [
    g.bag[0] ?? null,
    g.bag[1] ?? null,
    g.bag[2] ?? null,
  ];
  return (
    <div
      style={{
        ...panelStyle,
        flexShrink: compact ? 0 : undefined,
      }}
      role="img"
      aria-label="下一個方塊預覽"
    >
      <PanelTitle
        icon={narrow ? null : <IconNext size={15} color={MACARON_THEME.inkSoft} />}
        text="下一個"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 3 : 5 }}>
        {(compact ? nextQueue.slice(0, 1) : nextQueue).map((t, i) => (
          <PiecePreview key={i} type={t} cell={i === 0 ? firstCell : restCell} />
        ))}
      </div>
    </div>
  );
}

export function BlockDropScorePanel({
  g,
  wide,
  layoutMode,
}: {
  g: GameState;
  wide: boolean;
  layoutMode: LayoutMode;
}) {
  const linesInLevel = g.lines % 10;
  return (
    <div
      style={{
        ...panelStyle,
        flex: wide ? undefined : 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: wide ? "10px 8px" : "8px 6px",
        minWidth: 0,
      }}
    >
      <div style={{ ...panelLabel, marginBottom: 2 }}>分數</div>
      <div
        aria-label={`分數 ${g.score}`}
        style={{
          color: MACARON_THEME.ink,
          fontSize: layoutMode === "desktop" ? 32 : layoutMode === "tablet" ? 28 : 24,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {g.score}
      </div>
      {g.combo >= 2 && g.status === "playing" ? (
        <div
          style={{
            color: MACARON_THEME.accentPink,
            fontSize: 12,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <IconFlame size={13} /> ×{g.combo}
        </div>
      ) : (
        <div style={{ color: MACARON_THEME.inkSoft, fontSize: 11, fontWeight: 800 }}>
          Lv {g.level}
        </div>
      )}
      <div
        style={{
          width: "100%",
          marginTop: 5,
          display: "grid",
          gap: 3,
        }}
        aria-label={`升級進度 ${linesInLevel}/10 行`}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: MACARON_THEME.inkSoft,
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          <span>升級進度</span>
          <span>{linesInLevel}/10 行</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={linesInLevel}
          style={{
            height: 6,
            overflow: "hidden",
            borderRadius: 999,
            background: "rgba(216,199,255,.46)",
          }}
        >
          <span
            style={{
              display: "block",
              width: `${Math.max(4, linesInLevel * 10)}%`,
              height: "100%",
              borderRadius: "inherit",
              background: "linear-gradient(90deg,#b9f3db,#8ddff0,#c9b4ff)",
              transition: "width .2s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * G-H1 手機單列 HUD：分數 · Lv（連擊時顯示 ×combo）＋細升級條。高度 ≈48px。
 * narrow：矮手機井旁窄欄，分數、Lv 改直排、字縮一號，五位數也放得下。
 */
export function BlockDropCompactScorePanel({
  g,
  narrow = false,
}: {
  g: GameState;
  narrow?: boolean;
}) {
  const linesInLevel = g.lines % 10;
  return (
    <div
      style={{
        ...panelStyle,
        flex: narrow ? undefined : 1,
        minWidth: 0,
        display: "grid",
        gap: 3,
        padding: narrow ? "6px 4px" : "4px 10px",
        alignContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          alignItems: narrow ? "center" : "baseline",
          justifyContent: "center",
          gap: narrow ? 2 : 8,
          minWidth: 0,
        }}
      >
        <span style={panelLabel}>分數</span>
        <span
          aria-label={`分數 ${g.score}`}
          style={{
            color: MACARON_THEME.ink,
            fontSize: narrow ? 18 : 22,
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {g.score}
        </span>
        {g.combo >= 2 && g.status === "playing" ? (
          <span
            style={{
              color: MACARON_THEME.accentPink,
              fontSize: 12,
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <IconFlame size={12} /> ×{g.combo}
          </span>
        ) : (
          <span style={{ color: MACARON_THEME.inkSoft, fontSize: 12, fontWeight: 800 }}>
            Lv {g.level}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={linesInLevel}
        aria-label={`升級進度 ${linesInLevel}/10 行`}
        style={{
          height: 4,
          overflow: "hidden",
          borderRadius: 999,
          background: "rgba(216,199,255,.46)",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${Math.max(4, linesInLevel * 10)}%`,
            height: "100%",
            borderRadius: "inherit",
            background: "linear-gradient(90deg,#b9f3db,#8ddff0,#c9b4ff)",
            transition: "width .2s ease",
          }}
        />
      </div>
    </div>
  );
}
