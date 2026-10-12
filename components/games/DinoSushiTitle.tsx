"use client";

import Image from "next/image";
import { IconPlay, IconStar } from "@/components/games/ClayIcons";
import { gameBySlug } from "@/data/games";
import styles from "./DinoSushiView.module.css";

const TITLE_COVER_SRC = gameBySlug("dino-sushi").art.cover;

type Props = {
  starsGot: number;
  onStart: () => void;
  onFree: () => void;
};

/** 標題：與遊樂園卡片同一張迴轉壽司店封面、星星 x/3、一顆大圓「開始」（＝點餐）；「自由做」是小膠囊。 */
export function DinoSushiTitle({ starsGot, onStart, onFree }: Props) {
  return (
    <div className={styles.titleScreen}>
      {/* 舞台與「開始」重複，對讀屏與鍵盤隱藏；小朋友點最大的圖也能開始 */}
      <button type="button" className={styles.titleStage} onClick={onStart} tabIndex={-1} aria-hidden="true">
        <Image
          src={TITLE_COVER_SRC}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 799px) calc(100vw - 64px), 55vw"
          className={styles.titleCover}
        />
      </button>
      <div className={styles.titlePanel}>
        {/* 頁面唯一 h1 屬 GamePageShell */}
        <h2 className={styles.titleHeading}>多多肚子餓了！</h2>
        <p className={styles.titleStars} role="img" aria-label={`已經拿到 ${starsGot} 顆星，全部 3 顆`}>
          <IconStar size={22} />
          <b aria-hidden>{starsGot}</b>
          <span aria-hidden>/ 3</span>
        </p>
        <div className={styles.titleStart}>
          <button type="button" className={styles.startButton} onClick={onStart} aria-label="開始幫多多做壽司">
            <IconPlay size={46} />
          </button>
          <span className={styles.startCaption} aria-hidden>
            開始
          </span>
        </div>
        <button type="button" className={styles.freeButton} onClick={onFree}>
          自由做
        </button>
      </div>
    </div>
  );
}
