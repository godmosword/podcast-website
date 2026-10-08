"use client";

import Image from "next/image";
import { COLORING_PAGES } from "@/data/coloring-pages";
import { getColoringPage } from "@/lib/coloring-query";
import { COLORING_COVER_CTA, COLORING_COVER_STEPS } from "@/lib/coloring/flow";
import { CrayonIcon } from "./ColoringToolbarIcons";
import styles from "./ColoringCover.module.css";

/** 三格圖解用的示範頁：線稿 → 塗一半 → 塗好。 */
const DEMO_PAGE = getColoringPage("char-小紅賽車") ?? COLORING_PAGES[0]!;
const STEP_SIZES = "(max-width: 720px) 30vw, 150px";

type ColoringCoverProps = {
  onOpen: () => void;
};

/** 繪本著色封面開場：封面主視覺＋看圖就懂的三格流程＋大顆「開始塗」。 */
export function ColoringCover({ onOpen }: ColoringCoverProps) {
  return (
    <section className={styles.root} aria-label="繪本塗塗鴉封面">
      <div className={styles.hero} aria-hidden={false}>
        <Image
          src="/games/v2/coloring-book/cover.webp"
          alt="小紅賽車定裝照，繪本塗塗鴉封面"
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
        {/* 3–7 歲還不太識字：用三格圖說流程，每格只留三個大字給大人唸。 */}
        <ol className={styles.steps} aria-label="怎麼玩">
          <li className={styles.step}>
            <span className={styles.pic}>
              <Image src={DEMO_PAGE.lineArtSrc} alt="" fill sizes={STEP_SIZES} className={styles.picImg} />
            </span>
            <span className={styles.stepLabel}>{COLORING_COVER_STEPS[0]}</span>
          </li>
          <li className={styles.step}>
            <span className={styles.pic}>
              <Image src={DEMO_PAGE.lineArtSrc} alt="" fill sizes={STEP_SIZES} className={styles.picImg} />
              <Image
                src={DEMO_PAGE.referenceSrc}
                alt=""
                fill
                sizes={STEP_SIZES}
                className={`${styles.picImg} ${styles.halfColored}`}
              />
              <CrayonIcon className={styles.picCrayon} />
            </span>
            <span className={styles.stepLabel}>{COLORING_COVER_STEPS[1]}</span>
          </li>
          <li className={styles.step}>
            <span className={styles.pic}>
              <Image src={DEMO_PAGE.referenceSrc} alt="" fill sizes={STEP_SIZES} className={styles.picImg} />
              <svg className={styles.picStar} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z" />
              </svg>
            </span>
            <span className={styles.stepLabel}>{COLORING_COVER_STEPS[2]}</span>
          </li>
        </ol>
        <button type="button" className={styles.cta} onClick={onOpen}>
          <CrayonIcon className={styles.ctaIcon} />
          {COLORING_COVER_CTA}
        </button>
      </div>
    </section>
  );
}
