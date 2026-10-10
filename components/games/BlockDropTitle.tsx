"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { IconChevronLeft, IconChevronRight, IconPlay, IconRotate, IconSparkle, IconStar } from "@/components/games/ClayIcons";
import { IconFreeStack } from "@/components/games/BlockDropIcons";
import { CLAY_BLOCK_COLORS } from "@/components/games/blockDropTheme";
import { gameBySlug } from "@/data/games";
import type { PieceType } from "@/lib/games/block-drop/pieces";
import styles from "./BlockDropTitle.module.css";

const COVER_SRC = gameBySlug("block-drop").art.cover;

function Block({ type, col, row }: { type: PieceType; col?: number; row?: number }) {
  return (
    <span
      className={styles.block}
      style={{ background: CLAY_BLOCK_COLORS[type], gridColumn: col, gridRow: row } as CSSProperties}
    />
  );
}

/**
 * 標題頁三步驟圖解：孩子多半還不識字，用遊戲裡的方塊示範「左右移 → 轉一轉 → 排滿消掉」。
 * 三格圖框同大小、同一種淡白底，不替任何一格加強調色（會像被選中）；圖全部 aria-hidden，讀屏只唸每步的短動詞。
 */
function TitleSteps() {
  return (
    <ol className={styles.steps} aria-label="玩法三步驟">
      <li className={styles.step}>
        <span className={styles.art} aria-hidden>
          <span className={styles.arrow}>
            <IconChevronLeft size={18} />
          </span>
          <span className={styles.piece} style={{ "--cols": 2 } as CSSProperties}>
            <Block type="O" />
            <Block type="O" />
            <Block type="O" />
            <Block type="O" />
          </span>
          <span className={styles.arrow}>
            <IconChevronRight size={18} />
          </span>
        </span>
        <span className={styles.label}>移一移</span>
      </li>
      <li className={styles.step}>
        <span className={styles.art} aria-hidden>
          <span className={styles.piece} style={{ "--cols": 3 } as CSSProperties}>
            <Block type="T" col={2} row={1} />
            <Block type="T" col={1} row={2} />
            <Block type="T" col={2} row={2} />
            <Block type="T" col={3} row={2} />
          </span>
          <span className={styles.arrow}>
            <IconRotate size={20} />
          </span>
        </span>
        <span className={styles.label}>轉一轉</span>
      </li>
      <li className={styles.step}>
        <span className={styles.art} aria-hidden>
          <span className={styles.piece} style={{ "--cols": 4 } as CSSProperties}>
            <Block type="I" />
            <Block type="Z" />
            <Block type="O" />
            <Block type="S" />
          </span>
          <span className={styles.sparkle}>
            <IconSparkle size={20} />
          </span>
        </span>
        <span className={styles.label}>消一消</span>
      </li>
    </ol>
  );
}

type BlockDropTitleProps = {
  starsGot: number;
  starsTotal: number;
  /** 大圓「開始」與封面：進冒險地圖 */
  onStart: () => void;
  /** 小鈕：自由堆疊（無盡模式） */
  onFree: () => void;
};

/**
 * 標題頁（對齊消消樂）：遊樂園卡片同一張封面＋標題＋星星總數＋三步圖解＋一顆大圓「開始」。
 * 自由堆疊是給大一點孩子的次要入口，放成小鈕；速度在齒輪設定裡，這裡不放。
 */
export function BlockDropTitle({ starsGot, starsTotal, onStart, onFree }: BlockDropTitleProps) {
  return (
    <div className={styles.root} data-testid="block-drop-title">
      <div className={styles.screen}>
        {/* 小朋友會去點最大的那張圖：點了也進冒險。與「開始冒險」重複，對讀屏與鍵盤隱藏 */}
        <button type="button" className={styles.cover} onClick={onStart} tabIndex={-1} aria-hidden="true">
          <Image src={COVER_SRC} alt="" fill priority sizes="(max-width: 799px) calc(100vw - 64px), 55vw" className={styles.coverImg} />
        </button>
        <div className={styles.panel}>
          {/* 頁面唯一 h1 屬 GamePageShell；這裡是畫面標題，用 h2 */}
          <h2 className={styles.heading}>準備疊方塊！</h2>
          <p className={styles.stars} role="img" aria-label={`已經拿到 ${starsGot} 顆星，全部 ${starsTotal} 顆`}>
            <IconStar size={22} />
            <b aria-hidden>{starsGot}</b>
            <span aria-hidden>/ {starsTotal}</span>
          </p>
          <TitleSteps />
          <div className={styles.start}>
            <button type="button" className={styles.startButton} onClick={onStart} aria-label="開始冒險">
              <IconPlay size={46} />
            </button>
            <span className={styles.startCaption} aria-hidden>
              開始
            </span>
          </div>
          <button type="button" className={styles.free} onClick={onFree}>
            <IconFreeStack size={18} />
            自由堆疊
          </button>
        </div>
      </div>
    </div>
  );
}
