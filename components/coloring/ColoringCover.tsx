/* eslint-disable @next/next/no-img-element -- Local IndexedDB Blob URLs cannot use the remote image optimizer. */
"use client";

import Image from "next/image";
import { COLORING_COVER_CTA } from "@/lib/coloring/flow";
import styles from "./ColoringCover.module.css";

type ColoringCoverProps = {
  onOpen: () => void;
  recent?: { title: string; src: string; onContinue: () => void };
};

/** 繪本著色封面開場：品牌＋一句話＋單一 CTA＋封面主視覺。 */
export function ColoringCover({ onOpen, recent }: ColoringCoverProps) {
  return (
    <section className={styles.root} aria-label="繪本著色封面">
      <div className={styles.hero} aria-hidden={false}>
        <Image
          src="/games/v2/coloring-book/cover.webp"
          alt="小紅賽車定裝照，繪本著色封面"
          fill
          priority
          sizes="(max-width: 720px) 100vw, 720px"
          className={styles.heroImg}
        />
        <svg
          className={styles.doodleLeft}
          viewBox="0 0 80 120"
          aria-hidden
          focusable="false"
        >
          <path
            d="M12 20c18 8 28 22 20 40M28 28c-6 14 4 30 18 34M40 70c12 6 22 20 10 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle
            cx="18"
            cy="96"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <svg
          className={styles.doodleRight}
          viewBox="0 0 80 120"
          aria-hidden
          focusable="false"
        >
          <path
            d="M60 18c-16 10-24 26-14 42M48 36c8 12 2 28-12 34M36 78c-10 8-16 22-4 34"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M58 92h14M65 85v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>車車遊樂園</p>
        {/* G-M7：遊戲名由 sticky 抬頭的 h1 持有，封面不再重複一次 */}
        <p className={styles.lead}>把故事裡的車車朋友，塗上你喜歡的顏色！</p>
        {recent ? (
          <button
            type="button"
            className={styles.resume}
            onClick={recent.onContinue}
          >
            <img src={recent.src} alt="" />
            繼續塗：{recent.title}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.cta}
          onClick={onOpen}
          aria-label={COLORING_COVER_CTA}
        >
          {COLORING_COVER_CTA}
        </button>
      </div>
    </section>
  );
}
