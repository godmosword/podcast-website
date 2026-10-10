"use client";

import type { ReactNode } from "react";
import { IconStar } from "@/components/games/ClayIcons";
import styles from "./ResultStars.module.css";

/** 一個沒拿到的星星條件：條件圖＋兩三個字（例如「不用道具」「7 塊內」）。 */
export type ResultStarHint = {
  key: string;
  text: string;
  mark: ReactNode;
  /** 條件圖的顏色（currentColor 圖示用）；不給就跟字同色 */
  markColor?: string;
};

type ResultStarsProps = {
  /** 1–3 顆 */
  stars: number;
  /** 沒達成的條件；拿滿三顆時給空陣列 */
  hints: readonly ResultStarHint[];
  animate: boolean;
};

/**
 * 結算星星（消消樂、方塊轉轉共用）：三顆一排、由左往右亮（孩子只看亮幾顆）。
 * 沒拿滿才在下面放小籤「條件圖＋兩三個字＋＋★」告訴大人還差什麼；拿滿就只有星星。
 * 放在結算的淺色卡面上，顏色固定、日夜不反轉。
 */
export function ResultStars({ stars, hints, animate }: ResultStarsProps) {
  const got = Math.max(1, Math.min(3, Math.floor(stars)));
  return (
    <div className={styles.resultStars}>
      <p className={styles.starRow} role="img" aria-label={`拿到 ${got} 顆星，共 3 顆`} data-animate={animate ? "true" : undefined}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.resultStar} data-met={i < got ? "true" : undefined} aria-hidden>
            <IconStar size={i === 1 ? 64 : 52} color={i < got ? "#ffd34d" : "#e7e1ea"} />
          </span>
        ))}
      </p>
      {hints.length > 0 ? (
        <ul className={styles.starHints} aria-label="還能多拿星星">
          {hints.map((h) => (
            <li key={h.key} className={styles.starHint} data-rule={h.key}>
              <span className={styles.starHintMark} style={h.markColor ? { color: h.markColor } : undefined} aria-hidden>
                {h.mark}
              </span>
              {h.text}
              <span className={styles.starHintPlus} aria-hidden>
                +<IconStar size={16} />
              </span>
              <span className="sr-only">過關，多拿一顆星</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
