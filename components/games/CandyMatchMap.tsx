"use client";

import type { CandyMatchLevel } from "@/lib/games/candy-match/levels";
import { IconLock, IconStar } from "@/components/games/ClayIcons";
import styles from "./CandyMatchMap.module.css";

/**
 * 選關：下一站是大卡，其餘站收成兩列小路。
 * 第一屏就看得到下一站，不再把 10 站拉成一張長卡。地名只進 aria-label。
 */

type CandyMatchMapProps = {
  levels: readonly CandyMatchLevel[];
  /** 每關星數（0–3） */
  stars: readonly number[];
  /** 已通關數＝下一個可玩的 index */
  maxCleared: number;
  onSelect: (index: number) => void;
};

export function CandyMatchMap({ levels, stars, maxCleared, onSelect }: CandyMatchMapProps) {
  const heroIndex = Math.min(maxCleared, Math.max(0, levels.length - 1));
  const hero = levels[heroIndex];
  const finished = maxCleared >= levels.length;
  const rows = [levels.slice(0, 5), levels.slice(5, 10)];

  if (!hero) return null;

  return (
    <div className={styles.map} data-testid="candy-match-map">
      <div className={styles.hero}>
        <span className={styles.heroBadge}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 固定黏土小圖 */}
          <img
            src={`/games/v2/candy-match/places/${hero.placeIcon}.webp`}
            alt=""
            width={256}
            height={256}
            className={styles.icon}
          />
        </span>
        <button
          type="button"
          className={styles.heroStart}
          data-next={finished ? undefined : "true"}
          aria-label={
            finished
              ? `再走一次第 ${heroIndex + 1} 關 ${hero.place}`
              : `開始第 ${heroIndex + 1} 關 ${hero.place}`
          }
          onClick={() => onSelect(heroIndex)}
        >
          {finished ? "再走一次" : "開始"}
        </button>
      </div>

      <div className={styles.path}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.pathRow}>
            {row.map((lv, col) => {
              const i = rowIndex * 5 + col;
              const locked = i > maxCleared;
              const next = !locked && i === maxCleared;
              const got = Math.max(0, Math.min(3, stars[i] ?? 0));
              return (
                <button
                  key={lv.index}
                  type="button"
                  className={`${styles.node}${next ? ` ${styles.next}` : ""}`}
                  disabled={locked}
                  data-locked={locked ? "true" : undefined}
                  aria-label={`第 ${i + 1} 關 ${lv.place}${locked ? "（未解鎖）" : ""}`}
                  title={lv.place}
                  onClick={() => onSelect(i)}
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
                    {locked ? (
                      <span className={styles.lock} aria-hidden>
                        <IconLock size={24} />
                      </span>
                    ) : null}
                  </span>
                  {!locked ? (
                    <span className={styles.stars} aria-label={`${got} 顆星`}>
                      {[0, 1, 2].map((s) => (
                        <span key={s} aria-hidden className={s < got ? undefined : styles.starEmpty}>
                          <IconStar size={12} color={s < got ? "#ffd34d" : "#d9d0e0"} />
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className={styles.stars} aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
