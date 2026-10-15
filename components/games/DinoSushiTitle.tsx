"use client";

import Image from "next/image";
import { IconPlay, IconStar } from "@/components/games/ClayIcons";
import { gameBySlug } from "@/data/games";
import { duoduoStickerSrc } from "@/lib/games/dino-sushi/duoduo-sticker";
import { TapButton } from "./DinoSushiPiece";
import styles from "./DinoSushiView.module.css";

const TITLE_COVER_SRC = gameBySlug("dino-sushi").art.cover;

type Props = {
  starsGot: number;
  stickerCount: number;
  stickerTotal: number;
  stickerNew: boolean;
  onStart: () => void;
  onFree: () => void;
  onBook: () => void;
};

/** 標題：與遊樂園卡片同一張迴轉壽司店封面、星星 x/3、一顆大圓「開始」（＝點餐）；「自由做」旁邊是貼紙書。 */
export function DinoSushiTitle({
  starsGot,
  stickerCount,
  stickerTotal,
  stickerNew,
  onStart,
  onFree,
  onBook,
}: Props) {
  const bookLabel = `貼紙書，已收集 ${stickerCount} 張，共 ${stickerTotal} 張${stickerNew ? "，有新貼紙" : ""}`;
  return (
    <div className={styles.titleScreen}>
      {/* 舞台與「開始」重複，對讀屏與鍵盤隱藏；小朋友點最大的圖也能開始 */}
      <TapButton className={styles.titleStage} onTap={onStart} tabIndex={-1} aria-hidden="true">
        <Image
          src={TITLE_COVER_SRC}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 799px) calc(100vw - 64px), 55vw"
          className={styles.titleCover}
        />
      </TapButton>
      <div className={styles.titlePanel}>
        {/* 頁面唯一 h1 屬 GamePageShell */}
        <h2 className={styles.titleHeading}>多多肚子餓了！</h2>
        <p className={styles.titleStars} role="img" aria-label={`已經拿到 ${starsGot} 顆星，全部 3 顆`}>
          <IconStar size={22} />
          <b aria-hidden>{starsGot}</b>
          <span aria-hidden>/ 3</span>
        </p>
        <div className={styles.titleStart}>
          <TapButton className={styles.startButton} onTap={onStart} aria-label="開始幫多多做壽司">
            <IconPlay size={46} />
          </TapButton>
          <span className={styles.startCaption} aria-hidden>
            開始
          </span>
        </div>
        <div className={styles.titleActions}>
          <TapButton className={styles.freeButton} onTap={onFree}>
            自由做
          </TapButton>
          <TapButton className={styles.bookButton} onTap={onBook} aria-label={bookLabel}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 現有多多笑臉當書本圖示 */}
            <img className={styles.bookArt} src={duoduoStickerSrc("laugh")} alt="" draggable={false} />
            <span className={styles.bookCaption} aria-hidden>
              貼紙書
            </span>
            <span className={styles.bookCount} aria-hidden>
              {stickerCount}/{stickerTotal}
            </span>
            {stickerNew ? (
              <span className={styles.bookNew} aria-hidden>
                新
              </span>
            ) : null}
          </TapButton>
        </div>
      </div>
    </div>
  );
}
