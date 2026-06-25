import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import LandingCarMascot from "@/components/landing/LandingCarMascot";
import LandingScrollView from "@/components/landing/LandingScrollView";
import LandingSegment from "@/components/landing/LandingSegment";
import SegmentNav from "@/components/landing/SegmentNav";
import { resolveLandingSegments } from "@/lib/landing-query";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import hubStyles from "./LandingHub.module.css";
import scrollStyles from "./LandingScrollView.module.css";

export default function LandingHub() {
  const segments = resolveLandingSegments();
  const navItems = segments.map((s) => ({
    anchorId: s.anchorId,
    label: s.cta.label,
  }));

  return (
    <>
      <JsonLd data={podcastSeriesJsonLd()} />
      <LandingScrollView className={scrollStyles.root}>
        <SegmentNav items={navItems} />

        {segments.map((segment, index) => (
          <LandingSegment
            key={segment.id}
            segment={segment}
            index={index}
            nextAnchorId={segments[index + 1]?.anchorId ?? null}
          />
        ))}

        <div className={hubStyles.footer}>
          <SiteFooter layout="home" />
        </div>
      </LandingScrollView>
      <LandingCarMascot />
    </>
  );
}
