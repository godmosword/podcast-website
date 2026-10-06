"use client";

/**
 * 《繽紛樂園》待機／暫停／結算層（原樣搬自 BlockDropView）。
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { BlockDropReadyDemo } from "@/components/games/BlockDropReadyDemo";
import { GameEndStation } from "@/components/games/GameEndStation";
import { GameResultActions } from "@/components/games/GameResultActions";
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
  onOpenTutorial,
  switchToRelaxedAndRestart,
  onAdventure,
  onFree,
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
  onOpenTutorial: () => void;
  switchToRelaxedAndRestart: () => void;
  /** 待機面主按鈕：進冒險地圖 */
  onAdventure: () => void;
  /** 待機面次按鈕：自由堆疊 */
  onFree: () => void;
  /** 任務冒險的結算（過關／重來／收尾），有值時取代自由堆疊的結算 */
  adventure?: ReactNode;
  /** 暫停層與自由堆疊結算的「回地圖／回標題」 */
  exitAction?: ReactNode;
  /** 矮版面（橫向手機）：待機面不放示範動畫 */
  compact?: boolean;
}) {
  return (
    <>
         {g.status !== "playing" && (
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
               // 井面日夜都是奶油底；GameEndStation 標題吃 --ink，夜間會變白字壓白底，這裡把 token 釘回馬卡龍墨色
               ["--ink" as string]: MACARON_THEME.ink,
               ["--ink-soft" as string]: MACARON_THEME.inkSoft,
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
                  {g.status === "paused" ? (
                    <IconPauseGlyph size={44} color={MACARON_THEME.inkSoft} />
                  ) : compact ? null : (
                    /* 兒童減法審：ready 面用無字玩法示範取代裝飾糖果 icon */
                    <BlockDropReadyDemo />
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  {g.status === "paused" ? "暫停中" : "方塊轉轉"}
                </div>
                {g.status === "ready" && (
                  <>
                    {/* 主按鈕「開始冒險」進地圖；自由堆疊（無盡模式）是次要入口 */}
                    <GameResultActions
                      onReplay={onAdventure}
                      replayLabel={
                        <>
                          <IconPlay size={19} /> 開始冒險
                        </>
                      }
                      replayStyle={{
                        ...primaryBtn(font),
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    />
                    <button
                      type="button"
                      onClick={onFree}
                      style={{ ...secondaryBtn(font), display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      自由堆疊
                    </button>
                  </>
                )}
                {/* 兒童減法審：ready 面不再放「調整難度與模式」（齒輪設定裡已有同一組 radiogroup）；
                    ready 面只剩大 icon、開始、怎麼玩 */}
                {g.status === "ready" && (
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    style={{
                      ...secondaryBtn(font),
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    怎麼玩？
                  </button>
                )}
                {g.status === "paused" ? (
                  <>
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
                ) : null}
              </>
            )}
          </div>
        )}
    </>
  );
}
