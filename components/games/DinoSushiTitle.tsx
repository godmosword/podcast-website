"use client";

import { IconPlay, IconStar } from "@/components/games/ClayIcons";
import { PlateArt, SushiArt } from "@/lib/games/dino-sushi/art";
import { DuoDuoArt } from "@/lib/games/dino-sushi/duoduo-art";
import styles from "./DinoSushiView.module.css";

type Props = {
  starsGot: number;
  onStart: () => void;
  onFree: () => void;
};

/** 標題：多多＋一盤壽司的舞台、星星 x/3、一顆大圓「開始」（＝點餐）；「自由做」是小膠囊。 */
export function DinoSushiTitle({ starsGot, onStart, onFree }: Props) {
  return (
    <div className={styles.titleScreen}>
      {/* 舞台與「開始」重複，對讀屏與鍵盤隱藏；小朋友點最大的圖也能開始 */}
      <button type="button" className={styles.titleStage} onClick={onStart} tabIndex={-1} aria-hidden="true">
        <span className={styles.titleDuo}>
          <DuoDuoArt mouth="open" face="yum" />
        </span>
        <span className={styles.titleDish}>
          <SushiArt sushi={{ base: "nigiri", toppings: ["salmon"] }} />
          <PlateArt />
        </span>
        <span className={styles.titleBelt} />
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
