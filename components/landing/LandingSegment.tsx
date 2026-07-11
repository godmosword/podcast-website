"use client";

import Link from "next/link";
import type { ResolvedLandingSegment } from "@/lib/landing-query";
import { landingHeroPictureSources } from "@/lib/modern-image-src";
import { useLandingScroll } from "./LandingScrollContext";
import styles from "./LandingSegment.module.css";

type LandingSegmentProps = {
  segment: ResolvedLandingSegment;
  index: number;
  /** 下一段錨點；最後一段指向 landing-foot（頁尾 snap pane）。 */
  nextAnchorId: string | null;
};

const FOOTER_ANCHOR = "landing-foot";
/** 首頁頁尾 ConnectHub 錨點（Growth-P1b） */
const CONNECT_ANCHOR = "connect";

export default function LandingSegment({
  segment,
  index,
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

  function goToConnect(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (landingScroll) {
      landingScroll.scrollToSegment(CONNECT_ANCHOR);
      return;
    }
    document.getElementById(CONNECT_ANCHOR)?.scrollIntoView({ block: "start" });
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

      {nextAnchorId ? (
        <a
          href={`#${nextAnchorId}`}
          className={styles.next}
          aria-label={
            nextAnchorId === FOOTER_ANCHOR
              ? "捲動到頁尾"
              : "捲動到下一個專區"
          }
          onClick={goToNext}
        >
          <span className={styles.nextChevron} aria-hidden />
        </a>
      ) : null}

      <div className={styles.content}>
        <div className={styles.headline}>
          <span
            className={`${styles.index} scrollEnter scrollEnterStagger1`}
            aria-hidden="true"
          >{`0${index + 1}`}</span>
          <h2
            id={`${segment.anchorId}-title`}
            className={`${styles.title} scrollEnter scrollEnterStagger2`}
          >
            {segment.title}
          </h2>
        </div>
        <div className={`${styles.ctaRow} scrollEnter scrollEnterStagger3`}>
          <Link
            href={segment.cta.href}
            className={styles.cta}
            {...(segment.cta.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {segment.cta.label} →
          </Link>
          {index === 0 ? (
            <a
              href={`#${CONNECT_ANCHOR}`}
              className={styles.subscribeCta}
              onClick={goToConnect}
            >
              訂閱收聽
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
