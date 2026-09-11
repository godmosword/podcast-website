import JsonLd from "@/components/JsonLd";
import LandingScrollView from "@/components/landing/LandingScrollView";
import LandingSegment from "@/components/landing/LandingSegment";
import DuduCompanion from "@/components/landing/DuduCompanion";
import LandingEntryFocus from "@/components/landing/LandingEntryFocus";
import LandingBedtimeLayer from "@/components/landing/LandingBedtimeLayer";
import { DUDU_EMOTION_BY_SEGMENT } from "@/data/dudu-emotions";
import { homeSiteIntro } from "@/lib/home-geo";
import { resolveLandingSegments } from "@/lib/landing-query";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import scrollStyles from "./LandingScrollView.module.css";

export default function LandingHub() {
  const siteIntro = homeSiteIntro();
  const segments = resolveLandingSegments();
  const duduItems = segments.map((s) => ({
    anchorId: s.anchorId,
    emotion: DUDU_EMOTION_BY_SEGMENT[s.id],
  }));

  return (
    <>
      <h1 className="sr-only">車車遊樂園：親子故事與手作</h1>
      <JsonLd data={podcastSeriesJsonLd()} />
      <LandingEntryFocus />
      <LandingScrollView className={scrollStyles.root}>
        <LandingBedtimeLayer
          segmentEffects={segments.map((segment) => ({
            anchorId: segment.anchorId,
            hideMoon: Boolean(segment.hideBedtimeMoon),
            veil: segment.bedtimeVeil,
          }))}
        />

        {segments.map((segment, index) => (
          <LandingSegment
            key={segment.id}
            segment={segment}
            index={index}
            siteIntro={index === 0 ? siteIntro : undefined}
            nextAnchorId={segments[index + 1]?.anchorId ?? null}
          />
        ))}

        <DuduCompanion items={duduItems} />
      </LandingScrollView>
    </>
  );
}
