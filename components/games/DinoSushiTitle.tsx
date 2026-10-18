"use client";

import { useState } from "react";
import Image from "next/image";
import { IconLock, IconPlay, IconStar } from "@/components/games/ClayIcons";
import { gameBySlug } from "@/data/games";
import { duoduoStickerSrc } from "@/lib/games/dino-sushi/duoduo-sticker";
import { TapButton } from "./DinoSushiPiece";
import styles from "./DinoSushiView.module.css";

const TITLE_COVER_SRC = gameBySlug("dino-sushi").art.cover;

export type SushiDayFace = {
  day: number;
  name: string;
  src: string;
  stars: number;
  /** 資料上開著（前一天通關，或舊檔已經通關）。 */
  unlocked: boolean;
  /** 這一階段玩得到。第 5–8 天先鎖著。 */
  playable: boolean;
  /** 大開始鈕會進的那一天。 */
  current: boolean;
};

type Props = {
  days: readonly SushiDayFace[];
  stickerCount: number;
  stickerTotal: number;
  stickerNew: boolean;
  onStart: () => void;
  onPickDay: (day: number) => void;
  onFree: () => void;
  onBook: () => void;
};

/** 標題：封面、八張臉、一顆大圓「開始」。第 5–8 天看得到但還不能玩。 */
export function DinoSushiTitle({
  days,
  stickerCount,
  stickerTotal,
  stickerNew,
  onStart,
  onPickDay,
  onFree,
  onBook,
}: Props) {
  const bookLabel = `貼紙書，已收集 ${stickerCount} 張，共 ${stickerTotal} 張${stickerNew ? "，有新貼紙" : ""}`;
  const [wiggle, setWiggle] = useState<{ day: number; seq: number } | null>(null);
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
        <div className={styles.dayScroll}>
          <ul className={styles.dayRow}>
            {days.map((day) => {
              const locked = !day.playable || !day.unlocked;
              const status = locked ? "（未解鎖）" : day.current ? "，現在要玩" : "";
              const label = `第 ${day.day} 天，${day.name}，已經拿到 ${day.stars} 顆星，全部 3 顆${status}`;
              const shaking = locked && wiggle?.day === day.day;
              return (
                <li key={day.day}>
                  <TapButton
                    className={styles.dayButton}
                    aria-label={label}
                    aria-disabled={locked ? true : undefined}
                    data-current={!locked && day.current ? "true" : undefined}
                    data-locked={locked ? "true" : undefined}
                    onTap={() => {
                      if (locked) {
                        setWiggle((current) => ({ day: day.day, seq: (current?.seq ?? 0) + 1 }));
                        return;
                      }
                      onPickDay(day.day);
                    }}
                  >
                    <span className={styles.dayBody}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 現成客人貼紙與多多表情，不另生圖 */}
                      <img className={styles.dayFace} src={day.src} alt="" draggable={false} />
                      <span className={styles.dayName} aria-hidden>
                        {day.name}
                      </span>
                      <span className={styles.dayStars} aria-hidden>
                        {[0, 1, 2].map((index) => (
                          <IconStar
                            key={index}
                            size={12}
                            color={index < day.stars ? "#ffd34d" : "#e4d3b4"}
                          />
                        ))}
                      </span>
                    </span>
                    {locked ? (
                      <span
                        className={styles.dayLock}
                        data-lock
                        data-shake={shaking && wiggle ? (wiggle.seq % 2 === 0 ? "a" : "b") : undefined}
                        aria-hidden
                        onAnimationEnd={() => {
                          setWiggle((current) => (current?.day === day.day ? null : current));
                        }}
                      >
                        <IconLock size={16} />
                      </span>
                    ) : null}
                  </TapButton>
                </li>
              );
            })}
          </ul>
        </div>
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
