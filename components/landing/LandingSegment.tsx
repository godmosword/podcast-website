"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import LandingPlayLink from "./LandingPlayLink";
import ReplayIntroLink from "./ReplayIntroLink";
import type { ResolvedLandingSegment } from "@/lib/landing-query";
import { landingHeroPictureSources } from "@/lib/modern-image-src";
import { useLandingScroll } from "./LandingScrollContext";
import styles from "./LandingSegment.module.css";

type LandingSegmentProps = {
  segment: ResolvedLandingSegment;
  index: number;
  /** 首段 answer-first 網站導言：DOM 留 sr-only 供 GEO／輔助科技，畫面不顯示。 */
  siteIntro?: string;
  /** 下一段錨點；最後一段指向 landing-foot（頁尾 snap pane）。 */
  nextAnchorId: string | null;
};

const FOOTER_ANCHOR = "landing-foot";
/** 首頁頁尾 ConnectHub 錨點（Growth-P1b） */

export default function LandingSegment({
  segment,
  index,
  siteIntro,
  nextAnchorId,
}: LandingSegmentProps) {
  const landingScroll = useLandingScroll();
  const eager = index === 0;
  const heroSources = segment.heroImage
    ? landingHeroPictureSources(segment.heroImage, segment.heroImagePortrait)
    : null;

  function goToNext(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!nextAnchorId) return;
    e.preventDefault();
    if (landingScroll) {
      landingScroll.scrollToSegment(nextAnchorId);
      return;
    }
    document.getElementById(nextAnchorId)?.scrollIntoView({ block: "start" });
  }

  const imgProps = {
    alt: "",
    "aria-hidden": true as const,
    loading: (eager ? "eager" : "lazy") as "eager" | "lazy",
    fetchPriority: (eager ? "high" : "low") as "high" | "low",
    decoding: "async" as const,
    className: styles.bg,
  };

  return (
    <section
      id={segment.anchorId}
      className={styles.panel}
      aria-labelledby={`${segment.anchorId}-title`}
    >
      <div className={styles.visual} aria-hidden={!!segment.heroImage}>
        {heroSources ? (
          <picture className={styles.picture}>
            {heroSources.portrait ? (
              <>
                <source
                  media="(max-width: 768px)"
                  type="image/avif"
                  srcSet={heroSources.portrait.avif}
                />
                <source
                  media="(max-width: 768px)"
                  type="image/webp"
                  srcSet={heroSources.portrait.webp}
                />
                <source
                  media="(max-width: 768px)"
                  srcSet={heroSources.portrait.jpg}
                />
              </>
            ) : null}
            <source type="image/avif" srcSet={heroSources.landscape.avif} />
            <source type="image/webp" srcSet={heroSources.landscape.webp} />
            <img
              src={heroSources.landscape.jpg}
              alt=""
              aria-hidden="true"
              loading={imgProps.loading}
              fetchPriority={imgProps.fetchPriority}
              decoding={imgProps.decoding}
              className={imgProps.className}
              sizes="100vw"
            />
          </picture>
        ) : (
          <div className={styles.bgFallback} />
        )}
        <div className={styles.scrim} />
      </div>

      <div className={styles.content}>
        <div className={styles.headline}>
          <h2
            id={`${segment.anchorId}-title`}
            className={styles.titleHidden}
          >
            {segment.title.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}
          </h2>
          {segment.subtitle ? (
            <p className={`${styles.subtitle} scrollEnter scrollEnterStagger2`}>
              {segment.subtitle}
            </p>
          ) : null}
          {siteIntro ? <p className="sr-only">{siteIntro}</p> : null}
        </div>
        <div className={styles.ctaRow}>
          {segment.play ? (
            <LandingPlayLink
              href={segment.play.href}
              slug={segment.play.slug}
              audioSrc={segment.play.audioSrc}
              className={`${styles.playCta} scrollEnter scrollEnterStagger3`}
            >
              <Icon name="play" size={18} className={styles.playIcon} />
              {segment.play.label}
            </LandingPlayLink>
          ) : null}
          <Link
            href={segment.cta.href}
            className={`${segment.play ? styles.subscribeCta : styles.cta} scrollEnter scrollEnterStagger3`}
            aria-label={
              segment.cta.external
                ? `${segment.cta.label}（另開視窗）`
                : undefined
            }
            {...(segment.cta.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {segment.cta.label}
            {segment.cta.external ? (
              <Icon name="external" size={15} className={styles.ctaIcon} />
            ) : (
              " →"
            )}
          </Link>
          {index === 0 ? (
            <ReplayIntroLink
              className={`${styles.replayIntro} scrollEnter scrollEnterStagger3`}
            />
          ) : null}
        </div>
      </div>
      {nextAnchorId ? (
        <a
          href={`#${nextAnchorId}`}
          className={styles.moreSkip}
          data-landing-more-hint
          aria-label={
            nextAnchorId === FOOTER_ANCHOR
              ? "捲動到頁尾"
              : "捲動到下一個專區"
          }
          onClick={goToNext}
        >
          <svg
            viewBox="0 0 24 20"
            width="24"
            height="20"
            aria-hidden
            focusable="false"
          >
            <path
              d="M5 4.5 L12 10.5 L19 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 11 L12 17 L19 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ) : null}
    </section>
  );
}
