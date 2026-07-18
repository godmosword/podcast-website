"use client";

import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import type { Status } from "@/lib/games/car-adventure/types";
import { GameResultActions } from "@/components/games/GameResultActions";
import styles from "./CarAdventureMenu.module.css";

export type CarAdventureMenuProps = {
  status: Status;
  levelIndex: number;
  score: number | null;
  adventureStars?: Readonly<Record<number, number>>;
  kidsMode?: boolean;
  coverSrc: string;
  onSelectLevel: (index: number) => void;
  onStart: () => void;
  onResume: () => void;
  onOpenTutorial?: () => void;
};

const TITLE: Record<Status, string> = {
  ready: "準備出發！",
  paused: "暫停中",
  won: "全關卡通關！",
  over: "再試一次吧",
  playing: "",
};

const EMOJI: Record<Status, string> = {
  ready: "🏁",
  paused: "⏸",
  won: "🏆",
  over: "💥",
  playing: "",
};

const LEVEL_HINTS = [
  "先熟悉左右移動與跳躍",
  "加入平台與短缺口",
  "開始練習高低跳躍",
  "尖刺與敵人變多，記得慢慢來",
  "黃昏賽道：連續跳躍挑戰",
  "最後一站，收集金幣再衝刺",
  "黏土工坊：用衝刺穿過能力門",
  "月光終點：三種能力一起挑戰",
] as const;

/**
 * 入口／暫停／結算選單：放在 PixelGameCanvas 外，避免 overflow:hidden 裁切 CTA。
 */
export function CarAdventureMenu({
  status,
  levelIndex,
  score,
  adventureStars = {},
  kidsMode = false,
  coverSrc,
  onSelectLevel,
  onStart,
  onResume,
  onOpenTutorial,
}: CarAdventureMenuProps) {
  if (status === "playing") return null;

  return (
    <section
      className={styles.panel}
      style={{ ["--menu-cover" as string]: `url('${coverSrc}')` }}
      aria-label="車車大冒險選單"
      data-testid="car-adventure-menu"
    >
      <div className={styles.hero} aria-hidden>
        <span className={styles.emoji}>{EMOJI[status]}</span>
      </div>
      <h2 className={styles.title}>{TITLE[status]}</h2>
      {(status === "won" || status === "over") && score != null && (
        <p className={styles.score}>得分 ⭐ {score}</p>
      )}

      {status === "ready" && (
        <>
          <p className={styles.hint}>
            左右移動、上鍵或空白鍵跳躍；踩搗蛋車、吃金幣、躲尖刺，衝向終點旗！
          </p>
          <p className={styles.assistNote}>
            {kidsMode ? "🧒 兒童模式：5 顆愛心，跳躍判定更寬鬆" : "每關約 1–2 分鐘，失敗後可以立刻再試一次"}
          </p>
          {onOpenTutorial && (
            <button
              type="button"
              className={styles.tutorialBtn}
              onClick={onOpenTutorial}
            >
              怎麼玩？
            </button>
          )}
          <div className={styles.levelBlock}>
            <p className={styles.levelLabel} id="car-adventure-level-label">
              選擇關卡
            </p>
            <div
              className={styles.levelChips}
              role="listbox"
              aria-labelledby="car-adventure-level-label"
            >
              {CAR_ADVENTURE_LEVELS.map((lv, i) => {
                const selected = levelIndex === i;
                const earned = Math.max(
                  0,
                  Math.min(3, Math.floor(adventureStars[i] ?? 0)),
                );
                return (
                  <button
                    key={lv.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={
                      selected
                        ? `${styles.chip} ${styles.chipSelected}`
                        : styles.chip
                    }
                    onClick={() => onSelectLevel(i)}
                  >
                    <span className={styles.chipNum}>{i + 1}</span>
                    <span className={styles.chipName}>{lv.name}</span>
                    <span
                      className={styles.chipStars}
                      aria-label={`已得 ${earned} 顆顯示星`}
                    >
                      {"★".repeat(earned)}
                      <span aria-hidden>{"☆".repeat(3 - earned)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className={styles.levelHint} aria-live="polite">
              {LEVEL_HINTS[levelIndex] ?? "探索新的車車冒險"}
            </p>
          </div>
        </>
      )}

      <div className={styles.ctaBar}>
        {status === "paused" ? (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onResume}
            aria-label="繼續遊戲"
          >
            繼續 ▶
          </button>
        ) : (
          <GameResultActions
            onReplay={onStart}
            replayLabel={status === "ready" ? "開始冒險 ▶" : "再玩一次 🔁"}
            replayClassName={styles.primaryBtn}
          />
        )}
      </div>
    </section>
  );
}
