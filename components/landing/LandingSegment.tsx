"use client";

import Link from "next/link";
import type { ResolvedLandingSegment } from "@/lib/landing-query";
import { useLandingScroll } from "./LandingScrollContext";
import styles from "./LandingSegment.module.css";

type LandingSegmentProps = {
  segment: ResolvedLandingSegment;
  index: number;
  /** 下一段錨點；最後一段為 null（不顯示往下箭頭）。 */
  nextAnchorId: string | null;
};

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
        {nextAnchorId ? (
          <a
            href={`#${nextAnchorId}`}
            className={styles.next}
            aria-label="捲動到下一個專區"
            onClick={goToNext}
          >
            <span aria-hidden>⌄</span>
          </a>
        ) : null}
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>{`0${index + 1}`}</p>
        <h2 id={`${segment.anchorId}-title`} className={styles.title}>
          {segment.title}
        </h2>
        <p className={styles.subtitle}>{segment.subtitle}</p>
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
