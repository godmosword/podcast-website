"use client";

import Link from "next/link";
import { useRef } from "react";
import { getNextGame } from "@/data/games";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { IconCheer, IconConfetti, IconRainbow, IconStar } from "./ClayIcons";
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
  const stationRef = useRef<HTMLDivElement>(null);

  // 原本是手寫 trap，但守衛寫成「焦點不在站內就早退」——焦點一旦逸出
  // （切到網址列再切回來、或落到 body）就再也圈不回來。共用 hook 對這個
  // 情況會主動把焦點拉回容器，且 focusables 會濾掉隱藏元素。
  useFocusTrap(true, stationRef);

  return (
    <div
      ref={stationRef}
      className={`${styles.station}${className ? ` ${className}` : ""}`}
      data-mood={mood}
      role="dialog"
      aria-modal="true"
      aria-label={resolvedTitle}
    >
      {/* G-M3：主視覺走 ClayIcons，不用 emoji 當 sprite（GAMEKIT-ART-BIBLE） */}
      <p className={styles.moodEmoji} aria-hidden>
        {mood === "win" ? (
          <IconConfetti size={44} />
        ) : mood === "retry" ? (
          <IconCheer size={44} />
        ) : (
          <IconRainbow size={44} />
        )}
      </p>
      <h2 className={styles.title}>{resolvedTitle}</h2>

      {(starCount != null || scoreLabel || summary) && (
        <div className={styles.scoreRow}>
          {starCount != null ? (
            <p className={styles.stars} aria-label={`${starCount} 顆星`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < starCount ? undefined : styles.starEmpty} aria-hidden>
                  <IconStar size={26} color={i < starCount ? "#ffd34d" : "#d9d0e0"} />
                </span>
              ))}
            </p>
          ) : null}
          {scoreLabel ? <p className={styles.scoreLabel}>{scoreLabel}</p> : null}
          {summary ? <p className={styles.summary}>{summary}</p> : null}
        </div>
      )}

      <div className={styles.actions}>
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

        <button type="button" className={styles.replayBtn} onClick={onReplay}>
          {replayLabel}
        </button>

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
