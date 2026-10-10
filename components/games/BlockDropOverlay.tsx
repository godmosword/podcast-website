"use client";

/**
 * 《繽紛樂園》暫停／結算層。標題頁由 BlockDropTitle 負責，這裡不再有待機面。
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconPauseGlyph, IconPlay, IconSprout } from "@/components/games/ClayIcons";
import type { GameState } from "@/lib/games/block-drop/engine";
import type { BlockDropDifficulty } from "@/lib/gamekit/progress/settings";
import { MACARON_THEME, primaryBtn, secondaryBtn } from "./blockDropTheme";

export function BlockDropOverlay({
  g,
  topOut,
  newBest,
  font,
  reduced,
  blockDropDifficulty,
  onResume,
  onRestart,
  switchToRelaxedAndRestart,
  adventure,
  exitAction,
  compact = false,
}: {
  g: GameState;
  topOut: boolean;
  newBest: boolean;
  font: string;
  reduced: boolean;
  blockDropDifficulty: BlockDropDifficulty;
  onResume: () => void;
  onRestart: () => void;
  switchToRelaxedAndRestart: () => void;
  /** 任務冒險的結算（過關／重來／收尾），有值時取代自由堆疊的結算 */
  adventure?: ReactNode;
  /** 暫停層與自由堆疊結算的「回地圖／回標題」 */
  exitAction?: ReactNode;
  /** 矮版面（橫向手機）：內距收小 */
  compact?: boolean;
}) {
  return (
    <>
         {(g.status === "paused" || g.status === "over" || g.status === "won") && (
           <div
             style={{
               position: "absolute",
               inset: 0,
               zIndex: 5,
               background:
                 g.status === "paused"
                   ? "rgba(255,250,242,.76)"
                   : "rgba(255,250,242,.96)",
               backdropFilter: "blur(3px)",
               borderRadius: 16,
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               justifyContent: "center",
               gap: g.status === "paused" ? 10 : 12,
               color: MACARON_THEME.ink,
               // 井面日夜都是奶油底；GameEndStation 的標題與按鈕吃主題 token，夜間會變白字壓白底、
               // 小圓鈕變黑塊，這裡把 token 釘回日間值（同消消樂結算層）
               ["--ink" as string]: MACARON_THEME.ink,
               ["--ink-soft" as string]: MACARON_THEME.inkSoft,
               ["--cta-solid-bg" as string]: "#3a2410",
               ["--cta-solid-fg" as string]: "#fff",
               ["--cta-warm-to" as string]: "#ffbd6f",
               ["--cta-soft-bg" as string]: "#fff",
               ["--cta-soft-fg" as string]: MACARON_THEME.ink,
               ["--cta-soft-line" as string]: "rgba(93,74,103,.16)",
               ["--cta-quiet-fg" as string]: "#1f7268",
               ["--elev-1" as string]: "0 1px 2px rgba(52,48,43,.04), 0 8px 24px rgba(52,48,43,.08)",
               ["--focus-ring" as string]: MACARON_THEME.ink,
               textAlign: "center",
               padding: compact ? 8 : 16,
               overflowY: "auto",
             }}
          >
            {adventure && (g.status === "over" || g.status === "won") ? (
              adventure
            ) : g.status === "over" ? (
              <>
                <GameEndStation
                  mood="over"
                  title={topOut ? "方塊堆到頂了" : "這局好玩！"}
                  scoreLabel={
                    newBest
                      ? `分數 ${g.score} · 新紀錄！`
                      : `分數 ${g.score}`
                  }
                  onReplay={onRestart}
                  replayLabel="再玩一次"
                  gameSlug="block-drop"
                  extraActions={exitAction}
                />
                {topOut && blockDropDifficulty !== "relaxed" ? (
                  <button
                    type="button"
                    onClick={switchToRelaxedAndRestart}
                    style={{
                      ...secondaryBtn(font),
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <IconSprout size={16} /> 換慢慢
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div
                  style={{
                    lineHeight: 0,
                    animation: reduced ? "none" : "popIn .35s ease-out",
                  }}
                >
                  <IconPauseGlyph size={44} color={MACARON_THEME.inkSoft} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>暫停中</div>
                <button
                  type="button"
                  onClick={onResume}
                  style={{
                    ...primaryBtn(font),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <IconPlay size={19} /> 繼續
                </button>
                {exitAction}
                {/* PLAY-IA-6：暫停層補兒童最自然的離站出口（對齊 GamePageShell） */}
                <Link
                  href="/games"
                  style={{
                    ...secondaryBtn(font),
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  回遊樂園
                </Link>
              </>
            )}
          </div>
        )}
    </>
  );
}
