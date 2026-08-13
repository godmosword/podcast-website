"use client";

import Link from "next/link";
import { getNextGame } from "@/data/games";
import styles from "./GameEndStation.module.css";

export type GameEndMood = "win" | "retry" | "over";

export type GameEndStationProps = {
  mood: GameEndMood;
  /** 主標題；未給時依 mood 抽情緒句。 */
  title?: string;
  scoreLabel?: string;
  /** 0–3 顆星（可選）。 */
  stars?: number;
  /** 通關摘要（步數／道具等），低壓說明不是成績單。 */
  summary?: string;
  onReplay: () => void;
  replayLabel?: string;
  /** 目前遊戲 slug；用來解析下一站。 */
  gameSlug?: string;
  /** 手動指定下一站（優先於 gameSlug）。 */
  nextGame?: { title: string; href: string; emoji?: string };
  hubHref?: string;
  hubLabel?: string;
  /** 隱藏「回遊樂園」文字鏈（遊戲內另有回地圖時用）。 */
  hideHubLink?: boolean;
  /**
   * 取代「下一站」成為主 CTA（例如消消樂「下一關」）。
   * 有值時下一站改為次要連結列。
   */
  mainAction?: { label: string; onClick: () => void };
  className?: string;
};

const MOOD_TITLES: Record<GameEndMood, readonly string[]> = {
  win: ["好厲害！", "太棒了！", "你做到了！"],
  retry: ["差一點！再來一次", "沒關係，再玩就好"],
  over: ["這局好玩！再衝一次", "玩得開心！再來一次"],
};

function pickTitle(
  mood: GameEndMood,
  override: string | undefined,
  salt: number,
): string {
  if (override) return override;
  const pool = MOOD_TITLES[mood];
  return pool[Math.abs(salt) % pool.length] ?? pool[0];
}

/** 三段式結束站：情緒 → 成績 → 再玩（次）／下一站（主）／回遊樂園（弱）。 */
export function GameEndStation({
  mood,
  title,
  scoreLabel,
  stars,
  summary,
  onReplay,
  replayLabel = "再玩一次",
  gameSlug,
  nextGame: nextGameProp,
  hubHref = "/games",
  hubLabel = "回遊樂園",
  hideHubLink = false,
  mainAction,
  className,
}: GameEndStationProps) {
  const resolvedTitle = pickTitle(mood, title, stars ?? scoreLabel?.length ?? 0);
  const fromSlug = gameSlug ? getNextGame(gameSlug) : null;
  const nextGame =
    nextGameProp ??
    (fromSlug
      ? {
          title: fromSlug.title,
          href: fromSlug.href,
          emoji: fromSlug.emoji,
        }
      : undefined);

  const starCount =
    stars == null ? null : Math.max(0, Math.min(3, Math.floor(stars)));

  return (
    <div
      className={`${styles.station}${className ? ` ${className}` : ""}`}
      data-mood={mood}
      role="dialog"
      aria-label={resolvedTitle}
    >
      <p className={styles.moodEmoji} aria-hidden>
        {mood === "win" ? "🎉" : mood === "retry" ? "💪" : "🌈"}
      </p>
      <h2 className={styles.title}>{resolvedTitle}</h2>

      {(starCount != null || scoreLabel || summary) && (
        <div className={styles.scoreRow}>
          {starCount != null ? (
            <p className={styles.stars} aria-label={`${starCount} 顆星`}>
              {"⭐".repeat(starCount)}
              <span className={styles.starEmpty} aria-hidden>
                {"☆".repeat(3 - starCount)}
              </span>
            </p>
          ) : null}
          {scoreLabel ? <p className={styles.scoreLabel}>{scoreLabel}</p> : null}
          {summary ? <p className={styles.summary}>{summary}</p> : null}
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.replayBtn} onClick={onReplay}>
          {replayLabel}
        </button>

        {mainAction ? (
          <button
            type="button"
            className={styles.nextBtn}
            onClick={mainAction.onClick}
          >
            {mainAction.label}
          </button>
        ) : nextGame ? (
          <Link href={nextGame.href} className={styles.nextBtn}>
            去玩：{nextGame.emoji ? `${nextGame.emoji} ` : ""}
            {nextGame.title} ▶
          </Link>
        ) : null}

        {mainAction && nextGame ? (
          <Link href={nextGame.href} className={styles.nextSoft}>
            或去玩 {nextGame.title}
          </Link>
        ) : null}

        {!hideHubLink ? (
          <Link href={hubHref} className={styles.hubLink}>
            {hubLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
