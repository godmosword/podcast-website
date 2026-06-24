import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import LandingSegment from "@/components/landing/LandingSegment";
import SegmentNav from "@/components/landing/SegmentNav";
import { resolveLandingSegments } from "@/lib/landing-query";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import styles from "./LandingHub.module.css";

export default function LandingHub() {
  const segments = resolveLandingSegments();
  const navItems = segments.map((s) => ({
    anchorId: s.anchorId,
    label: s.cta.label,
  }));

  return (
    <>
      <JsonLd data={podcastSeriesJsonLd()} />
      <SegmentNav items={navItems} />

      {segments.map((segment, index) => (
        <LandingSegment
          key={segment.id}
          segment={segment}
          index={index}
          nextAnchorId={segments[index + 1]?.anchorId ?? null}
        />
      ))}

      <div className={styles.footer}>
        <SiteFooter layout="home" />
      </div>
    </>
  );
}
