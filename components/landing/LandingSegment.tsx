"use client";

import Link from "next/link";
import type { ResolvedLandingSegment } from "@/lib/landing-query";
import { useLandingScroll } from "./LandingScrollContext";
import styles from "./LandingSegment.module.css";

type LandingSegmentProps = {
  segment: ResolvedLandingSegment;
  index: number;
  /** 下一段錨點；最後一段指向 landing-foot（頁尾 snap pane）。 */
  nextAnchorId: string | null;
};

const FOOTER_ANCHOR = "landing-foot";

export default function LandingSegment({
  segment,
  index,
  nextAnchorId,
}: LandingSegmentProps) {
  const landingScroll = useLandingScroll();
  const eager = index === 0;

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
        {segment.heroImage ? (
          <picture className={styles.picture}>
            {segment.heroImagePortrait ? (
              <source
                media="(max-width: 768px)"
                srcSet={segment.heroImagePortrait}
              />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...imgProps} src={segment.heroImage} />
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
          <span className={styles.index} aria-hidden="true">{`0${index + 1}`}</span>
          <h2 id={`${segment.anchorId}-title`} className={styles.title}>
            {segment.title}
          </h2>
        </div>
        <Link
          href={segment.cta.href}
          className={styles.cta}
          {...(segment.cta.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {segment.cta.label} →
        </Link>
      </div>
    </section>
  );
}
