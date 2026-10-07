"use client";

import { useState } from "react";
import type { CandyMatchLevel } from "@/lib/games/candy-match/levels";
import { CANDY_MODES, type CandyMode } from "@/lib/games/candy-match/stages";
import { IconLock, IconStar } from "@/components/games/ClayIcons";
import { CandyGoalIcon } from "@/components/games/CandyMatchTaskBar";
import type { CandyGoal } from "@/lib/games/candy-match/tasks";
import styles from "./CandyMatchMap.module.css";

/**
 * 選關：玩法提示、下一站與任務、開始按鈕及 1–10 站蛇行路線。
 * 點已解鎖的站換成預覽；點鎖住的站說明要先完成哪一站。
 */

export type CandyStationPreview = {
  goals: readonly CandyGoal[];
  summary: string;
  moves: number;
  replay: boolean;
};

type CandyMatchMapProps = {
  levels: readonly CandyMatchLevel[];
  /** 每關累積獎章星數（0–3） */
  stars: readonly number[];
  /** 已通關數＝下一個可玩的 index */
  maxCleared: number;
  mode: CandyMode;
  onModeChange: (mode: CandyMode) => void;
  onTutorial: () => void;
  previewFor: (index: number) => CandyStationPreview;
  onStart: (index: number) => void;
};

function ModeToggle({ mode, onChange }: { mode: CandyMode; onChange: (mode: CandyMode) => void }) {
  return (
    <div className={styles.modeToggle} role="radiogroup" aria-label="玩法">
      {CANDY_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={mode === m.id}
          className={styles.modeOption}
          aria-label={`${m.label}。${m.hint}`}
          onClick={() => onChange(m.id)}
        >
          <span className={styles.modeLabel}>{m.label}</span>
          <span className={styles.modeHint}>{m.hint}</span>
        </button>
      ))}
    </div>
  );
}

export function CandyMatchMap({
  levels,
  stars,
  maxCleared,
  mode,
  onModeChange,
  onTutorial,
  previewFor,
  onStart,
}: CandyMatchMapProps) {
  const nextIndex = Math.min(maxCleared, Math.max(0, levels.length - 1));
  const finished = maxCleared >= levels.length;
  const [picked, setPicked] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const heroIndex = picked != null && picked <= maxCleared ? picked : nextIndex;
  const hero = levels[heroIndex];
  const rows = [levels.slice(0, 5), levels.slice(5, 10)];

  if (!hero) return null;
  const preview = previewFor(heroIndex);
  const isNext = !finished && heroIndex === maxCleared;
  const startLabel = heroIndex < maxCleared ? "再玩一次" : "開始";
  const nextLevel = levels[nextIndex];

  return (
    <div className={styles.map} data-testid="candy-match-map">
      <div className={styles.modeArea}>
        <ModeToggle mode={mode} onChange={onModeChange} />
        <button type="button" className={styles.helpButton} onClick={onTutorial}>
          怎麼玩？
        </button>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroInfo}>
          <p className={styles.heroStation}>
            第 {heroIndex + 1} 站・{hero.place}
          </p>
          <p className={styles.heroTask}>
            <span className={styles.heroGoalIcons} aria-hidden>
              {preview.goals.map((goal, i) => (
                <CandyGoalIcon key={i} goal={goal} size={22} />
              ))}
            </span>
            {preview.summary}
            {mode === "challenge" ? `・${preview.moves} 步` : ""}
            {preview.replay ? "・換新任務" : ""}
          </p>
        </div>
        <button
          type="button"
          className={styles.heroStart}
          data-next={isNext ? "true" : undefined}
          aria-label={`${startLabel}：第 ${heroIndex + 1} 站 ${hero.place}`}
          onClick={() => onStart(heroIndex)}
        >
          {startLabel}
        </button>
      </div>

      <p className={styles.notice} role="status">
        {notice}
      </p>

      <div className={styles.path}>
        {rows.map((row, rowIndex) => {
          const visualRow = rowIndex === 1 ? row.slice().reverse() : row;
          return (
            <div key={rowIndex} className={styles.pathRow} data-row={rowIndex}>
              {visualRow.map((lv) => {
                const i = lv.index;
                const locked = i > maxCleared;
                const next = !locked && i === maxCleared;
                const got = Math.max(0, Math.min(3, stars[i] ?? 0));
                return (
                  <button
                    key={lv.index}
                    type="button"
                    className={`${styles.node}${next ? ` ${styles.next}` : ""}`}
                    aria-disabled={locked || undefined}
                    aria-current={i === heroIndex ? "true" : undefined}
                    data-locked={locked ? "true" : undefined}
                    aria-label={`第 ${i + 1} 站 ${lv.place}${locked ? "（未解鎖）" : `，${got} 顆星`}`}
                    title={lv.place}
                    onClick={() => {
                      if (locked) {
                        // 大卡直接換成該先完成的那一站：畫面本身就是答案
                        setPicked(nextIndex);
                        setNotice(`先完成第 ${nextIndex + 1} 站「${nextLevel?.place ?? ""}」，就能往前走喔！`);
                        return;
                      }
                      setNotice("");
                      setPicked(i);
                    }}
                  >
                    <span className={styles.badge}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 固定 256px 黏土小圖 */}
                      <img
                        src={`/games/v2/candy-match/places/${lv.placeIcon}.webp`}
                        alt=""
                        width={256}
                        height={256}
                        className={styles.icon}
                        loading={i < 4 ? "eager" : "lazy"}
                      />
                      <span className={styles.nodeNumber} aria-hidden>
                        {i + 1}
                      </span>
                      {locked ? (
                        <span className={styles.lock} aria-hidden>
                          <IconLock size={24} />
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.stars} aria-hidden>
                      {locked
                        ? null
                        : [0, 1, 2].map((s) => (
                            <span key={s} className={s < got ? undefined : styles.starEmpty}>
                              <IconStar size={12} color={s < got ? "#ffd34d" : "#d9d0e0"} />
                            </span>
                          ))}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className={styles.rewardNote}>
        <span className={styles.rewardStar} aria-hidden>
          <IconStar size={18} color="#e8a44a" />
        </span>
        星星是每站累積的獎章，兩種玩法都算。
      </p>
    </div>
  );
}
