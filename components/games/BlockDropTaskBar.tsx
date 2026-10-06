"use client";

/**
 * 《繽紛樂園》任務冒險任務列：取代分數格，圖示＋數字為主。
 * 站名、本站新概念、逐項目標（完成打勾）、輕鬆模式第三顆星「再 N 塊」、挑戰模式「剩 N 塊」。
 */
import type { CSSProperties } from "react";
import { IconStar } from "@/components/games/ClayIcons";
import type { GameState } from "@/lib/games/block-drop/engine";
import { blockGoalStatus, blockGoalTitle, type BlockGoal } from "@/lib/games/block-drop/goals";
import type { BlockRound } from "@/lib/games/block-drop/stages";
import { MACARON_THEME, panelStyle } from "./blockDropTheme";

const mini = (color: string, border: string): CSSProperties => ({
  width: 7,
  height: 7,
  borderRadius: 2,
  background: color,
  border: `1px solid ${border}`,
  boxSizing: "border-box",
});

/** 目標圖示：一排方塊、石頭、兩排疊起來。 */
export function BlockGoalIcon({ goal }: { goal: BlockGoal }) {
  const row = (color: string, border: string) => (
    <span style={{ display: "flex", gap: 1 }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={mini(color, border)} />
      ))}
    </span>
  );
  const box: CSSProperties = { display: "inline-grid", gap: 1, alignContent: "center" };
  if (goal.kind === "clear-stones") {
    return <span aria-hidden style={box}>{row("#cdbfb2", "#6f6258")}{row("#cdbfb2", "#6f6258")}</span>;
  }
  if (goal.kind === "multi-clear") {
    return <span aria-hidden style={box}>{row("#ffe16f", "#c9a032")}{row("#ffe16f", "#c9a032")}</span>;
  }
  return <span aria-hidden style={box}>{row("#8ddff0", "#4aa7bb")}</span>;
}

const UNIT: Record<BlockGoal["kind"], string> = { "clear-rows": "排", "clear-stones": "排", "multi-clear": "次" };

export function BlockDropTaskBar({ round, g }: { round: BlockRound; g: GameState }) {
  const { stage, station, mode } = round;
  const initialStones = stage.stones.length;
  const counter =
    mode === "challenge"
      ? { label: `剩 ${Math.max(0, stage.pieceCap - g.pieces)} 塊`, aria: `還能放 ${Math.max(0, stage.pieceCap - g.pieces)} 塊`, warn: stage.pieceCap - g.pieces <= 3 }
      : null;
  const starLeft = stage.efficiency - g.pieces;
  return (
    <section
      aria-label="本站任務進度"
      style={{ ...panelStyle, flex: 1, minWidth: 0, display: "grid", gap: 3, padding: "4px 8px", textAlign: "left" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ color: MACARON_THEME.ink, fontSize: 13, fontWeight: 900, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          第 {station.index + 1} 站・{station.name}
        </span>
        {counter ? (
          <span
            aria-label={counter.aria}
            style={{
              flexShrink: 0,
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 900,
              color: counter.warn ? "#fff" : MACARON_THEME.ink,
              background: counter.warn ? MACARON_THEME.accentPink : "rgba(189,231,255,.6)",
            }}
          >
            {counter.label}
          </span>
        ) : (
          <span
            aria-label={starLeft > 0 ? `第三顆星：再 ${starLeft} 塊內完成` : "第三顆星：這局塊數已用完，慢慢完成就好"}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 900,
              color: MACARON_THEME.ink,
              background: starLeft > 0 ? "rgba(255,232,137,.5)" : "rgba(255,255,255,.7)",
            }}
          >
            <IconStar size={13} color={starLeft > 0 ? "#ffd34d" : "#d9d0e0"} />
            <span aria-hidden>{starLeft > 0 ? `再 ${starLeft} 塊` : "慢慢來"}</span>
          </span>
        )}
      </div>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
        {stage.goals.map((goal, i) => {
          const s = blockGoalStatus(goal, g, initialStones);
          return (
            <li
              key={i}
              data-done={s.done ? "true" : undefined}
              aria-label={`${blockGoalTitle(goal)}，${s.done ? "完成" : `還差 ${s.remaining} ${UNIT[goal.kind]}`}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 28,
                padding: "2px 8px",
                borderRadius: 12,
                color: MACARON_THEME.ink,
                background: s.done ? "rgba(185,243,219,.7)" : "rgba(255,232,137,.32)",
              }}
            >
              <BlockGoalIcon goal={goal} />
              <span aria-hidden style={{ fontSize: 12, fontWeight: 800 }}>{blockGoalTitle(goal)}</span>
              <span aria-hidden style={{ fontSize: s.done ? 16 : 20, fontWeight: 900, lineHeight: 1, color: s.done ? "#3f8a5a" : MACARON_THEME.ink }}>
                {s.done ? "✓" : s.remaining}
              </span>
            </li>
          );
        })}
        {/* 本站新概念：放得下才顯示（flex-basis 0），窄螢幕不另起一行吃掉井的高度 */}
        <li
          aria-hidden
          style={{
            flex: "1 1 0",
            minWidth: 0,
            alignSelf: "center",
            padding: "0 2px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontSize: 12,
            fontWeight: 800,
            color: MACARON_THEME.inkSoft,
          }}
        >
          {station.concept}
        </li>
      </ul>
    </section>
  );
}
