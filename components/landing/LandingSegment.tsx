import Link from "next/link";
import type { ResolvedLandingSegment } from "@/lib/landing-query";
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
  const eager = index === 0;

  return (
    <section
      id={segment.anchorId}
      className={styles.panel}
      aria-labelledby={`${segment.anchorId}-title`}
    >
      {segment.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={segment.heroImage}
          alt=""
          aria-hidden
          className={styles.bg}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "low"}
          decoding="async"
        />
      ) : (
        <div className={styles.bgFallback} aria-hidden />
      )}
      <div className={styles.scrim} aria-hidden />

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

      {nextAnchorId ? (
        <a
          href={`#${nextAnchorId}`}
          className={styles.next}
          aria-label="捲動到下一個專區"
        >
          <span aria-hidden>⌄</span>
        </a>
      ) : null}
    </section>
  );
}
